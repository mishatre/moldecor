import type { ActionSchema } from 'moleculer';
import type { EventSchema } from 'moleculer';
import type { ServiceHooks } from 'moleculer';
import type { ServiceSettingSchema } from 'moleculer';

export declare function action<P extends ActionSchema, S, T extends (this: S, ...args: any[]) => any = (this: S, ...args: any[]) => any>(params: P): (handler: T, context: ClassMethodDecoratorContext<S, T>) => void;

export declare function created<S, T extends (this: S, ...args: any) => any = (this: S, ...args: any) => any>(handler: T, context: ClassMethodDecoratorContext<S, T>): void;

declare function event_2<P extends EventSchema, S, T extends (this: S, ...args: any[]) => any = (this: S, ...args: any[]) => any>(params: P): (handler: T, context: ClassMethodDecoratorContext<S, T>) => void;
export { event_2 as event }

export declare function method<S, T extends (this: S, ...args: any) => any = (this: S, ...args: any) => any>(handler: T, context: ClassMethodDecoratorContext<S, T>): void;

export declare function service<S extends Record<string, any>, T extends new (...rest: any[]) => any>({ actions, ...options }: ServiceOptions<S>): (target: T, context: ClassDecoratorContext<T>) => T;

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

export declare function started<S, T extends (this: S, ...args: any) => any = (this: S, ...args: any) => any>(handler: T, context: ClassMethodDecoratorContext<S, T>): void;

export declare function stopped<S, T extends (this: S, ...args: any) => any = (this: S, ...args: any) => any>(handler: T, context: ClassMethodDecoratorContext<S, T>): void;

export { }
