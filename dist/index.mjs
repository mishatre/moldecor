//#region src/moldecor.ts
const membersKey = Symbol("moldecor:members");
const decoratedSchemasKey = Symbol.for("moldecor:v2:decorated-schemas");
const decoratedSchemas = getDecoratedSchemas();
const lifecycleNames = /* @__PURE__ */ new Set([
	"created",
	"merged",
	"started",
	"stopped"
]);
installSymbolMetadata();
function installSymbolMetadata() {
	if (!Object.hasOwn(Symbol, "metadata")) Object.defineProperty(Symbol, "metadata", {
		configurable: false,
		enumerable: false,
		value: Symbol("Symbol.metadata"),
		writable: false
	});
}
function getDecoratedSchemas() {
	const runtime = globalThis;
	const existing = runtime[decoratedSchemasKey];
	if (existing !== void 0) {
		if (existing instanceof WeakMap) return existing;
		return fail("The shared decorated-service registry is invalid.");
	}
	const registry = /* @__PURE__ */ new WeakMap();
	Object.defineProperty(runtime, decoratedSchemasKey, {
		configurable: false,
		enumerable: false,
		value: registry,
		writable: false
	});
	return registry;
}
function fail(message) {
	throw new TypeError(`[moldecor] ${message}`);
}
function getMembers(context) {
	const metadata = context.metadata;
	if (!metadata) return fail("Decorator metadata is unavailable. Use TypeScript 5.2+ standard decorators and import moldecor before declaring decorated classes.");
	if (!Object.hasOwn(metadata, membersKey)) Object.defineProperty(metadata, membersKey, {
		configurable: false,
		enumerable: false,
		value: {},
		writable: false
	});
	return metadata[membersKey];
}
function assertMethod(context, decorator) {
	if (context.kind !== "method") fail(`@${decorator} can only decorate methods.`);
	if (context.static) fail(`@${decorator} cannot decorate a static method.`);
	if (context.private) fail(`@${decorator} cannot decorate a private method.`);
}
function memberName(context, explicitName, decorator) {
	const name = explicitName ?? context.name;
	if (typeof name !== "string" || name.trim().length === 0) return fail(`@${decorator} requires a non-empty string name when decorating a symbol-named method.`);
	return name;
}
function put(members, bucket, name, value) {
	const values = members[bucket] ??= {};
	values[name] = value;
}
function toSchema(members) {
	const schema = {};
	if (members.actions) schema.actions = members.actions;
	if (members.events) schema.events = members.events;
	if (members.methods) schema.methods = members.methods;
	if (members.lifecycle) Object.assign(schema, members.lifecycle);
	return schema;
}
function normalizeMixin(mixin, ancestors) {
	let source;
	if (typeof mixin === "function") {
		const decoratedSchema = decoratedSchemas.get(mixin);
		if (!decoratedSchema) return fail("Class mixins must be decorated with @service by a compatible moldecor v2 build. Rebuild packages that bundle an older moldecor version.");
		source = decoratedSchema;
	} else if (mixin && typeof mixin === "object") source = mixin;
	else return fail("Mixins must be service schemas or classes decorated with @service.");
	if (!source.mixins) return source;
	if (!Array.isArray(source.mixins)) return fail("A mixin schema's mixins property must be an array.");
	if (ancestors.has(source)) return fail("Circular mixin graphs are not supported.");
	const nextAncestors = new Set(ancestors);
	nextAncestors.add(source);
	return {
		...source,
		mixins: source.mixins.map((nestedMixin) => normalizeMixin(nestedMixin, nextAncestors))
	};
}
function defineSettings(settings) {
	return settings;
}
function service(options) {
	return (target, context) => {
		if (context.kind !== "class") return fail("@service can only decorate classes.");
		if (!options || typeof options !== "object") return fail("@service requires an options object.");
		if (typeof options.name !== "string" || options.name.trim().length === 0) return fail("@service requires a non-empty service name.");
		if (typeof target.prototype?.parseServiceSchema !== "function") return fail("@service classes must extend Moleculer Service.");
		let parent = Object.getPrototypeOf(target);
		while (parent && parent !== Function.prototype) {
			if (decoratedSchemas.has(parent)) return fail("Decorated service inheritance is unsupported. Compose decorated services through mixins instead.");
			parent = Object.getPrototypeOf(parent);
		}
		const { mixins = [], ...schemaOptions } = options;
		if (!Array.isArray(mixins)) return fail("@service mixins must be an array.");
		const ownSchema = toSchema(getMembers(context));
		const schema = {
			...schemaOptions,
			mixins: [ownSchema, ...mixins.map((mixin) => normalizeMixin(mixin, /* @__PURE__ */ new Set()))]
		};
		const DecoratedService = class extends target {
			constructor(...args) {
				super(...args);
				this.parseServiceSchema(schema);
			}
		};
		Object.defineProperty(DecoratedService, "name", {
			configurable: true,
			value: target.name
		});
		decoratedSchemas.set(DecoratedService, schema);
		return DecoratedService;
	};
}
function action(options = {}) {
	return (handler, context) => {
		assertMethod(context, "action");
		const name = memberName(context, options.name, "action");
		put(getMembers(context), "actions", name, {
			...options,
			name,
			handler
		});
	};
}
function event(options = {}) {
	return (handler, context) => {
		assertMethod(context, "event");
		const name = memberName(context, options.name, "event");
		put(getMembers(context), "events", name, {
			...options,
			name,
			handler
		});
	};
}
function method(handler, context) {
	assertMethod(context, "method");
	const name = memberName(context, void 0, "method");
	put(getMembers(context), "methods", name, handler);
}
function putLifecycle(expectedName, handler, context) {
	assertMethod(context, expectedName);
	if (memberName(context, void 0, expectedName) !== expectedName) fail(`@${expectedName} must decorate a method named "${expectedName}".`);
	put(getMembers(context), "lifecycle", expectedName, handler);
}
function created(handler, context) {
	putLifecycle("created", handler, context);
}
function merged(handler, context) {
	putLifecycle("merged", handler, context);
}
function started(handler, context) {
	putLifecycle("started", handler, context);
}
function stopped(handler, context) {
	putLifecycle("stopped", handler, context);
}
function lifecycle(handler, context) {
	assertMethod(context, "lifecycle");
	const name = memberName(context, void 0, "lifecycle");
	if (lifecycleNames.has(name)) fail(`Use @${name} for the reserved "${name}" lifecycle method.`);
	put(getMembers(context), "lifecycle", name, handler);
}
//#endregion
export { action, created, defineSettings, event, lifecycle, merged, method, service, started, stopped };

//# sourceMappingURL=index.mjs.map