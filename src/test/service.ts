import { Context, Service as MoleculerService, ServiceBroker } from 'moleculer';

import { action, event, method, service, started } from '../service_next/service.js';

@service({
    name: 't0',
})
class T0 extends MoleculerService {
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

const broker = new ServiceBroker();
broker.createService(T0);
await broker.start();

setInterval(() => {
    broker.call('t0.actionHandler');
}, 1000);
