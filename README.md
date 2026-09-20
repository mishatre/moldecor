# moldecor

Type-safe [standard decorators](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html) for Moleculer services and mixins.

## Requirements

- Node.js 22 or newer
- TypeScript 5.2 or newer using standard decorators (`experimentalDecorators` disabled)
- Moleculer 0.14.35 or 0.15.x

## Install

```sh
pnpm add moldecor moleculer
```

Use a compiler target of ES2022 or lower and include decorator library types:

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "lib": ["ES2022", "ESNext.Decorators"],
        "experimentalDecorators": false
    }
}
```

Moldecor installs the small `Symbol.metadata` polyfill required by TypeScript before decorated classes are evaluated.

## Service

```ts
import { action, created, defineSettings, method, service, stopped } from 'moldecor';
import { Context, Service } from 'moleculer';

const settings = defineSettings({
    $dependencyTimeout: 10_000,
    greeting: 'Hello',
    endpoints: {
        users: 'https://example.com/users',
    },
});

@service({ name: 'greeter', settings })
export class GreeterService extends Service<typeof settings> {
    @action()
    greet(ctx: Context<{ name: string }>) {
        return `${this.settings.greeting}, ${ctx.params.name}!`;
    }

    @created
    protected created() {
        this.logger.info(`Using ${this.settings.endpoints.users}`);
    }

    @stopped
    protected async stopped() {
        // Release service resources here.
    }
}
```

`defineSettings` preserves the custom shape, validates Moleculer's built-in `$...` settings, and includes those optional built-ins in `this.settings`. The `Service<typeof settings>` annotation is still required because a decorator cannot change types inside the class it decorates.

## Mixins

Decorated services and normal Moleculer schemas can both be used as mixins:

```ts
@service({ name: 'audit' })
class AuditMixin extends Service {
    @method
    protected audit(message: string) {
        this.logger.info(message);
    }
}

const timestampMixin = {
    methods: {
        now: () => Date.now(),
    },
};

@service({
    name: 'orders',
    mixins: [AuditMixin, timestampMixin],
})
class OrdersService extends Service {
    @action()
    list() {
        return [];
    }
}
```

Nested mixins are supported. Decorated service inheritance is intentionally unsupported; compose decorated classes through `mixins` instead.

Schema precedence follows Moleculer itself, from lowest to highest:

1. Schemas in the `mixins` option, using Moleculer's normal ordering.
2. Members produced by moldecor method decorators.
3. Explicit schema properties passed to `@service`, such as `actions` or `hooks`.

## Channels

`@moleculer/channels` consumers are declared with `@channel`:

```ts
import { Middleware as ChannelsMiddleware } from '@moleculer/channels';
import { Context, Service, ServiceBroker } from 'moleculer';
import { channel, service } from 'moldecor';

const broker = new ServiceBroker({
    middlewares: [
        ChannelsMiddleware({
            adapter: 'redis://localhost:6379',
        }),
    ],
});

@service({ name: 'orders' })
class OrdersService extends Service {
    @channel({ group: 'orders', maxRetries: 2 })
    async onOrderCreated(payload: { id: number }) {
        await this.actions.fulfill(payload.id);
    }

    @channel({ context: true, group: 'payments' })
    async onPaymentProcessed(ctx: Context<{ id: number }>) {
        this.logger.info(`Payment ${ctx.params.id} for ${ctx.meta.customerId}`);
    }
}
```

The method name is the channel name, so `@channel()` on `onOrderCreated` consumes `onOrderCreated`. Pass `name` to consume a different topic, such as one owned by another system, and pass any other channel option (`group`, `maxInFlight`, `maxRetries`, `deadLettering`, `tracing`, adapter options like `redis` or `amqp`) to forward it to the middleware unchanged. The handler comes from the decorated method and is bound to the service instance.

Because the middleware prefixes a channel name with the adapter prefix (the broker namespace), moldecor only sets `name` when you provide it. An explicit `name` is used verbatim as the topic, exactly as it would be in a hand-written schema.

Channels declared with `context: true` receive a Moleculer `Context` whose `params` hold the payload; every other channel receives the payload itself. The second argument is always the raw adapter message.

### Custom schema properties

Each channels middleware reads its definitions from a schema property that defaults to `channels`. The optional second decorator argument registers a channel under a different property, which is how several adapters are combined:

```ts
@service({ name: 'orders' })
class OrdersService extends Service {
    @channel({ group: 'orders' }, { schemaProperty: 'redisChannels' })
    async onRedisTopic(payload: unknown) {
        // Consumed by ChannelsMiddleware({ schemaProperty: 'redisChannels' })
    }
}
```

The property must not be one of the schema properties Moleculer merges itself (`actions`, `events`, `methods`, `hooks`, `settings`, `metadata`, `mixins`, `dependencies`, `name`, `version`, or a lifecycle handler).

### Channel precedence

Unlike `actions` and `events`, `channels` is not a schema property Moleculer knows how to merge: a schema that sets it replaces the whole map below it. Moldecor therefore merges explicit service options over decorated channels per channel name, so the decorated handler stays and only the given options are overridden:

```ts
@service({
    name: 'orders',
    channels: {
        onOrderCreated: { group: 'overridden' },
    },
})
class OrdersService extends Service {
    @channel({ group: 'orders' })
    async onOrderCreated(payload: unknown) {}
}
```

Channel maps provided by other mixins are still replaced by decorated channels, because that merge happens inside Moleculer. Keep channel definitions in the service that owns the handler when composing mixins.

## API

- `@service(options)` creates a Moleculer service class. `name` is required.
- `@action(options?)` registers an action.
- `@event(options?)` registers an event listener.
- `@channel(options?, target?)` registers a `@moleculer/channels` consumer.
- `@method` registers a service method.
- `@created`, `@merged`, `@started`, and `@stopped` register reserved lifecycle methods with matching names.
- `@lifecycle` registers a non-reserved custom schema lifecycle method used by a Moleculer extension.
- `defineSettings(settings)` preserves and validates a service settings type.

Decorators can only be applied to non-private, non-static instance methods. A symbol-named action, event, or channel must provide a string `name` option.

## Migrating from v1

- Upgrade to Node 22+, TypeScript 5.2+, and standard decorators.
- Replace schema inheritance between decorated classes with `mixins`.
- Replace `@field` with normal class initialization or the `created` lifecycle hook.
- Remove imports of `dset` and any deep imports of the old PascalCase decorator implementation.
- Make every `@service` name explicit.
- Use `defineSettings` with `Service<typeof settings>` for strongly typed settings.

V2 delegates all schema merging to Moleculer, so action disabling, hook ordering, event concatenation, lifecycle ordering, settings, and dependency merging follow the installed Moleculer version.

## Development and releases

```sh
pnpm install
pnpm format # Apply Biome formatting, lint fixes, and import organization.
pnpm check
```

Generated `dist/` files are committed so tagged GitHub dependencies work without building. CI verifies that they match the source. See [CHANGELOG.md](./CHANGELOG.md) for release notes.

The first public release is bootstrapped as `2.0.0-rc.0` with the npm `next` tag. Stable `v*` tags publish through the protected GitHub Actions workflow using npm trusted publishing and provenance.

One-time release setup requires repository and registry administration:

1. Claim or verify ownership of the `moldecor` package on npm.
2. Publish `2.0.0-rc.0` manually with 2FA using `npm publish --tag next --access public`.
3. In npm trusted publishers, connect `mishatre/moldecor`, workflow `publish.yml`, and environment `npm`.
4. Protect the GitHub `npm` environment and `v*` tags with repository rules.
5. Set `package.json` to the stable version, commit the rebuilt `dist/`, and push the matching tag (for example, `v2.0.0`).

The publishing workflow rejects mismatched and prerelease tags, runs the complete package check, verifies committed build output, and publishes with OIDC provenance and no long-lived npm token.

## License

MIT © Mikhail Tregub
