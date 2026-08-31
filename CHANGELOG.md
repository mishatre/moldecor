# Changelog

All notable changes to moldecor are documented here.

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
