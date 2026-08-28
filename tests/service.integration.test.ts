import type { Context } from 'moleculer';
import { Service, ServiceBroker } from 'moleculer';
import { afterEach, describe, expect, it } from 'vitest';

import {
    action,
    created,
    defineSettings,
    event,
    merged,
    method,
    type ServiceMixin,
    service,
    started,
    stopped,
} from '../src/index.js';

describe('decorated Moleculer services', () => {
    const brokers: ServiceBroker[] = [];

    afterEach(async () => {
        await Promise.all(
            brokers.splice(0).map(async (broker) => {
                if (broker.started) await broker.stop();
            }),
        );
    });

    function createBroker(): ServiceBroker {
        const broker = new ServiceBroker({
            logger: false,
            metrics: false,
            transporter: null,
            tracing: false,
        });
        brokers.push(broker);
        return broker;
    }

    it('runs actions, methods, events, lifecycles, and native mixin precedence', async () => {
        const calls: string[] = [];
        const settings = defineSettings({
            $shutdownTimeout: 1_000,
            source: 'service',
            nested: {
                service: true,
            },
        });

        @service({
            name: 'integration-nested-decorated',
            dependencies: ['nested-dependency'],
        })
        class NestedDecoratedMixin extends Service {
            @action()
            protected nestedDecoratedAction() {
                return 'nested-decorated-action';
            }

            @method
            protected nestedDecoratedMethod() {
                return 'nested-decorated-method';
            }
        }

        const nestedMixin: ServiceMixin = {
            mixins: [NestedDecoratedMixin],
            settings: {
                nested: {
                    nestedMixin: true,
                },
            },
            methods: {
                nestedMethod() {
                    return 'nested';
                },
            },
        };

        const plainMixin: ServiceMixin = {
            dependencies: ['plain-dependency'],
            mixins: [nestedMixin],
            settings: {
                fromPlainMixin: true,
                nested: {
                    plainMixin: true,
                },
            },
            actions: {
                selected() {
                    return 'plain';
                },
                plain() {
                    return 'plain-action';
                },
            },
            events: {
                'entity.changed': {
                    group: 'integration',
                    handler() {
                        calls.push('plain-event');
                    },
                },
            },
            methods: {
                plainMethod() {
                    return 'plain-method';
                },
            },
            created() {
                calls.push('plain-created');
            },
            started() {
                calls.push('plain-started');
            },
            stopped() {
                calls.push('plain-stopped');
            },
        };

        @service({
            name: 'integration-decorated-mixin',
            dependencies: ['decorated-dependency'],
        })
        class DecoratedMixin extends Service {
            @action({ name: 'selected' })
            protected selected() {
                return 'decorated-mixin';
            }

            @event({ name: 'entity.changed', group: 'integration' })
            protected onChanged() {
                calls.push('decorated-event');
            }

            @method
            protected decoratedMethod() {
                return 'decorated-method';
            }

            @created
            protected created() {
                calls.push('decorated-created');
            }

            @started
            protected async started() {
                calls.push('decorated-started');
            }

            @stopped
            protected async stopped() {
                calls.push('decorated-stopped');
            }
        }

        @service({
            name: 'integration-subject',
            dependencies: ['explicit-dependency'],
            mixins: [DecoratedMixin, plainMixin],
            settings,
            actions: {
                selected: {
                    cache: false,
                    hooks: {
                        before: (_ctx: Context) => {
                            calls.push('options-before');
                        },
                        after: (_ctx: Context, result: unknown) => {
                            calls.push('options-after');
                            return result;
                        },
                    },
                },
            },
            created() {
                calls.push('options-created');
            },
            started() {
                calls.push('options-started');
            },
            stopped() {
                calls.push('options-stopped');
            },
        })
        class Subject extends Service<typeof settings> {
            @action({
                name: 'selected',
                hooks: {
                    before: (_ctx: Context) => {
                        calls.push('decorator-before');
                    },
                    after: (_ctx: Context, result: unknown) => {
                        calls.push('decorator-after');
                        return result;
                    },
                },
            })
            protected selected() {
                calls.push('selected-handler');
                return 'subject';
            }

            @action()
            protected settingsAction() {
                return this.settings.nested.service;
            }

            @event({ name: 'entity.changed', group: 'integration' })
            protected onChanged(_ctx: Context) {
                calls.push('subject-event');
            }

            @event()
            protected localEvent() {
                calls.push('default-event');
            }

            @method
            protected ownMethod() {
                return 'own-method';
            }

            @merged
            protected merged() {
                calls.push('subject-merged');
            }

            @created
            protected created() {
                calls.push('subject-created');
            }

            @started
            protected async started() {
                calls.push('subject-started');
            }

            @stopped
            protected async stopped() {
                calls.push('subject-stopped');
            }
        }

        const broker = createBroker();
        for (const name of [
            'nested-dependency',
            'plain-dependency',
            'decorated-dependency',
            'explicit-dependency',
        ]) {
            broker.createService({ name });
        }
        const instance = broker.createService(Subject) as Service & {
            decoratedMethod(): string;
            nestedDecoratedMethod(): string;
            nestedMethod(): string;
            ownMethod(): string;
            plainMethod(): string;
        };

        expect(calls).toEqual([
            'subject-merged',
            'plain-created',
            'decorated-created',
            'subject-created',
            'options-created',
        ]);
        expect(instance.settings).toMatchObject({
            fromPlainMixin: true,
            nested: {
                nestedMixin: true,
                plainMixin: true,
                service: true,
            },
            source: 'service',
        });
        expect(instance.nestedMethod()).toBe('nested');
        expect(instance.nestedDecoratedMethod()).toBe('nested-decorated-method');
        expect(instance.plainMethod()).toBe('plain-method');
        expect(instance.decoratedMethod()).toBe('decorated-method');
        expect(instance.ownMethod()).toBe('own-method');
        expect(instance.schema.dependencies).toEqual(
            expect.arrayContaining([
                'nested-dependency',
                'plain-dependency',
                'decorated-dependency',
                'explicit-dependency',
            ]),
        );

        await broker.start();
        expect(calls.slice(-4)).toEqual([
            'plain-started',
            'decorated-started',
            'subject-started',
            'options-started',
        ]);

        await expect(broker.call('integration-subject.selected')).resolves.toBe('subject');
        expect(calls.slice(-5)).toEqual([
            'decorator-before',
            'options-before',
            'selected-handler',
            'options-after',
            'decorator-after',
        ]);
        await expect(broker.call('integration-subject.settingsAction')).resolves.toBe(true);
        await expect(broker.call('integration-subject.nestedDecoratedAction')).resolves.toBe(
            'nested-decorated-action',
        );

        await broker.broadcastLocal('entity.changed', { id: 1 });
        expect(calls).toContain('plain-event');
        expect(calls).toContain('decorated-event');
        expect(calls).toContain('subject-event');
        await broker.broadcastLocal('localEvent');
        expect(calls).toContain('default-event');

        await broker.stop();
        expect(calls.slice(-4)).toEqual([
            'options-stopped',
            'subject-stopped',
            'decorated-stopped',
            'plain-stopped',
        ]);
    });

    it('lets explicit service options disable a decorated action', () => {
        @service({
            name: 'disabled-action',
            actions: {
                disabled: false,
            },
        })
        class Subject extends Service {
            @action()
            protected disabled() {
                return 'should-not-run';
            }
        }

        const instance = createBroker().createService(Subject);
        expect(instance.actions.disabled).toBeUndefined();
    });

    it('keeps decorator metadata isolated between classes', () => {
        @service({ name: 'isolated-a' })
        class ServiceA extends Service {
            @action()
            protected onlyA() {
                return 'a';
            }
        }

        @service({ name: 'isolated-b' })
        class ServiceB extends Service {
            @action()
            protected onlyB() {
                return 'b';
            }
        }

        const broker = createBroker();
        const first = broker.createService(ServiceA);
        const second = broker.createService(ServiceB);

        expect(Object.keys(first.actions)).toEqual(['onlyA']);
        expect(Object.keys(second.actions)).toEqual(['onlyB']);
    });
});
