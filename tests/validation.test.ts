import { Service } from 'moleculer';
import { describe, expect, it } from 'vitest';

import { action, created, event, lifecycle, method, service } from '../src/index.js';

describe('decorator validation', () => {
    it('rejects static and private members', () => {
        expect(() => {
            class StaticAction {
                @action()
                static invalid() {}
            }
            return StaticAction;
        }).toThrow('@action cannot decorate a static method');

        expect(() => {
            class PrivateMethod {
                @method
                #invalid() {}
            }
            return PrivateMethod;
        }).toThrow('@method cannot decorate a private method');
    });

    it('requires explicit names for symbol-named actions and events', () => {
        const symbol = Symbol('handler');
        expect(() => {
            class SymbolAction {
                @action()
                [symbol]() {}
            }
            return SymbolAction;
        }).toThrow('requires a non-empty string name');

        expect(() => {
            class SymbolEvent {
                @event({ name: 'named.event' })
                [symbol]() {}
            }
            return SymbolEvent;
        }).not.toThrow();
    });

    it('enforces reserved lifecycle decorator names', () => {
        expect(() => {
            class WrongCreated {
                @created
                protected initialize() {}
            }
            return WrongCreated;
        }).toThrow('@created must decorate a method named "created"');

        expect(() => {
            class ReservedLifecycle {
                @lifecycle
                protected started() {}
            }
            return ReservedLifecycle;
        }).toThrow('Use @started for the reserved "started" lifecycle method');

        expect(() => {
            class CustomLifecycle {
                @lifecycle
                protected healthy() {}
            }
            return CustomLifecycle;
        }).not.toThrow();
    });

    it('validates service options and target classes at runtime', () => {
        const context = {
            addInitializer() {},
            kind: 'class',
            metadata: {},
            name: 'Invalid',
        } as ClassDecoratorContext<any>;

        expect(() =>
            service({ name: 'invalid' })(
                class {} as any,
                {
                    ...context,
                    kind: 'method',
                } as any,
            ),
        ).toThrow('@service can only decorate classes');
        expect(() => service(null as any)(class {} as any, context)).toThrow(
            '@service requires an options object',
        );

        expect(() => service({ name: '' } as any)(class {} as any, context)).toThrow(
            'requires a non-empty service name',
        );
        expect(() => service({ name: 'invalid' })(class {} as any, context)).toThrow(
            'must extend Moleculer Service',
        );
        expect(() =>
            service({ name: 'invalid', mixins: null as any })(Service as any, context),
        ).toThrow('mixins must be an array');
    });

    it('rejects undecorated class mixins, circular mixins, and decorated inheritance', () => {
        class UndecoratedMixin extends Service {}

        expect(() => {
            @service({ name: 'invalid-mixin', mixins: [UndecoratedMixin] })
            class InvalidMixin extends Service {}
            return InvalidMixin;
        }).toThrow('Class mixins must also be decorated');

        expect(() => {
            @service({ name: 'primitive-mixin', mixins: [42 as any] })
            class PrimitiveMixin extends Service {}
            return PrimitiveMixin;
        }).toThrow('Mixins must be service schemas or classes decorated');

        expect(() => {
            @service({ name: 'invalid-nested-mixins', mixins: [{ mixins: {} as any }] })
            class InvalidNestedMixins extends Service {}
            return InvalidNestedMixins;
        }).toThrow("A mixin schema's mixins property must be an array");

        const circular: any = { mixins: [] };
        circular.mixins.push(circular);
        expect(() => {
            @service({ name: 'circular-mixin', mixins: [circular] })
            class CircularMixin extends Service {}
            return CircularMixin;
        }).toThrow('Circular mixin graphs are not supported');

        @service({ name: 'base-service' })
        class BaseService extends Service {}

        expect(() => {
            @service({ name: 'derived-service' })
            class DerivedService extends BaseService {}
            return DerivedService;
        }).toThrow('Decorated service inheritance is unsupported');

        class IntermediateService extends BaseService {}

        expect(() => {
            @service({ name: 'indirect-derived-service' })
            class IndirectDerivedService extends IntermediateService {}
            return IndirectDerivedService;
        }).toThrow('Decorated service inheritance is unsupported');
    });
});
