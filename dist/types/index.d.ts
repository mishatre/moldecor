import { ActionSchema } from 'moleculer';
import { Context } from 'moleculer';
import { EventSchema } from 'moleculer';
import { Service as Service_2 } from 'moleculer';
import { ServiceHooks } from 'moleculer';
import { ServiceSchema } from 'moleculer';
import { ServiceSettingSchema } from 'moleculer';

export declare function Action<P = {}, T = (ctx: Context<P>) => void>(options?: ActionOptions): MethodDecorator_2<T>;

declare type ActionOptions = PartialRequired<Exclude<ActionSchema, 'handler'>, 'name'>;

export declare function Channel(options?: ChanneltOptions): MethodDecorator;

declare type ChanneltOptions = Partial<Exclude<any, 'handler'>> & {
    name: string;
};

export declare const Created: MethodDecorator;

declare function Event_2(options?: EventSchema): MethodDecorator;
export { Event_2 as Event }

declare type InstanceGenericType<T extends abstract new (...args: any) => Service_2<any>> = T extends abstract new (...args: any) => Service_2<infer R> ? R : any;

export declare const Method: MethodDecorator;

declare type MethodDecorator_2<T> = (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;

declare type PartialRequired<T, K extends keyof T> = Partial<T> & Pick<Required<T>, K>;

export declare function Service<T extends ServiceConstructor, S extends InstanceGenericType<T>>(options?: ServiceOptions<S>): (constructor: T) => T;

declare interface ServiceConstructor {
    new (...args: any[]): Service_2;
}

declare interface ServiceOptions<S> {
    name?: string;
    version?: string | number;
    settings?: S & ServiceSettingSchema;
    dependencies?: ServiceSchema['dependencies'];
    metadata?: any;
    mixins?: Array<Partial<ServiceSchema> | ServiceConstructor>;
    hooks?: ServiceHooks;
    [name: string]: any;
}

export declare const Started: MethodDecorator;

export declare const Stopped: MethodDecorator;

export { }
