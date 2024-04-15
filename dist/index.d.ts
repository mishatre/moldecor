declare module "utils/helpers" {
    export function cleanRoutePath(str: string): string;
    export function deepClone<T extends any>(obj: T): T;
}
declare module "utils/metadata" {
    import 'reflect-metadata';
    export const META_PREFIX: string;
    export function getMetadataKeys(target: any, scope?: string): {
        key: string;
        metadata: any;
    }[];
    export function getMetadata(target: any, key: string, scope?: string): any;
    export function setMetadata(target: any, key: string, value: any, scope?: string): void;
    export function removeMetadata(target: any, key: string, scope?: string): boolean;
    export function getOwnMetadata(target: any, key: string, scope?: string): any;
    export function setCache(target: any, key: string, value: any): void;
    export function getCache(target: any, key: string): any;
    export function getTypes(target: any, key: string | symbol): any;
}
declare module "utils/index" {
    export * from "utils/helpers";
    export * from "utils/metadata";
    export type PartialRequired<T, K extends keyof T> = Partial<T> & Pick<Required<T>, K>;
}
declare module "service/action" {
    import { ActionSchema, Context } from 'moleculer';
    import { PartialRequired } from "utils/index";
    export type ActionOptions = PartialRequired<Exclude<ActionSchema, 'handler'>, 'name'>;
    type MethodDecorator<T> = (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;
    export function Action<P = {}, T = (ctx: Context<P>) => void>(options?: ActionOptions): MethodDecorator<T>;
}
declare module "service/event" {
    import { EventSchema } from 'moleculer';
    import { PartialRequired } from "utils/index";
    export type EventOptions = PartialRequired<Exclude<EventSchema, 'handler'>, 'name'>;
    export type LifeCycleEventNames = 'created' | 'started' | 'stopped';
    export function Event(options?: EventSchema): MethodDecorator;
    export function createLifeCycleEvent(name: LifeCycleEventNames): MethodDecorator;
    export const Created: MethodDecorator;
    export const Started: MethodDecorator;
    export const Stopped: MethodDecorator;
}
declare module "service/method" {
    export const Method: MethodDecorator;
}
declare module "service/service" {
    import { Service as MoleculerService, ServiceHooks, ServiceSchema, ServiceSettingSchema } from 'moleculer';
    export interface ServiceDependency {
        name: string;
        version?: string | number;
    }
    export interface ServiceOptions<S> {
        name?: string;
        version?: string | number;
        settings?: S & ServiceSettingSchema;
        dependencies?: string | ServiceDependency | Array<string | ServiceDependency>;
        metadata?: any;
        mixins?: Array<Partial<ServiceSchema> | ServiceConstructor<any>>;
        hooks?: ServiceHooks;
        [name: string]: any;
    }
    export interface ServiceConstructor<S> {
        new (...args: any[]): MoleculerService<S>;
    }
    export type ServiceDecorator = <S, T extends ServiceConstructor<S>>(constructor: T) => T;
    export function isServiceClass<S>(constructor: any): constructor is ServiceConstructor<S>;
    export function getServiceInnerSchema<S>(constructor: ServiceConstructor<S>): Partial<ServiceSchema<S>>;
    export function getServiceSchema<S>(constructor: ServiceConstructor<S>): ServiceSchema<S>;
    export function convertServiceMixins<S>(schema: ServiceSchema<S>): void;
    type InstanceGenericType<T extends abstract new (...args: any) => MoleculerService<any>> = T extends abstract new (...args: any) => MoleculerService<infer R> ? R : any;
    export function Service<T extends ServiceConstructor<any>, S extends InstanceGenericType<T>>(options?: ServiceOptions<S>): (constructor: T) => T;
}
declare module "service/ext/channel" {
    export type ChanneltOptions = Partial<Exclude<any, 'handler'>> & {
        name: string;
    };
    export function Channel(options?: ChanneltOptions): MethodDecorator;
}
declare module "service/index" {
    export * from "service/action";
    export * from "service/event";
    export * from "service/method";
    export * from "service/service";
    export * from "service/ext/channel";
}
declare module "index" {
    export * from "service/index";
}
//# sourceMappingURL=index.d.ts.map