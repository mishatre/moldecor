import { Service } from 'moleculer';

import { action, defineSettings, event, service } from '../src/index.js';

const settings = defineSettings({
    $dependencyTimeout: 5_000,
    endpoint: 'https://example.com',
    nested: {
        enabled: true,
    },
});

const dependencyTimeout: number | undefined = settings.$dependencyTimeout;
const endpoint: string = settings.endpoint;
const enabled: boolean = settings.nested.enabled;
void dependencyTimeout;
void endpoint;
void enabled;

// @ts-expect-error Moleculer built-in settings retain their declared types.
defineSettings({ $dependencyTimeout: 'slow' });

@service({ name: 'typed-settings', settings })
class TypedSettingsService extends Service<typeof settings> {
    @action()
    protected inspectSettings() {
        const url: string = this.settings.endpoint;
        const timeout: number | undefined = this.settings.$shutdownTimeout;
        return { timeout, url };
    }
}

void TypedSettingsService;

@service({ name: 'typed-mixin' })
class TypedMixin extends Service {}

@service({ name: 'typed-mixin-consumer', mixins: [TypedMixin] })
class TypedMixinConsumer extends Service {}

// @ts-expect-error Service names are required.
service({});

class InvalidOptions {
    // @ts-expect-error Action handlers come from the decorated method.
    @action({ handler() {} })
    protected invalidAction() {}

    // @ts-expect-error Event handlers come from the decorated method.
    @event({ handler() {} })
    protected invalidEvent() {}
}

void TypedMixinConsumer;
void InvalidOptions;
