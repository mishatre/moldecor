import 'reflect-metadata';
export declare const META_PREFIX: string;
export declare function getMetadataKeys(target: any, scope?: string): {
    key: string;
    metadata: any;
}[];
export declare function getMetadata(target: any, key: string, scope?: string): any;
export declare function setMetadata(target: any, key: string, value: any, scope?: string): void;
export declare function removeMetadata(target: any, key: string, scope?: string): boolean;
export declare function getOwnMetadata(target: any, key: string, scope?: string): any;
export declare function setCache(target: any, key: string, value: any): void;
export declare function getCache(target: any, key: string): any;
export declare function getTypes(target: any, key: string | symbol): any;
