import { Context, EventSchema, ServiceSchema } from "moleculer";
import { deepClone, flatten, uniqueArray, uniqWith, wrapToArray, wrapToHandler } from "./helpers.js";
import assert from "node:assert";
import defaultsDeep from 'lodash.defaultsdeep';

export function mergeSchemas(target: Partial<ServiceSchema>, sourceSchema: Partial<ServiceSchema>) {

    assert(!!target, 'Target schema must be provided');
    assert(!!sourceSchema, 'Source schema must be provided');

    for (const key of Object.keys(sourceSchema) as (keyof typeof sourceSchema)[]) {
        if ((key === "name" || key === "version") && sourceSchema[key] !== undefined) {
            // Simple overwrite
            target[key] = sourceSchema[key] as keyof typeof sourceSchema;
        } else if (key === "settings") {
            // Merge with defaultsDeep
            target[key] = mergeSchemaSettings(sourceSchema[key], target[key]);
        } else if (key === "metadata") {
            // Merge with defaultsDeep
            target[key] = mergeSchemaMetadata(sourceSchema[key], target[key]);
        } else if (key === "hooks") {
            // Merge & concat
            target[key] = mergeSchemaHooks(sourceSchema[key], target[key] || {});
        } else if (key === "actions") {
            // Merge with defaultsDeep
            target[key] = mergeSchemaActions(sourceSchema[key], target[key] || {});
        } else if (key === "methods") {
            // Overwrite
            target[key] = mergeSchemaMethods(sourceSchema[key], target[key]);
        } else if (key === "events") {
            // Merge & concat by groups
            target[key] = mergeSchemaEvents(sourceSchema[key], target[key] || {});
        } else if (["merged", "created", "started", "stopped"].includes(key)) {
            // Concat lifecycle event handlers
            target[key] = mergeSchemaLifecycleHandlers(sourceSchema[key as keyof typeof sourceSchema], target[key as keyof typeof target]) as any;
        } else if (["dependencies", "mixins"].includes(key)) {
            // Concat mixins
            target[key] = mergeSchemaUniqArray(sourceSchema[key], target[key]) as any;
        } else {
            target[key] = mergeSchemaUnknown(sourceSchema[key], target[key]) as any;
        }
    }

}

function mergeSchemaSettings(src: ServiceSchema['settings'], target: ServiceSchema['settings']) {
    if ((target && target.$secureSettings) || (src && src.$secureSettings)) {
        const srcSS = src && src.$secureSettings ? src.$secureSettings : [];
        const targetSS = target && target.$secureSettings ? target.$secureSettings : [];
        if (!target) {
            target = {};
        }

        target.$secureSettings = uniqueArray([...srcSS, ...targetSS]);
    }

    return defaultsDeep(src, target);
}

function mergeSchemaMetadata(src: ServiceSchema['metadata'], target: ServiceSchema['metadata']) {
    return defaultsDeep(src, target);
}

function mergeSchemaHooks(src: ServiceSchema['hooks'], target: ServiceSchema['hooks']) {
    if (!target) {
        target = {};
    }
    if (src) {
        for (const key of Object.keys(src) as (keyof typeof src)[]) {
            const srcValue = src[key];
            if (!srcValue) {
                continue;
            }
            if (!target[key]) {
                target[key] = {};
            }

            for (const hookKey of Object.keys(srcValue)) {
                const modHook = wrapToArray(srcValue[hookKey]);
                const resHook = wrapToArray(target[key]![hookKey]);

                target[key]![hookKey] = flatten(key === "before" ? [resHook, modHook] : [modHook, resHook])
                    .filter(Boolean);
            }
        };
    } 

    return target;
}

function mergeSchemaActions(src: ServiceSchema['actions'], target: ServiceSchema['actions']) {
    if (!target) {
        target = {};
    }
    if (src) {
        for (const key of Object.keys(src) as (keyof typeof src)[]) {
            if (src[key] === false && target[key]) {
                delete target[key];
                continue;
            }

            const srcAction = wrapToHandler(src[key]);
            const targetAction = wrapToHandler(target[key]);

            if (typeof srcAction !== 'boolean' && srcAction?.hooks && typeof targetAction !== 'boolean' && targetAction?.hooks) {
                for (const hookKey of Object.keys(srcAction.hooks) as (keyof typeof srcAction.hooks)[]) {
                    const modHook = wrapToArray(srcAction.hooks[hookKey]);
                    const resHook = wrapToArray(targetAction.hooks[hookKey]);

                    srcAction.hooks[hookKey] = flatten(hookKey === "before" ? [resHook, modHook] : [modHook, resHook])
                        .filter(Boolean) as any;
                };
            }

            target[key] = defaultsDeep(srcAction, targetAction);
        }
    };

    return target;
}

function mergeSchemaMethods(src: ServiceSchema['methods'], target: ServiceSchema['methods']) {
    return Object.assign(target || {}, src || {});
}

function mergeSchemaEvents(src: ServiceSchema['events'], target: ServiceSchema['events']) {
    if (!target) {
        target = {};
    }
    if (src) {
        for (const key of Object.keys(src) as (keyof typeof src)[]) {
            const modEvent = wrapToHandler(src[key]);
            const resEvent = wrapToHandler(target[key]);

            let handler = flatten([resEvent ? resEvent.handler : null, modEvent ? modEvent.handler : null])
                .filter(Boolean);

            target[key] = defaultsDeep(modEvent, resEvent);
            (target[key] as EventSchema).handler = (handler.length === 1 ? handler[0] : handler) as unknown as (ctx: Context) => void | Promise<void>;
        }
    };

    return target;
}

function mergeSchemaLifecycleHandlers(src: ServiceSchema['started'], target: ServiceSchema['started']) {
    return flatten([target, src]).filter(Boolean);
}

function mergeSchemaUniqArray<T>(src?: T, target?: T) {
    return uniqWith(flatten([src, target]).filter(Boolean), (a, b) => JSON.stringify(a) === JSON.stringify(b));
}

function mergeSchemaUnknown(src: unknown, target: unknown) {
    if (src !== undefined) {
        return src;
    }
    return target;
}
