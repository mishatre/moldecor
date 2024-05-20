import assert from 'assert';
import { EventSchema } from 'moleculer';

import { PartialRequired, getMetadata, setMetadata } from '../utils/index.js';

export type EventOptions = PartialRequired<Exclude<EventSchema, 'handler'>, 'name'>;

export type LifeCycleEventNames = 'created' | 'started' | 'stopped';

export function Event(options?: EventSchema): MethodDecorator {
    return <T>(
        target: Object,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<T>,
    ) => {
        const handler = descriptor.value;
        assert(handler && typeof handler === 'function', 'An event handler must be a function');

        const name = propertyKey.toString();
        const events =
            getMetadata<{ [key: string]: EventSchema }>(target, 'events', 'service') || {};

        events[name] = Object.assign({}, { handler, name }, options);

        setMetadata(target, 'events', events, 'service');
        return descriptor;
    };
}

export function createLifeCycleEvent(name: LifeCycleEventNames): MethodDecorator {
    if (!name) {
        throw new ReferenceError('Lifecycle event name required');
    }

    return <T>(
        target: Object,
        _propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<T>,
    ) => {
        const handler = descriptor.value;
        assert(
            handler && typeof handler === 'function',
            'An lifecycle event handler must be a function',
        );

        setMetadata(target, name, handler, 'service');
        return descriptor;
    };
}

export const Created = createLifeCycleEvent('created') as MethodDecorator;
export const Started = createLifeCycleEvent('started') as MethodDecorator;
export const Stopped = createLifeCycleEvent('stopped') as MethodDecorator;
