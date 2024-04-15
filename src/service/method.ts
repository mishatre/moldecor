import { getMetadata, setMetadata } from '../utils';

const MoleculerMethod = <T>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
) => {
    const handler = descriptor.value;

    if (!handler || typeof handler !== 'function') {
        throw new TypeError('A method must be a function');
    }

    const name = propertyKey.toString();
    const methods = getMetadata(target, 'methods', 'service') || {};
    methods[name] = { handler };

    setMetadata(target, 'methods', methods, 'service');
    return descriptor;
};

export const Method = MoleculerMethod as MethodDecorator;
