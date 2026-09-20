import { Middleware as ChannelsMiddleware, type MiddlewareOptions } from '@moleculer/channels';
import { type BrokerOptions, Context, Service, ServiceBroker } from 'moleculer';
import { afterEach, describe, expect, it } from 'vitest';

import { channel, service } from '../src/index.js';

interface ChannelDefinition {
    group?: string;
    handler?: unknown;
    maxInFlight?: number;
    maxRetries?: number;
    name?: string;
}

interface ChannelAdapter {
    addPrefixTopic(topicName: string): string;
}

type ChannelService = Service & {
    emitLocalChannelHandler(channelName: string, payload: unknown, raw?: unknown): unknown;
};

describe('decorated Moleculer channels', () => {
    const brokers: ServiceBroker[] = [];

    afterEach(async () => {
        await Promise.all(
            brokers.splice(0).map(async (broker) => {
                if (broker.started) await broker.stop();
            }),
        );
    });

    function createBroker(
        options: MiddlewareOptions = { adapter: 'Fake' },
        brokerOptions: Partial<BrokerOptions> = {},
    ): ServiceBroker {
        const broker = new ServiceBroker({
            logger: false,
            metrics: false,
            middlewares: [ChannelsMiddleware(options)],
            transporter: null,
            tracing: false,
            ...brokerOptions,
        });
        brokers.push(broker);
        return broker;
    }

    /**
     * Physical topic an adapter derives for a published name. The `sendToChannel` wrapper applies
     * this prefix unconditionally, so it is the topic a producer really targets.
     */
    function publishedTopic(broker: ServiceBroker, name: string): string {
        const adapter = (broker as ServiceBroker & { channelAdapter: ChannelAdapter })
            .channelAdapter;
        return adapter.addPrefixTopic(name);
    }

    function definitions(instance: Service, property = 'channels'): Record<string, unknown> {
        const schema = instance.schema as unknown as Record<string, Record<string, unknown>>;
        return schema[property] ?? {};
    }

    function definition(instance: Service, name: string, property = 'channels'): ChannelDefinition {
        const registered = definitions(instance, property)[name];
        if (!registered) throw new Error(`Channel "${name}" is not registered.`);
        return registered as ChannelDefinition;
    }

    function deferred<Value>(): { promise: Promise<Value>; resolve: (value: Value) => void } {
        let resolve: (value: Value) => void = () => {};
        const promise = new Promise<Value>((res) => {
            resolve = res;
        });
        return { promise, resolve: (value) => resolve(value) };
    }

    /**
     * The channels middleware attaches its local handler trigger from an async `serviceCreated`
     * hook, which Moleculer does not await while creating a service.
     */
    async function settleServiceCreated(): Promise<void> {
        await new Promise((resolve) => setImmediate(resolve));
    }

    it('registers decorated channels in the service schema', () => {
        @service({ name: 'orders' })
        class OrdersService extends Service {
            @channel({ group: 'orders-group', maxInFlight: 2 })
            protected onOrderCreated(payload: { id: number }) {
                return payload.id;
            }

            @channel({ group: 'payments', name: 'payment.processed' })
            protected onPaymentProcessed(payload: { id: number }) {
                return payload.id * 2;
            }
        }

        const broker = createBroker();
        const instance = broker.createService(OrdersService);

        expect(Object.keys(definitions(instance))).toEqual(['onOrderCreated', 'payment.processed']);
        expect(definition(instance, 'onOrderCreated')).toMatchObject({
            group: 'orders-group',
            maxInFlight: 2,
        });
        // The channels middleware only applies the adapter prefix when the definition has no name.
        expect(definition(instance, 'onOrderCreated').name).toBeUndefined();
        expect(definition(instance, 'payment.processed')).toMatchObject({
            group: 'payments',
            name: 'payment.processed',
        });
        expect(typeof definition(instance, 'onOrderCreated').handler).toBe('function');
    });

    it('binds decorated channel handlers to the service instance', async () => {
        @service({ name: 'billing' })
        class BillingService extends Service {
            @channel({ group: 'billing' })
            protected onInvoice(payload: { id: number }) {
                return `${this.name}:${payload.id}`;
            }
        }

        const broker = createBroker();
        const instance = broker.createService(BillingService) as ChannelService;
        await settleServiceCreated();

        // The middleware runs object channel definitions synchronously, so the trigger may return
        // the handler result directly.
        const result: unknown = await instance.emitLocalChannelHandler('onInvoice', { id: 7 });
        expect(result).toBe('billing:7');
    });

    it('delivers broker messages to decorated channels', async () => {
        const received: unknown[] = [];
        const delivered = deferred<unknown>();

        @service({ name: 'dispatch' })
        class DispatchService extends Service {
            @channel({ group: 'dispatch' })
            protected onDispatch(payload: { id: number }) {
                received.push(payload);
                delivered.resolve(payload);
                return 'dispatched';
            }
        }

        const broker = createBroker();
        broker.createService(DispatchService);
        await broker.start();

        await broker.sendToChannel('onDispatch', { id: 11 });

        await expect(delivered.promise).resolves.toEqual({ id: 11 });
        expect(received).toEqual([{ id: 11 }]);
        expect(typeof broker.sendToChannel).toBe('function');
        expect(
            (broker as ServiceBroker & { channelAdapter?: unknown }).channelAdapter,
        ).toBeDefined();
    });

    it('passes a Moleculer context to channels that opt in', async () => {
        const received = deferred<Context<{ id: number }>>();

        @service({ name: 'audit' })
        class AuditService extends Service {
            @channel({ context: true, group: 'audit' })
            protected onAudited(ctx: Context<{ id: number }>) {
                received.resolve(ctx);
                return ctx.params.id;
            }
        }

        const broker = createBroker();
        broker.createService(AuditService);
        await broker.start();

        await broker.sendToChannel('onAudited', { id: 3 });

        const ctx = await received.promise;
        expect(ctx).toBeInstanceOf(Context);
        expect(ctx.params).toEqual({ id: 3 });
        expect((ctx as Context & { channelName?: string }).channelName).toBe('onAudited');
    });

    it('merges explicit service channel options over decorated channels', () => {
        @service({
            name: 'configurable',
            channels: {
                configured: { group: 'explicit', maxInFlight: 5 },
                extra: {
                    group: 'extra',
                    handler: () => 'extra',
                },
            },
        })
        class ConfigurableService extends Service {
            @channel({ group: 'decorated', maxRetries: 1 })
            protected configured() {
                return 'configured';
            }
        }

        const broker = createBroker();
        const instance = broker.createService(ConfigurableService);

        expect(Object.keys(definitions(instance)).sort()).toEqual(['configured', 'extra']);
        expect(definition(instance, 'configured')).toMatchObject({
            group: 'explicit',
            maxInFlight: 5,
            maxRetries: 1,
        });
        expect(typeof definition(instance, 'extra').handler).toBe('function');

        // The decorated handler survived the merge.
        const decoratedHandler = definition(instance, 'configured').handler as () => string;
        expect(decoratedHandler.call(instance)).toBe('configured');
        const explicitHandler = definition(instance, 'extra').handler as () => string;
        expect(explicitHandler.call(instance)).toBe('extra');
    });

    it('registers channels under a custom schema property', async () => {
        const delivered = deferred<unknown>();

        @service({ name: 'multi-adapter' })
        class MultiAdapterService extends Service {
            @channel({ group: 'redis-group' }, { schemaProperty: 'redisChannels' })
            protected onRedisTopic(payload: { id: number }) {
                delivered.resolve(payload);
                return payload.id;
            }
        }

        const broker = createBroker({ adapter: 'Fake', schemaProperty: 'redisChannels' });
        const instance = broker.createService(MultiAdapterService);

        expect(instance.schema.channels).toBeUndefined();
        expect(Object.keys(definitions(instance, 'redisChannels'))).toEqual(['onRedisTopic']);

        await broker.start();
        await broker.sendToChannel('onRedisTopic', { id: 5 });

        await expect(delivered.promise).resolves.toEqual({ id: 5 });
    });

    it('prefixes a keyed channel exactly like a hand-written schema key', async () => {
        const delivered = deferred<unknown>();

        @service({ name: 'dispatch' })
        class DispatchService extends Service {
            @channel({ group: 'dispatch', key: 'v1.delivery.ready' })
            protected onDeliveryReady(payload: { id: number }) {
                delivered.resolve(payload);
                return payload.id;
            }

            @channel({ group: 'external', name: 'external.topic' })
            protected onExternalTopic(payload: unknown) {
                return payload;
            }
        }

        const broker = createBroker({ adapter: 'Fake' }, { namespace: 'support-mail' });
        const instance = broker.createService(DispatchService);

        expect(Object.keys(definitions(instance)).sort()).toEqual([
            'external.topic',
            'v1.delivery.ready',
        ]);
        // `key` is moldecor-only: it names the schema key and must not reach the middleware, so the
        // adapter prefix is applied to it and `sendToChannel(key)` reaches the consumer.
        expect(definition(instance, 'v1.delivery.ready')).toMatchObject({ group: 'dispatch' });
        expect(definition(instance, 'v1.delivery.ready').name).toBeUndefined();
        expect(definition(instance, 'v1.delivery.ready')).not.toHaveProperty('key');
        // An explicit `name` is the physical topic, so it opts out of the adapter prefix while
        // `sendToChannel` keeps prefixing: such a channel only receives external messages.
        expect(definition(instance, 'external.topic').name).toBe('external.topic');
        expect(publishedTopic(broker, 'external.topic')).toBe('support-mail.external.topic');

        await broker.start();
        await broker.sendToChannel('v1.delivery.ready', { id: 42 });

        await expect(delivered.promise).resolves.toEqual({ id: 42 });
    });

    it('separates the schema key from the verbatim topic', () => {
        @service({ name: 'bridge' })
        class BridgeService extends Service {
            @channel({ group: 'bridge', key: 'delivery.ready', name: 'external.delivery.ready' })
            protected onExternalDelivery(payload: unknown) {
                return payload;
            }
        }

        const broker = createBroker();
        const instance = broker.createService(BridgeService);

        expect(Object.keys(definitions(instance))).toEqual(['delivery.ready']);
        expect(definition(instance, 'delivery.ready')).toMatchObject({
            group: 'bridge',
            name: 'external.delivery.ready',
        });
        expect(definition(instance, 'delivery.ready')).not.toHaveProperty('key');
    });

    it('merges explicit service channel options over a keyed channel', () => {
        @service({
            name: 'keyed-configurable',
            channels: {
                'v1.delivery.ready': { maxRetries: 4 },
            },
        })
        class KeyedConfigurableService extends Service {
            @channel({ group: 'dispatch', key: 'v1.delivery.ready', maxInFlight: 2 })
            protected onDeliveryReady() {
                return 'ready';
            }
        }

        const broker = createBroker();
        const instance = broker.createService(KeyedConfigurableService);

        expect(definition(instance, 'v1.delivery.ready')).toMatchObject({
            group: 'dispatch',
            maxInFlight: 2,
            maxRetries: 4,
        });
        const handler = definition(instance, 'v1.delivery.ready').handler as () => string;
        expect(handler.call(instance)).toBe('ready');
    });

    it('replaces mixin channel maps with decorated channels', () => {
        const mixin = {
            channels: {
                mixinChannel: {
                    group: 'mixin',
                    handler: () => 'mixin',
                },
            },
        };

        @service({ name: 'composed', mixins: [mixin] })
        class ComposedService extends Service {
            @channel({ group: 'own' })
            protected ownChannel() {
                return 'own';
            }
        }

        const broker = createBroker();
        const instance = broker.createService(ComposedService);

        // Moleculer replaces unknown schema properties instead of merging them, so channel maps
        // provided by other mixins do not survive next to decorated channels.
        expect(Object.keys(definitions(instance))).toEqual(['ownChannel']);
    });
});
