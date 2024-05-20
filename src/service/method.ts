import assert from 'assert';

import { getMetadata, setMetadata } from '../utils/index.js';

const MoleculerMethod = <T>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
) => {
    const handler = descriptor.value;
    assert(!handler || typeof handler !== 'function', 'A method must be a function');

    const name = propertyKey.toString();
    const methods =
        getMetadata<{ [key: string]: { handler: T } }>(target, 'methods', 'service') || {};
    methods[name] = Object.assign({}, { handler } as { handler: T });

    setMetadata(target, 'methods', methods, 'service');
    return descriptor;
};

export const Method = MoleculerMethod as MethodDecorator;
