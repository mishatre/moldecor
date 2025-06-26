import { Service } from 'moleculer';

import { ServiceConstructor } from '../service/service.js';

export function cleanRoutePath(str: string): string {
    return str.replace(/[^a-zA-Z0-9-/]/g, '');
}

export function deepClone<T extends any>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as T;
    }

    if (obj instanceof Set) {
        const clonedSet = new Set();
        obj.forEach((value) => clonedSet.add(deepClone(value)));
        return clonedSet as T;
    }

    if (obj instanceof Map) {
        const clonedMap = new Map();
        obj.forEach((value, key) => clonedMap.set(key, deepClone(value)));
        return clonedMap as T;
    }

    if (obj instanceof RegExp) {
        return new RegExp(obj.source, obj.flags) as T;
    }

    const clone = Array.isArray(obj) ? [] : {};
    // @ts-expect-error
    Object.entries(obj).forEach(([key, value]) => (clone[key] = deepClone(value)));

    return clone as T;
}

export function isServiceClass(constructor: unknown): constructor is ServiceConstructor {
    if (typeof constructor !== 'function') {
        return false;
    }

    if (Service.isPrototypeOf(constructor)) {
        return true;
    }

    // Fallback in case of multiple moleculer package instances
    if ('parseServiceSchema' in constructor.prototype) {
        return true;
    }

    return false;
}

export function uniqueArray(array: any[]) {
    return [...new Set(array)];
}

export function wrapToArray<T extends any>(value: T | Array<T>): Array<T> {
	return Array.isArray(value) ? value : [value];
}

export function wrapToHandler<T extends object | boolean, F extends Function>(value: T | F): Exclude<T, F> {
    return (isFunction(value) ? { handler: value } : value) as any;
}

export function isFunction(fn: unknown): fn is Function {
    return typeof fn === "function";
}

export function flatten<T>(arr: T[]): (T extends readonly (infer InnerArr)[] ? InnerArr : T)[] {
    return arr.flat(1);
}

export const uniqWith = <T>(arr: T[], fn: (a: T, b: T) => boolean) => arr.filter((element, index) => arr.findIndex((step) => fn(element, step)) === index);