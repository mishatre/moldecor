import type { Channel } from '@moleculer/channels';
import type { Context } from 'moleculer';
import { Service } from 'moleculer';

import { type ChannelOptions, channel, service } from '../src/index.js';

const options: ChannelOptions = {
    context: false,
    deadLettering: {
        enabled: true,
        errorInfoTTL: 86_400,
        queueName: 'FAILED_MESSAGES',
        transformErrorToHeaders: (error) => ({ message: error.message }),
        transformHeadersToErrorData: (headers) => ({ ...headers }),
    },
    group: 'orders',
    maxInFlight: 4,
    maxRetries: 2,
    redis: {
        startID: '$',
    },
    tracing: {
        enabled: true,
        spanName: (ctx) => `span:${ctx.params.id}`,
        tags: { params: true },
    },
};

// Decorated options must stay assignable to the channel definition type of the middleware.
const definition: Channel = { ...options, handler: () => undefined };
void definition;

// Adapter specific options are passed through untouched.
const adapterOptions: ChannelOptions = {
    amqp: { queueOptions: { durable: true } },
    kafka: { fromBeginning: true },
};
void adapterOptions;

// @ts-expect-error Channel handlers come from the decorated method.
const invalidHandler: ChannelOptions = { handler() {} };
void invalidHandler;

// @ts-expect-error Channels are bound to a service by Moleculer.
const invalidService: ChannelOptions = { service: {} };
void invalidService;

@service({
    name: 'typed-channels',
    channels: {
        explicit: {
            group: 'explicit',
            handler: () => 'explicit',
        },
    },
})
class TypedChannelsService extends Service {
    @channel({ group: 'orders' })
    protected onOrder(payload: { id: number }) {
        return payload.id;
    }

    @channel({ context: true, group: 'orders' })
    protected onOrderContext(ctx: Context<{ id: number }>) {
        return ctx.params.id;
    }

    @channel({ name: 'external.topic' }, { schemaProperty: 'redisChannels' })
    protected onExternal(payload: unknown) {
        return payload;
    }
}

void TypedChannelsService;
