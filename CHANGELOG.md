# Changelog

All notable changes to moldecor are documented here.

## 2.0.0-rc.3

### Added

- `@channel` accepts a `key` option that sets the channel's schema key independently of the decorated method name, so dotted logical names like `"v1.delivery.ready"` stay eligible for the adapter prefix and are reachable with `broker.sendToChannel("v1.delivery.ready")`. It also lets symbol-named channel methods be registered without an explicit `name`.

### Changed

- Documented the two channel names of `@moleculer/channels`: the schema key (prefixed with the adapter prefix, the broker namespace by default) and the verbatim `name` topic, which opts out of that prefix while `sendToChannel` keeps applying it.

## 2.0.0-rc.2

### Added

- `@channel` registers `@moleculer/channels` consumers on decorated methods, including the optional `schemaProperty` target used by multi-adapter setups. Verified against `@moleculer/channels` 0.3.x.
- Explicit `channels` passed to `@service` are merged over decorated channels per channel name, because Moleculer replaces that schema property instead of merging it.

## 2.0.0-rc.1

### Fixed

- Decorated class mixins are now recognized across ESM/CommonJS, bundled copies, and pnpm peer-dependency package instances within the same process.

## 2.0.0-rc.0

### Added

- Standard TypeScript decorators for services, actions, events, methods, and lifecycle handlers.
- Decorated classes as first-class Moleculer mixins, including nested mixins.
- `defineSettings` and `ServiceSettings` for service-specific settings inference.
- Dual ESM/CommonJS builds, package validation, coverage, CI, and npm trusted publishing.

### Changed

- Node.js 22, TypeScript 5.2 standard decorators, and Moleculer 0.14.35/0.15.x are now required.
- Biome now provides formatting, import organization, and linting.
- Moleculer's native mixin implementation now performs all schema merging.
- Service names are required and decorated service inheritance is rejected.

### Removed

- The public `dset` helper and unexported `field` decorator.
- The legacy PascalCase decorator implementation.
- Runtime dependencies on `lodash.defaultsdeep` and `reflect-metadata`.
