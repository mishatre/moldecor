import type {
    ActionSchema,
    EventSchema,
    Service,
    ServiceBroker,
    ServiceHooks,
    ServiceSchema,
    ServiceSettingSchema,
} from 'moleculer';
import assert from 'node:assert';

import { dset } from './dset.js';
import { mergeSchemas } from '../utils/schema.js';

export interface ServiceOptions<
    S extends Record<string, any>,
> {
    name?: string;
    version?: string | number;
    settings?: S & ServiceSettingSchema;
    dependencies?: string[];
    metadata?: Record<string, any>;
    mixins?: any[];
    hooks?: ServiceHooks;
    [key: string]: any;
}

const decoratedFields = Symbol('decoratedFields');
const decoratedService = Symbol('decoratedService');

export function service<
    S extends Record<string, any>,
    T extends new (broker: ServiceBroker, schema?: ServiceSchema<S>) => any,
>(options: ServiceOptions<S>) {
    return function (target: T & { [decoratedService]?: Partial<ServiceSchema>;}, context: ClassDecoratorContext<T>) {
        assert(context.kind === 'class', 'Service decorator can be used only as class decorator');

        target = class extends target {
            constructor(broker: ServiceBroker, schema?: ServiceSchema<S>) {
                super(broker, schema);
                this.parseServiceSchema(context.metadata);
            }
        };

        const metadata = context.metadata as Partial<ServiceSchema>;
        mergeSchemas(metadata, options);
        
        // So decorated service can be used in mixins
        target[decoratedService] = metadata;
        if ('mixins' in metadata && Array.isArray(metadata.mixins)) {
            metadata.mixins = metadata.mixins.map(
                (mixin) => (decoratedService in mixin ? mixin[decoratedService] as Partial<ServiceSchema> : mixin),
            )
        }

        if (decoratedFields in metadata && metadata[decoratedFields]) {
            const merged = function<S extends Service>(this: S, schema: ServiceSchema) {
                if (decoratedFields in metadata && metadata[decoratedFields]) {
                    for (const [key, value] of Object.entries(metadata[decoratedFields])) {
                        if (!(key in this)) {
                            this[key as keyof S] = value;
                        }
                    }
                }
            }
            if ('merged' in metadata) {
                if (Array.isArray(metadata.merged)) {
                    metadata.merged.push(merged);
                } else {
                    metadata.merged = [metadata.merged, merged];
                }
            } else {
                Object.assign(metadata, { merged: [merged] });
            }
        }

        return target;
    };
}

export function action<
    P extends ActionSchema,
    S,
    T extends (...args: any[]) => any
>(params: P) {
    return function (handler: T, context: ClassMethodDecoratorContext<S, T>) {
        assert(
            context.kind === 'method',
            'Action decorator can be used only as class method decorator',
        );
        assert(
            typeof handler === 'function', 
            `@action/${String(context.name)} must be a function`
        );
        const name = params?.name || String(context.name);
        context.metadata.actions ??= {};
        dset(context.metadata, ['actions', name], {
            ...params,
            name,
            handler,
        });
    };
}

export function event<
    P extends EventSchema,
    S,
    T extends (...args: any[]) => any,
>(params: P) {
    return function (handler: T, context: ClassMethodDecoratorContext<S, T>) {
        assert(
            context.kind === 'method',
            'Event decorator can be used only as class method decorator',
        );
        assert(
            typeof handler === 'function', 
            `@event/${String(context.name)} must be a function`
        );
        const name = params.name || String(context.name);
        context.metadata.events ??= {};
        dset(context.metadata, ['events', name], {
            ...params,
            name,
            handler,
        });
    };
}

export function method<
    S,
    T extends (...args: any[]) => any
>(handler: T, context: ClassMethodDecoratorContext<S, T>) {
    assert(
        context.kind === 'method',
        'Method decorator can be used only as class method decorator',
    );
    assert(
        typeof handler === 'function', 
        `@method/${String(context.name)} must be a function`
    );
    context.metadata.methods ??= {};
    dset(context.metadata, ['methods', String(context.name)], handler);
}

export function created<
    S,
    T extends (...args: any) => any
>(handler: T, context: ClassMethodDecoratorContext<S, T>) {
    assert(
        context.kind === 'method',
        'Created decorator can be used only as class method decorator',
    );
    assert(
        context.name === 'created',
        'Created decorator should be used only with "created" class method',
    );
    dset(context.metadata, 'created', handler);
}

export function started<
    S,
    T extends (...args: any) => any,
>(handler: T, context: ClassMethodDecoratorContext<S, T>) {
    assert(
        context.kind === 'method',
        'Started decorator can be used only as class method decorator',
    );
    assert(
        context.name === 'started',
        'Started decorator should be used only with "started" class method',
    );
    dset(context.metadata, 'started', handler);
}

export function stopped<
    S,
    T extends (...args: any) => any,
>(handler: T, context: ClassMethodDecoratorContext<S, T>) {
    assert(
        context.kind === 'method',
        'Stopped decorator can be used only as class method decorator',
    );
    assert(
        context.name === 'stopped',
        'Stopped decorator should be used only with "stopped" class method',
    );
    dset(context.metadata, 'stopped', handler);
}

export function merged<
    S,
    T extends (...args: any) => any,
>(handler: T, context: ClassMethodDecoratorContext<S, T>) {
    assert(
        context.kind === 'method',
        'Merged decorator can be used only as class method decorator',
    );
    assert(
        context.name === 'merged',
        'Merged decorator should be used only with "merged" class method',
    );
    dset(context.metadata, 'merged', handler);
}

export function lifecycle<
    S,
    T extends (...args: any) => any,
>(handler: T, context: ClassMethodDecoratorContext<S, T>) {
    assert(
        context.kind === 'method',
        'Lifecycle decorator can be used only as class method decorator',
    );
    assert(
        ['created', 'merged', 'started', 'stopped'].includes(context.name as string) === false,
        'Lifecycle decorator cannot be used as substitute for "created", "merged", "started", "stopped" decorators',
    );
    dset(context.metadata, context.name as string, handler);
}

export function field<T>(initialValue?: T) {
    return function (_: any, context: ClassFieldDecoratorContext) {

        assert(
            context.kind === 'field',
            'Field decorator can be used only as class field decorator',
        );
        const name = String(context.name);
        assert(
            ['action', 'method', 'event', 'created', 'merged', 'started', 'stopped'].includes(name) === false,
            `Field decorator cannot be named as 'action', 'method', 'event' or any lifecycle method`,
        );

        dset(context.metadata, [decoratedFields, name], initialValue);

    }
}