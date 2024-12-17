import { Delay } from "@commons/units";

export enum FailureAction {
    PAUSE = "pause",
    CONTINUE = "continue",
}

export enum Order {
    STOP_FIRST = "stop-first",
    START_FIRST = "start-first",
}

interface RollbackConfigConstructor {
    parallelism: number;
    delay?: Delay;
    failure_action?: FailureAction;
    monitor?: Delay;
    max_failure_ratio?: number;
    order?: Order;
}

export class RollbackConfig {
    parallelism: number;
    delay?: Delay;
    failure_action?: FailureAction;
    monitor?: Delay;
    max_failure_ratio?: number;
    order?: Order;

    constructor(options: RollbackConfigConstructor) {
        this.parallelism = options.parallelism;
        this.delay = options.delay;
        this.failure_action = options.failure_action;
        this.monitor = options.monitor;
        this.max_failure_ratio = options.max_failure_ratio;
        this.order = options.order;
    }

    toDict(): object {
        return {
            parallelism: this.parallelism,
            delay: this.delay?.toString(),
            failure_action: this.failure_action?.toString(),
            monitor: this.monitor?.toString(),
            max_failure_ratio: this.max_failure_ratio,
            order: this.order?.toString(),
        };
    }

    toJSON(){
        return this.toDict()
    }
}

export class UpdateConfig extends RollbackConfig {}
