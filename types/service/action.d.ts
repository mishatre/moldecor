import { ActionSchema, Context } from 'moleculer';
import { PartialRequired } from '../utils/index.js';
export type ActionOptions = PartialRequired<Exclude<ActionSchema, 'handler'>, 'name'>;
type MethodDecorator<T> = (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;
export declare function Action<P = {}, T = (ctx: Context<P>) => void>(options?: ActionOptions): MethodDecorator<T>;
export {};
