import assert from 'assert';
import {
    Service as MoleculerService,
    ServiceHooks,
    ServiceSchema,
    ServiceSettingSchema,
} from 'moleculer';

import { getMetadata, getMetadataObject, isServiceClass, setMetadata } from '../utils/index.js';

/* -------------------------------------------- types ------------------------------------------- */

export interface ServiceOptions<S> {
    name?: string;
    version?: string | number;
    settings?: S & ServiceSettingSchema;
    dependencies?: ServiceSchema['dependencies'];
    metadata?: any;
    mixins?: Array<Partial<ServiceSchema> | ServiceConstructor>;
    hooks?: ServiceHooks;

    [name: string]: any;
}

export interface ServiceConstructor {
    new (...args: any[]): MoleculerService;
}

/* ------------------------------------------- methods ------------------------------------------ */

export function convertServiceMixins(schema: ServiceSchema) {
    if (!schema.mixins) {
        return schema.mixins;
    }

    const convertMixins = (mixins: Partial<ServiceSchema>[]) =>
        mixins.map((mixin) => {
            const converted: Partial<ServiceSchema> = isServiceClass(mixin)
                ? getMetadata(mixin.prototype, 'schema', 'service') ||
                  getMetadataObject(mixin.prototype, 'service')
                : mixin;
            if (converted.mixins) {
                converted.mixins = convertMixins(converted.mixins);
            }
            return converted;
        });

    return convertMixins(schema.mixins);
}

type InstanceGenericType<T extends abstract new (...args: any) => MoleculerService<any>> =
    T extends abstract new (...args: any) => MoleculerService<infer R> ? R : any;

function initializeSchema(
    constructor: ServiceConstructor,
    options: ServiceOptions<any>,
): ServiceSchema {
    const schema = Object.assign(
        {},
        {
            name: constructor.name,
        },
        options,
        getMetadataObject(constructor.prototype, 'service'),
    );

    // convert mixins
    schema.mixins = convertServiceMixins(schema);
    setMetadata(constructor.prototype, 'schema', schema, 'service');

    return schema;
}

export function Service<T extends ServiceConstructor, S extends InstanceGenericType<T>>(
    options: ServiceOptions<S> = {},
) {
    return (constructor: T): T => {
        assert(isServiceClass(constructor), 'Class must extend Service');

        const schema =
            getMetadata<ServiceSchema>(constructor.prototype, 'schema', 'service') ||
            initializeSchema(constructor, options);

        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                if (schema) {
                    this.parseServiceSchema(schema);
                }
            }
        };
    };
}
