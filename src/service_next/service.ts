import type {
    ActionSchema,
    EventSchema,
    ServiceBroker,
    ServiceHooks,
    ServiceSchema,
    ServiceSettingSchema,
} from 'moleculer';
import { Service } from 'moleculer';
import assert from 'node:assert';

import { dset } from './dset.js';

type MergeTypes<T extends unknown[], K extends keyof T[0]> = T extends [
    a: infer A,
    ...rest: infer R,
]
    ? A[K] & MergeTypes<R, K>
    : {};

export interface ServiceOptions<
    S extends Record<string, any>,
    // M extends { settings?: Record<string, any> }[],
> {
    name?: string;
    version?: string | number;
    settings?: S & ServiceSettingSchema;
    dependencies?: string[];
    metadata?: Record<string, any>;
    mixins?: any[];
    hooks?: ServiceHooks;
}

const decoratedService = Symbol('decoratedService');

export function service<
    S extends Record<string, any>,
    T extends new (...rest: any[]) => any,
    // M extends any[],
>(options: ServiceOptions<S>) {
    return function (target: T, context: ClassDecoratorContext<T>) {
        assert(context.kind === 'class', 'Service decorator can be used only as class decorator');

        target = class extends target {
            constructor(...args: any[]) {
                const [broker] = args;
                super(broker);
                this.parseServiceSchema(context.metadata);
            }
        };

        Object.assign(context.metadata, options, context.metadata);
        Object.assign(target, { [decoratedService]: context.metadata });
        context.metadata.mixins = (context.metadata as unknown as ServiceSchema).mixins?.map(
            (mixin) => (decoratedService in mixin ? mixin[decoratedService] : mixin),
        );

        // target.started = context.metadata.started;

        return target;
    };
}

export function action<
    P extends ActionSchema,
    S,
    T extends (this: S, ...args: any[]) => any = (this: S, ...args: any[]) => any,
>(params: P) {
    return function (handler: T, context: ClassMethodDecoratorContext<S, T>) {
        assert(
            context.kind === 'method',
            'Action decorator can be used only as class method decorator',
        );
        dset(context.metadata, ['actions', params.name || String(context.name)], {
            ...params,
            name: params.name || String(context.name),
            handler,
        });
    };
}

export function event<
    P extends EventSchema,
    S,
    T extends (this: S, ...args: any[]) => any = (this: S, ...args: any[]) => any,
>(params: P) {
    return function (handler: T, context: ClassMethodDecoratorContext<S, T>) {
        assert(
            context.kind === 'method',
            'Event decorator can be used only as class method decorator',
        );
        dset(context.metadata, ['events', params.name || String(context.name)], {
            ...params,
            name: params.name || String(context.name),
            handler,
        });
    };
}

export function method<
    S,
    T extends (this: S, ...args: any) => any = (this: S, ...args: any) => any,
>(handler: T, context: ClassMethodDecoratorContext<S, T>) {
    assert(
        context.kind === 'method',
        'Method decorator can be used only as class method decorator',
    );
    dset(context.metadata, `methods.${String(context.name)}`, handler);
}

export function created<
    S,
    T extends (this: S, ...args: any) => any = (this: S, ...args: any) => any,
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
    T extends (this: S, ...args: any) => any = (this: S, ...args: any) => any,
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
    T extends (this: S, ...args: any) => any = (this: S, ...args: any) => any,
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
