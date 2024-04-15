import { getMetadata, setMetadata } from '../../utils';

export type ChanneltOptions = Partial<Exclude<any, 'handler'>> & { name: string };

export function Channel(options?: ChanneltOptions): MethodDecorator {
    return <T>(
        target: Object,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<T>,
    ) => {
        const handler = descriptor.value;

        if (!handler || typeof handler !== 'function') {
            throw new TypeError('An event handler must be a function');
        }

        const name = propertyKey.toString();
        const channels = getMetadata(target, 'channels', 'service') || {};

        channels[name] = Object.assign({}, { handler, name }, options);

        setMetadata(target, 'channels', channels, 'service');
        return descriptor;
    };
}
