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
export declare function isServiceClass<S>(constructor: any): constructor is ServiceConstructor<S>;
export declare function getServiceInnerSchema<S>(constructor: ServiceConstructor<S>): Partial<ServiceSchema<S>>;
export declare function getServiceSchema<S>(constructor: ServiceConstructor<S>): ServiceSchema<S>;
export declare function convertServiceMixins<S>(schema: ServiceSchema<S>): void;
type InstanceGenericType<T extends abstract new (...args: any) => MoleculerService<any>> = T extends abstract new (...args: any) => MoleculerService<infer R> ? R : any;
export declare function Service<T extends ServiceConstructor<any>, S extends InstanceGenericType<T>>(options?: ServiceOptions<S>): (constructor: T) => T;
export {};
