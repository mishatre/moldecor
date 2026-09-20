import type {
    ActionSchema,
    Context,
    EventSchema,
    Service as MoleculerService,
    ServiceSchema,
    ServiceSettingSchema,
} from 'moleculer';

type AnyMethod = (this: any, ...args: any[]) => any;
type ServiceClass = new (...args: any[]) => MoleculerService<any>;
type Schema = Partial<ServiceSchema<any>> & Record<string, unknown>;

export type ServiceSettings<T extends object = object> = ServiceSettingSchema & T;

export type ServiceMixin =
    | (Omit<Partial<ServiceSchema<any>>, 'mixins'> & { mixins?: readonly ServiceMixin[] })
    | ServiceClass;

export type ServiceOptions<S extends ServiceSettingSchema = ServiceSettingSchema> = Omit<
    Partial<ServiceSchema<S>>,
    'mixins' | 'name'
> & {
    name: string;
    mixins?: readonly ServiceMixin[];
    [key: string]: unknown;
};

export type ActionOptions = Omit<ActionSchema, 'handler' | 'service'> & {
    handler?: never;
    service?: never;
};
export type EventOptions = Omit<EventSchema, 'handler' | 'service'> & {
    handler?: never;
    service?: never;
};

/**
 * Definition of a `@moleculer/channels` consumer, minus the handler which comes from the decorated
 * method. Adapter-specific option groups (`redis`, `amqp`, `kafka`, `nats`) are passed through.
 */
export interface ChannelOptions {
    name?: string;
    group?: string;
    context?: boolean;
    maxInFlight?: number;
    maxRetries?: number;
    /**
     * Dead-letter options, mirroring the published `@moleculer/channels` declaration. The
     * middleware also accepts a `null` return from both transform callbacks at runtime.
     */
    deadLettering?: {
        enabled: boolean;
        queueName?: string;
        exchangeName?: string;
        exchangeOptions?: Record<string, unknown>;
        queueOptions?: Record<string, unknown>;
        transformErrorToHeaders?: (error: Error) => Record<string, string>;
        transformHeadersToErrorData?: (headers: Record<string, string>) => Record<string, unknown>;
        errorInfoTTL?: number;
    };
    tracing?:
        | boolean
        | {
              enabled?: boolean;
              spanName?: string | ((ctx: Context<any, any>) => string);
              tags?:
                  | Record<string, unknown>
                  | ((ctx: Context<any, any>) => Record<string, unknown>);
              safetyTags?: boolean;
          };
    /** Consumer ID, owned by the channels middleware. */
    id?: string;
    handler?: never;
    service?: never;
    [key: string]: unknown;
}

/** Service schema location of a decorated channel. */
export interface ChannelTarget {
    /**
     * Name of the service schema property holding the channel definitions. It must match the
     * `schemaProperty` option of the channels middleware and defaults to `"channels"`.
     */
    schemaProperty?: string;
}

type ChannelDefinition = Omit<ChannelOptions, 'handler' | 'service'> & { handler: AnyMethod };

interface DecoratedMembers {
    actions?: Record<string, ActionSchema>;
    events?: Record<string, EventSchema>;
    /** Schema property -> channel name -> channel definition. */
    channels?: Record<string, Record<string, ChannelDefinition>>;
    methods?: Record<string, AnyMethod>;
    lifecycle?: Record<string, AnyMethod>;
}

const membersKey = Symbol('moldecor:members');
// Decorated classes routinely cross ESM/CJS, pnpm, and bundler boundaries. A versioned global
// key keeps the WeakMap private while allowing compatible v2 copies to recognize one another.
const decoratedSchemasKey = Symbol.for('moldecor:v2:decorated-schemas');
const decoratedSchemas = getDecoratedSchemas();
const lifecycleNames = new Set(['created', 'merged', 'started', 'stopped']);
const reservedSchemaProperties = new Set([
    'actions',
    'created',
    'dependencies',
    'events',
    'hooks',
    'merged',
    'metadata',
    'methods',
    'mixins',
    'name',
    'settings',
    'started',
    'stopped',
    'version',
]);

installSymbolMetadata();

function installSymbolMetadata(): void {
    if (!Object.hasOwn(Symbol, 'metadata')) {
        Object.defineProperty(Symbol, 'metadata', {
            configurable: false,
            enumerable: false,
            value: Symbol('Symbol.metadata'),
            writable: false,
        });
    }
}

function getDecoratedSchemas(): WeakMap<object, Schema> {
    const runtime = globalThis as Record<PropertyKey, unknown>;
    const existing = runtime[decoratedSchemasKey];

    if (existing !== undefined) {
        if (existing instanceof WeakMap) return existing as WeakMap<object, Schema>;
        return fail('The shared decorated-service registry is invalid.');
    }

    const registry = new WeakMap<object, Schema>();
    Object.defineProperty(runtime, decoratedSchemasKey, {
        configurable: false,
        enumerable: false,
        value: registry,
        writable: false,
    });
    return registry;
}

function fail(message: string): never {
    throw new TypeError(`[moldecor] ${message}`);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getMembers(context: { metadata: object }): DecoratedMembers {
    const metadata = context.metadata as Record<PropertyKey, unknown> | undefined;
    if (!metadata) {
        return fail(
            'Decorator metadata is unavailable. Use TypeScript 5.2+ standard decorators and import moldecor before declaring decorated classes.',
        );
    }

    if (!Object.hasOwn(metadata, membersKey)) {
        Object.defineProperty(metadata, membersKey, {
            configurable: false,
            enumerable: false,
            value: {},
            writable: false,
        });
    }

    return metadata[membersKey] as DecoratedMembers;
}

function assertMethod(
    context: ClassMethodDecoratorContext<any, AnyMethod>,
    decorator: string,
): void {
    if (context.kind !== 'method') {
        fail(`@${decorator} can only decorate methods.`);
    }
    if (context.static) {
        fail(`@${decorator} cannot decorate a static method.`);
    }
    if (context.private) {
        fail(`@${decorator} cannot decorate a private method.`);
    }
}

function memberName(
    context: ClassMethodDecoratorContext<any, AnyMethod>,
    explicitName: string | undefined,
    decorator: string,
): string {
    const name = explicitName ?? context.name;
    if (typeof name !== 'string' || name.trim().length === 0) {
        return fail(
            `@${decorator} requires a non-empty string name when decorating a symbol-named method.`,
        );
    }
    return name;
}

function put<T>(members: DecoratedMembers, bucket: keyof DecoratedMembers, name: string, value: T) {
    const values = (members[bucket] ??= {}) as Record<string, T>;
    values[name] = value;
}

function toSchema(members: DecoratedMembers): Schema {
    const schema: Schema = {};
    if (members.actions) schema.actions = members.actions;
    if (members.events) schema.events = members.events;
    if (members.methods) schema.methods = members.methods;
    if (members.lifecycle) Object.assign(schema, members.lifecycle);
    for (const [property, definitions] of Object.entries(members.channels ?? {})) {
        Object.assign(schema, { [property]: definitions });
    }
    return schema;
}

function normalizeMixin(mixin: ServiceMixin, ancestors: Set<object>): Partial<ServiceSchema<any>> {
    let source: Partial<ServiceSchema<any>>;

    if (typeof mixin === 'function') {
        const decoratedSchema = decoratedSchemas.get(mixin);
        if (!decoratedSchema) {
            return fail(
                'Class mixins must be decorated with @service by a compatible moldecor v2 build. Rebuild packages that bundle an older moldecor version.',
            );
        }
        source = decoratedSchema;
    } else if (mixin && typeof mixin === 'object') {
        source = mixin as Partial<ServiceSchema<any>>;
    } else {
        return fail('Mixins must be service schemas or classes decorated with @service.');
    }

    if (!source.mixins) return source;
    if (!Array.isArray(source.mixins)) {
        return fail("A mixin schema's mixins property must be an array.");
    }
    if (ancestors.has(source)) {
        return fail('Circular mixin graphs are not supported.');
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(source);
    return {
        ...source,
        mixins: source.mixins.map((nestedMixin) =>
            normalizeMixin(nestedMixin as ServiceMixin, nextAncestors),
        ),
    };
}

export function defineSettings<T extends object>(settings: ServiceSettings<T>): ServiceSettings<T> {
    return settings;
}

export function service<S extends ServiceSettingSchema>(options: ServiceOptions<S>) {
    return <T extends ServiceClass>(target: T, context: ClassDecoratorContext<T>): T => {
        if (context.kind !== 'class') {
            return fail('@service can only decorate classes.');
        }
        if (!options || typeof options !== 'object') {
            return fail('@service requires an options object.');
        }
        if (typeof options.name !== 'string' || options.name.trim().length === 0) {
            return fail('@service requires a non-empty service name.');
        }
        if (typeof target.prototype?.parseServiceSchema !== 'function') {
            return fail('@service classes must extend Moleculer Service.');
        }
        let parent = Object.getPrototypeOf(target) as object | null;
        while (parent && parent !== Function.prototype) {
            if (decoratedSchemas.has(parent)) {
                return fail(
                    'Decorated service inheritance is unsupported. Compose decorated services through mixins instead.',
                );
            }
            parent = Object.getPrototypeOf(parent) as object | null;
        }

        const { mixins = [], ...schemaOptions } = options;
        if (!Array.isArray(mixins)) {
            return fail('@service mixins must be an array.');
        }

        const members = getMembers(context);
        const ownSchema = toSchema(members);

        for (const [property, definitions] of Object.entries(members.channels ?? {})) {
            const explicit = schemaOptions[property];
            if (!isPlainObject(explicit)) continue;

            // Moleculer has no merge rule for channel definitions, so a service level property
            // would replace the decorated definitions outright. Merge them per channel name
            // instead, letting explicit options win while the decorated handlers survive.
            const merged: Record<string, unknown> = { ...definitions };
            for (const [name, override] of Object.entries(explicit)) {
                const decorated = merged[name];
                merged[name] =
                    isPlainObject(decorated) && isPlainObject(override)
                        ? { ...decorated, ...override }
                        : override;
            }

            Object.assign(ownSchema, { [property]: merged });
            delete schemaOptions[property];
        }

        const schema = {
            ...schemaOptions,
            mixins: [ownSchema, ...mixins.map((mixin) => normalizeMixin(mixin, new Set<object>()))],
        } as Schema;

        const DecoratedService = class extends target {
            constructor(...args: any[]) {
                super(...args);
                this.parseServiceSchema(schema as any);
            }
        };

        Object.defineProperty(DecoratedService, 'name', {
            configurable: true,
            value: target.name,
        });
        decoratedSchemas.set(DecoratedService, schema);
        return DecoratedService as T;
    };
}

export function action(options: ActionOptions = {}) {
    return <This, Value extends AnyMethod>(
        handler: Value,
        context: ClassMethodDecoratorContext<This, Value>,
    ): void => {
        assertMethod(context, 'action');
        const name = memberName(context, options.name, 'action');
        put(getMembers(context), 'actions', name, { ...options, name, handler });
    };
}

export function event(options: EventOptions = {}) {
    return <This, Value extends AnyMethod>(
        handler: Value,
        context: ClassMethodDecoratorContext<This, Value>,
    ): void => {
        assertMethod(context, 'event');
        const name = memberName(context, options.name, 'event');
        put(getMembers(context), 'events', name, { ...options, name, handler });
    };
}

function channelProperty(target: ChannelTarget): string {
    if (!isPlainObject(target)) {
        return fail('@channel requires a target options object.');
    }
    const property = target.schemaProperty ?? 'channels';
    if (typeof property !== 'string' || property.trim().length === 0) {
        return fail('@channel requires a non-empty string schemaProperty.');
    }
    if (reservedSchemaProperties.has(property)) {
        return fail(`@channel cannot target the reserved Moleculer schema property "${property}".`);
    }
    return property;
}

export function channel(options: ChannelOptions = {}, target: ChannelTarget = {}) {
    const property = channelProperty(target);

    return <This, Value extends AnyMethod>(
        handler: Value,
        context: ClassMethodDecoratorContext<This, Value>,
    ): void => {
        assertMethod(context, 'channel');
        const name = memberName(context, options.name, 'channel');
        const channels = (getMembers(context).channels ??= {});
        const definitions = (channels[property] ??= {});

        // `name` is only carried into the definition when the caller set it, because the channels
        // middleware prefixes an unnamed channel with the adapter prefix (the broker namespace).
        definitions[name] = { ...options, handler };
    };
}

export function method<This, Value extends AnyMethod>(
    handler: Value,
    context: ClassMethodDecoratorContext<This, Value>,
): void {
    assertMethod(context, 'method');
    const name = memberName(context, undefined, 'method');
    put(getMembers(context), 'methods', name, handler);
}

function putLifecycle<This, Value extends AnyMethod>(
    expectedName: string,
    handler: Value,
    context: ClassMethodDecoratorContext<This, Value>,
): void {
    assertMethod(context, expectedName);
    const name = memberName(context, undefined, expectedName);
    if (name !== expectedName) {
        fail(`@${expectedName} must decorate a method named "${expectedName}".`);
    }
    put(getMembers(context), 'lifecycle', expectedName, handler);
}

export function created<This, Value extends AnyMethod>(
    handler: Value,
    context: ClassMethodDecoratorContext<This, Value>,
): void {
    putLifecycle('created', handler, context);
}

export function merged<This, Value extends AnyMethod>(
    handler: Value,
    context: ClassMethodDecoratorContext<This, Value>,
): void {
    putLifecycle('merged', handler, context);
}

export function started<This, Value extends AnyMethod>(
    handler: Value,
    context: ClassMethodDecoratorContext<This, Value>,
): void {
    putLifecycle('started', handler, context);
}

export function stopped<This, Value extends AnyMethod>(
    handler: Value,
    context: ClassMethodDecoratorContext<This, Value>,
): void {
    putLifecycle('stopped', handler, context);
}

export function lifecycle<This, Value extends AnyMethod>(
    handler: Value,
    context: ClassMethodDecoratorContext<This, Value>,
): void {
    assertMethod(context, 'lifecycle');
    const name = memberName(context, undefined, 'lifecycle');
    if (lifecycleNames.has(name)) {
        fail(`Use @${name} for the reserved "${name}" lifecycle method.`);
    }
    put(getMembers(context), 'lifecycle', name, handler);
}
