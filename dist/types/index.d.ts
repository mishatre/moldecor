import type { ActionSchema } from 'moleculer';
import type { EventSchema } from 'moleculer';
import type { Service } from 'moleculer';
import type { ServiceBroker } from 'moleculer';
import type { ServiceHooks } from 'moleculer';
import type { ServiceSchema } from 'moleculer';
import type { ServiceSettingSchema } from 'moleculer';

export declare function action<P extends ActionSchema, S, T extends (...args: any[]) => any>(params: P): (handler: T, context: ClassMethodDecoratorContext<S, T>) => void;

export declare function created<S, T extends (...args: any) => any>(handler: T, context: ClassMethodDecoratorContext<S, T>): void;

declare const decoratedService: unique symbol;

export declare function dset<T extends object, V>(obj: T, keys: string | symbol | ArrayLike<string | symbol | number>, val: V): void;

declare function event_2<P extends EventSchema, S, T extends (...args: any[]) => any>(params: P): (handler: T, context: ClassMethodDecoratorContext<S, T>) => void;
export { event_2 as event }

export declare function lifecycle<S, T extends (...args: any) => any>(handler: T, context: ClassMethodDecoratorContext<S, T>): void;

export declare function merged<S, T extends (...args: any) => any>(handler: T, context: ClassMethodDecoratorContext<S, T>): void;

export declare function method<S, T extends (...args: any[]) => any>(handler: T, context: ClassMethodDecoratorContext<S, T>): void;

export declare function service<S extends Record<string, any>, T extends new (broker: ServiceBroker, schema?: ServiceSchema<S>) => any>(options: ServiceOptions<S>): (target: T & {
    [decoratedService]?: Partial<ServiceSchema>;
}, context: ClassDecoratorContext<T>) => T & {
    [decoratedService]?: Partial<Service.ServiceSchema<Service.ServiceSettingSchema>> | undefined;
};

declare interface ServiceOptions<S extends Record<string, any>> {
    name?: string;
    version?: string | number;
    settings?: S & ServiceSettingSchema;
    dependencies?: string[];
    metadata?: Record<string, any>;
    mixins?: any[];
    hooks?: ServiceHooks;
    [key: string]: any;
}

export declare function started<S, T extends (...args: any) => any>(handler: T, context: ClassMethodDecoratorContext<S, T>): void;

export declare function stopped<S, T extends (...args: any) => any>(handler: T, context: ClassMethodDecoratorContext<S, T>): void;

export { }
