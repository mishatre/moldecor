// src/service_next/service.ts
import assert from "node:assert";

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
function service(options) {
  return function(target, context) {
    var _a;
    assert(context.kind === "class", "Service decorator can be used only as class decorator");
    target = class extends target {
      constructor(...args) {
        const [broker] = args;
        super(broker);
        this.parseServiceSchema(context.metadata);
      }
    };
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
    assert(
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
    assert(
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
  assert(
    context.kind === "method",
    "Method decorator can be used only as class method decorator"
  );
  dset(context.metadata, `methods.${String(context.name)}`, handler);
}
function created(handler, context) {
  assert(
    context.kind === "method",
    "Created decorator can be used only as class method decorator"
  );
  assert(
    context.name === "created",
    'Created decorator should be used only with "created" class method'
  );
  dset(context.metadata, "created", handler);
}
function started(handler, context) {
  assert(
    context.kind === "method",
    "Started decorator can be used only as class method decorator"
  );
  assert(
    context.name === "started",
    'Started decorator should be used only with "started" class method'
  );
  dset(context.metadata, "started", handler);
}
function stopped(handler, context) {
  assert(
    context.kind === "method",
    "Stopped decorator can be used only as class method decorator"
  );
  assert(
    context.name === "stopped",
    'Stopped decorator should be used only with "stopped" class method'
  );
  dset(context.metadata, "stopped", handler);
}
export {
  action,
  created,
  event,
  method,
  service,
  started,
  stopped
};
//# sourceMappingURL=index.mjs.map
