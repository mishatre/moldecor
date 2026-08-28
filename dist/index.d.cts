import { ActionSchema, EventSchema, Service, ServiceSchema, ServiceSettingSchema } from "moleculer";
//#region src/moldecor.d.ts
type AnyMethod = (this: any, ...args: any[]) => any;
type ServiceClass = new (...args: any[]) => Service<any>;
type ServiceSettings<T extends object = object> = ServiceSettingSchema & T;
type ServiceMixin = (Omit<Partial<ServiceSchema<any>>, 'mixins'> & {
  mixins?: readonly ServiceMixin[];
}) | ServiceClass;
type ServiceOptions<S extends ServiceSettingSchema = ServiceSettingSchema> = Omit<Partial<ServiceSchema<S>>, 'mixins' | 'name'> & {
  name: string;
  mixins?: readonly ServiceMixin[];
  [key: string]: unknown;
};
type ActionOptions = Omit<ActionSchema, 'handler' | 'service'> & {
  handler?: never;
  service?: never;
};
type EventOptions = Omit<EventSchema, 'handler' | 'service'> & {
  handler?: never;
  service?: never;
};
declare function defineSettings<T extends object>(settings: ServiceSettings<T>): ServiceSettings<T>;
declare function service<S extends ServiceSettingSchema>(options: ServiceOptions<S>): <T extends ServiceClass>(target: T, context: ClassDecoratorContext<T>) => T;
declare function action(options?: ActionOptions): <This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>) => void;
declare function event(options?: EventOptions): <This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>) => void;
declare function method<This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>): void;
declare function created<This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>): void;
declare function merged<This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>): void;
declare function started<This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>): void;
declare function stopped<This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>): void;
declare function lifecycle<This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>): void;
//#endregion
export { type ActionOptions, type EventOptions, type ServiceMixin, type ServiceOptions, type ServiceSettings, action, created, defineSettings, event, lifecycle, merged, method, service, started, stopped };
//# sourceMappingURL=index.d.cts.map