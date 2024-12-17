import { Delay } from "@commons/units";

interface HealthCheckConstructor {
    test: string[];
    interval: Delay;
    timeout?: Delay;
    retries?: number;
    start_period?: Delay;
    start_interval?: Delay;
}

export class HealthCheck {
    test: string[];
    interval: Delay;
    timeout?: Delay;
    retries?: number;
    start_period?: Delay;
    start_interval?: Delay;

    constructor(options: HealthCheckConstructor) {
        this.test = options.test;
        this.interval = options.interval;
        this.timeout = options.timeout;
        this.retries = options.retries;
        this.start_period = options.start_period;
        this.start_interval = options.start_interval;
    }

    toDict(): object|undefined {
        if(this.test.length > 0){
            return {
                test: ["CMD",...this.test],
                interval: this.interval.toString(),
                timeout: this.timeout?.toString(),
                retries: this.retries,
                start_period: this.start_period?.toString(),
                start_interval: this.start_interval?.toString(),
            };
        }
    }

    toJSON(){
        return this.toDict()
    }
}
