// src/utils/helpers.ts
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  if (obj instanceof Set) {
    const clonedSet = /* @__PURE__ */ new Set();
    obj.forEach((value) => clonedSet.add(deepClone(value)));
    return clonedSet;
  }
  if (obj instanceof Map) {
    const clonedMap = /* @__PURE__ */ new Map();
    obj.forEach((value, key) => clonedMap.set(key, deepClone(value)));
    return clonedMap;
  }
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags);
  }
  const clone = Array.isArray(obj) ? [] : {};
  Object.entries(obj).forEach(([key, value]) => clone[key] = deepClone(value));
  return clone;
}

// src/utils/metadata.ts
import "reflect-metadata";
var META_PREFIX = "moleculer:decorators";
function isKey(key, scope = "") {
  return typeof key === "string" && key.startsWith(`${META_PREFIX}${scope}:`);
}
function prefixKey(key, scope = "") {
  if (!isKey(key, scope)) {
    return `${META_PREFIX}${scope}:${key}`;
  }
  return key;
}
function getMetadataKeys(target, scope = "") {
  const keys = Reflect.getMetadataKeys(target) || [];
  const metadataKeys = [];
  keys.forEach((key) => {
    if (isKey(key, scope)) {
      metadataKeys.push({
        key: key.replace(new RegExp(`^${META_PREFIX}${scope}:`), ""),
        metadata: getMetadata(target, key, scope)
      });
    }
  });
  return metadataKeys;
}
function getMetadata(target, key, scope = "") {
  return deepClone(Reflect.getMetadata(prefixKey(key, scope), target));
}
function setMetadata(target, key, value, scope = "") {
  Reflect.defineMetadata(prefixKey(key, scope), value, target);
}

// src/service/action.ts
function Action(options) {
  return (target, propertyKey, descriptor) => {
    const handler = descriptor.value;
    if (!handler || typeof handler !== "function") {
      throw new TypeError("An action must be a function");
    }
    const name = propertyKey.toString();
    const actions = getMetadata(target, "actions", "service") || {};
    actions[name] = Object.assign({}, { handler, name, visibility: "public" }, options);
    setMetadata(target, "actions", actions, "service");
    return descriptor;
  };
}

// src/service/event.ts
function Event(options) {
  return (target, propertyKey, descriptor) => {
    const handler = descriptor.value;
    if (!handler || typeof handler !== "function") {
      throw new TypeError("An event handler must be a function");
    }
    const name = propertyKey.toString();
    const events = getMetadata(target, "events", "service") || {};
    events[name] = Object.assign({}, { handler, name }, options);
    setMetadata(target, "events", events, "service");
    return descriptor;
  };
}
function createLifeCycleEvent(name) {
  if (!name) {
    throw new ReferenceError("Lifecycle event name required");
  }
  return (target, _propertyKey, descriptor) => {
    const handler = descriptor.value;
    if (!handler || typeof handler !== "function") {
      throw new TypeError("An lifecycle event handler must be a function");
    }
    setMetadata(target, name, handler, "service");
    return descriptor;
  };
}
var Created = createLifeCycleEvent("created");
var Started = createLifeCycleEvent("started");
var Stopped = createLifeCycleEvent("stopped");

// src/service/method.ts
var MoleculerMethod = (target, propertyKey, descriptor) => {
  const handler = descriptor.value;
  if (!handler || typeof handler !== "function") {
    throw new TypeError("A method must be a function");
  }
  const name = propertyKey.toString();
  const methods = getMetadata(target, "methods", "service") || {};
  methods[name] = { handler };
  setMetadata(target, "methods", methods, "service");
  return descriptor;
};
var Method = MoleculerMethod;

// src/service/service.ts
import {
  Service as MoleculerService
} from "moleculer";
function isServiceClass(constructor) {
  return typeof constructor === "function" && MoleculerService.isPrototypeOf(constructor);
}
function getServiceInnerSchema(constructor) {
  if (!isServiceClass(constructor)) {
    throw TypeError("Class must extend Service");
  }
  const serviceSchema = {};
  const keys = getMetadataKeys(constructor.prototype, "service");
  keys.forEach(({ key, metadata }) => serviceSchema[key] = metadata);
  return serviceSchema;
}
function getServiceSchema(constructor) {
  if (!isServiceClass(constructor)) {
    throw TypeError("Class must extend Service");
  }
  return getMetadata(constructor.prototype, "schema", "service") || getServiceInnerSchema(constructor);
}
function convertServiceMixins(schema) {
  if (!schema.mixins)
    return;
  const convertMixins = (mixins) => {
    return mixins.map((mixin) => {
      const convertedMixin = isServiceClass(mixin) ? getServiceSchema(mixin) : mixin;
      if (convertedMixin.mixins) {
        convertedMixin.mixins = convertMixins(convertedMixin.mixins);
      }
      return convertedMixin;
    });
  };
  schema.mixins = convertMixins(schema.mixins);
}
function Service(options = {}) {
  return (constructor) => {
    if (!isServiceClass(constructor)) {
      throw TypeError("Class must extend Service");
    }
    let schema = getMetadata(constructor.prototype, "schema", "service");
    if (!schema) {
      const defaults = {
        name: constructor.name,
        ...options
      };
      schema = {
        ...defaults,
        ...getServiceInnerSchema(constructor)
      };
      convertServiceMixins(schema);
      setMetadata(constructor.prototype, "schema", schema, "service");
    }
    return class extends constructor {
      constructor(...args) {
        super(...args);
        this.parseServiceSchema(schema);
      }
    };
  };
}

// src/service/ext/channel.ts
function Channel(options) {
  return (target, propertyKey, descriptor) => {
    const handler = descriptor.value;
    if (!handler || typeof handler !== "function") {
      throw new TypeError("An event handler must be a function");
    }
    const name = propertyKey.toString();
    const channels = getMetadata(target, "channels", "service") || {};
    channels[name] = Object.assign({}, { handler, name }, options);
    setMetadata(target, "channels", channels, "service");
    return descriptor;
  };
}
export {
  Action,
  Channel,
  Created,
  Event,
  Method,
  Service,
  Started,
  Stopped,
  convertServiceMixins,
  createLifeCycleEvent,
  getServiceInnerSchema,
  getServiceSchema,
  isServiceClass
};
//# sourceMappingURL=index.mjs.map
