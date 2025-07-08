// @ts-nocheck
export function dset<T extends object, V>(
    obj: T,
    keys: string | symbol | ArrayLike<string | symbol | number>,
    val: V,
) {
    keys.split && (keys = keys.split('.'));
    var i = 0,
        l = keys.length,
        t = obj,
        x,
        k;
    while (i < l) {
        k = keys[i++];
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') break;
        t = t[k] =
            i === l
                ? val
                : typeof (x = t[k]) === typeof keys
                  ? x
                  : keys[i] * 0 !== 0 || !!~('' + keys[i]).indexOf('.')
                    ? {}
                    : [];
    }
}
