"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  action: () => action,
  created: () => created,
  event: () => event,
  lifecycle: () => lifecycle,
  merged: () => merged,
  method: () => method,
  service: () => service,
  started: () => started,
  stopped: () => stopped
});
module.exports = __toCommonJS(src_exports);

// src/service_next/service.ts
var import_node_assert = __toESM(require("node:assert"), 1);

// src/service_next/dset.ts
function dset(obj, keys, val) {
  keys.split && (keys = keys.split("."));
  var i = 0, l = keys.length, t = obj, x, k;
  while (i < l) {
    k = keys[i++];
    if (k === "__proto__" || k === "constructor" || k === "prototype") break;
    t = t[k] = i === l ? val : typeof (x = t[k]) === typeof keys ? x : keys[i] * 0 !== 0 || !!~("" + keys[i]).indexOf(".") ? {} : [];
  }
}

// src/service_next/service.ts
var decoratedService = Symbol("decoratedService");
function service({ actions, ...options }) {
  return function(target, context) {
    var _a;
    (0, import_node_assert.default)(context.kind === "class", "Service decorator can be used only as class decorator");
    target = class extends target {
      constructor(...args) {
        const [broker] = args;
        super(broker);
        this.parseServiceSchema(context.metadata);
      }
    };
    if (!!actions) {
      context.metadata.actions = Object.assign({}, context.metadata.actions, actions);
    }
    Object.assign(context.metadata, options, context.metadata);
    Object.assign(target, { [decoratedService]: context.metadata });
    context.metadata.mixins = (_a = context.metadata.mixins) == null ? void 0 : _a.map(
      (mixin) => decoratedService in mixin ? mixin[decoratedService] : mixin
    );
    return target;
  };
}
function action(params) {
  return function(handler, context) {
    (0, import_node_assert.default)(
      context.kind === "method",
      "Action decorator can be used only as class method decorator"
    );
    dset(context.metadata, ["actions", params.name || String(context.name)], {
      ...params,
      name: params.name || String(context.name),
      handler
    });
  };
}
function event(params) {
  return function(handler, context) {
    (0, import_node_assert.default)(
      context.kind === "method",
      "Event decorator can be used only as class method decorator"
    );
    dset(context.metadata, ["events", params.name || String(context.name)], {
      ...params,
      name: params.name || String(context.name),
      handler
    });
  };
}
function method(handler, context) {
  (0, import_node_assert.default)(
    context.kind === "method",
    "Method decorator can be used only as class method decorator"
  );
  dset(context.metadata, `methods.${String(context.name)}`, handler);
}
function created(handler, context) {
  (0, import_node_assert.default)(
    context.kind === "method",
    "Created decorator can be used only as class method decorator"
  );
  (0, import_node_assert.default)(
    context.name === "created",
    'Created decorator should be used only with "created" class method'
  );
  dset(context.metadata, "created", handler);
}
function started(handler, context) {
  (0, import_node_assert.default)(
    context.kind === "method",
    "Started decorator can be used only as class method decorator"
  );
  (0, import_node_assert.default)(
    context.name === "started",
    'Started decorator should be used only with "started" class method'
  );
  dset(context.metadata, "started", handler);
}
function stopped(handler, context) {
  (0, import_node_assert.default)(
    context.kind === "method",
    "Stopped decorator can be used only as class method decorator"
  );
  (0, import_node_assert.default)(
    context.name === "stopped",
    'Stopped decorator should be used only with "stopped" class method'
  );
  dset(context.metadata, "stopped", handler);
}
function merged(handler, context) {
  (0, import_node_assert.default)(
    context.kind === "method",
    "Merged decorator can be used only as class method decorator"
  );
  (0, import_node_assert.default)(
    context.name === "merged",
    'Merged decorator should be used only with "merged" class method'
  );
  dset(context.metadata, "merged", handler);
}
function lifecycle(handler, context) {
  (0, import_node_assert.default)(
    context.kind === "method",
    "Lifecycle decorator can be used only as class method decorator"
  );
  (0, import_node_assert.default)(
    ["created", "merged", "started", "stopped"].includes(context.name) === false,
    'Lifecycle decorator cannot be used as substitute for "created", "merged", "started", "stopped" decorators'
  );
  dset(context.metadata, context.name, handler);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  action,
  created,
  event,
  lifecycle,
  merged,
  method,
  service,
  started,
  stopped
});
//# sourceMappingURL=index.cjs.map
