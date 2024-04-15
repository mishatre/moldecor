import { ActionSchema, Context } from 'moleculer';

import { PartialRequired, getMetadata, setMetadata } from '../utils/index.js';

export type ActionOptions = PartialRequired<Exclude<ActionSchema, 'handler'>, 'name'>;

type MethodDecorator<T> = (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T> | void;

export function Action<P = {}, T = (ctx: Context<P>) => void>(
    options?: ActionOptions,
): MethodDecorator<T> {
    return (target, propertyKey, descriptor) => {
        const handler = descriptor.value;

        if (!handler || typeof handler !== 'function') {
            throw new TypeError('An action must be a function');
        }

        const name = propertyKey.toString();
        const actions = getMetadata(target, 'actions', 'service') || {};
        actions[name] = Object.assign({}, { handler, name, visibility: 'public' }, options);

        setMetadata(target, 'actions', actions, 'service');
        return descriptor;
    };
}
