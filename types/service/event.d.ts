import { EventSchema } from 'moleculer';
import { PartialRequired } from '../utils/index.js';
export type EventOptions = PartialRequired<Exclude<EventSchema, 'handler'>, 'name'>;
export type LifeCycleEventNames = 'created' | 'started' | 'stopped';
export declare function Event(options?: EventSchema): MethodDecorator;
export declare function createLifeCycleEvent(name: LifeCycleEventNames): MethodDecorator;
export declare const Created: MethodDecorator;
export declare const Started: MethodDecorator;
export declare const Stopped: MethodDecorator;
