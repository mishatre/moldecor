import { ActionSchema, Context, EventSchema, Service, ServiceSchema, ServiceSettingSchema } from "moleculer";
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
/**
 * Definition of a `@moleculer/channels` consumer, minus the handler which comes from the decorated
 * method. Adapter-specific option groups (`redis`, `amqp`, `kafka`, `nats`) are passed through.
 */
interface ChannelOptions {
  /**
   * Schema key of the consumer inside the channel map, defaulting to the decorated method name.
   * It is the *logical* channel name: `@moleculer/channels` prefixes it with the adapter prefix
   * (the broker namespace) to build the physical topic, which is exactly what
   * `broker.sendToChannel(key)` publishes to. Use it when the logical name cannot be a method
   * name, e.g. `"v1.delivery.ready"`. Moldecor reads this option and never forwards it to the
   * middleware.
   */
  key?: string;
  /**
   * Physical topic to consume, used verbatim by the middleware and therefore *not* prefixed with
   * the adapter prefix. Only omit it when you consume a topic nobody publishes to with
   * `broker.sendToChannel`, which always applies the adapter prefix itself.
   */
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
  tracing?: boolean | {
    enabled?: boolean;
    spanName?: string | ((ctx: Context<any, any>) => string);
    tags?: Record<string, unknown> | ((ctx: Context<any, any>) => Record<string, unknown>);
    safetyTags?: boolean;
  };
  /** Consumer ID, owned by the channels middleware. */
  id?: string;
  handler?: never;
  service?: never;
  [key: string]: unknown;
}
/** Service schema location of a decorated channel. */
interface ChannelTarget {
  /**
   * Name of the service schema property holding the channel definitions. It must match the
   * `schemaProperty` option of the channels middleware and defaults to `"channels"`.
   */
  schemaProperty?: string;
}
declare function defineSettings<T extends object>(settings: ServiceSettings<T>): ServiceSettings<T>;
declare function service<S extends ServiceSettingSchema>(options: ServiceOptions<S>): <T extends ServiceClass>(target: T, context: ClassDecoratorContext<T>) => T;
declare function action(options?: ActionOptions): <This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>) => void;
declare function event(options?: EventOptions): <This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>) => void;
declare function channel(options?: ChannelOptions, target?: ChannelTarget): <This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>) => void;
declare function method<This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>): void;
declare function created<This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>): void;
declare function merged<This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>): void;
declare function started<This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>): void;
declare function stopped<This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>): void;
declare function lifecycle<This, Value extends AnyMethod>(handler: Value, context: ClassMethodDecoratorContext<This, Value>): void;
//#endregion
export { type ActionOptions, type ChannelOptions, type ChannelTarget, type EventOptions, type ServiceMixin, type ServiceOptions, type ServiceSettings, action, channel, created, defineSettings, event, lifecycle, merged, method, service, started, stopped };
//# sourceMappingURL=index.d.cts.map