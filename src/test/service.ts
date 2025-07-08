import { Context, Service as MoleculerService, ServiceBroker } from 'moleculer';

import { action, event, method, field, service, started } from '../service_next/service.js';

@service({
    name: 't0',
})
class T0 extends MoleculerService {

    @field(43)
    public field!: number;

    @action({})
    public async actionHandler(ctx: Context) {
        console.log(123);
    }

    @event({})
    public async eventHandler(ctx: Context) {
        console.log(123);
    }

    @started started() {
        this.logger.info(0);
    }
}

const T1 = {
    name: 't1',
    actions: {
        actionHandler: (ctx: Context) => {
            console.log(123);
        }
    },
    methods: {

    }
}

type ExtendedService = MoleculerService & T0 & typeof T1;

type WithMixins = T & T0;

@service({
    name: 't',
    mixins: [T0, T1]
})
class T extends MoleculerService {

    @action({})
    public async actionHandler(this: WithMixins, ctx: Context) {
        console.log(123, this.field);
    }

    @event({})
    public async eventHandler(ctx: Context) {
        console.log(123);
    }

    @started started() {
        this.logger.info(0);
    }
}

const broker = new ServiceBroker();
broker.createService(T);
await broker.start();

setInterval(() => {
    broker.call('t.actionHandler');
}, 1000);
