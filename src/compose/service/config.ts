import { Delay } from "@commons/units";

export enum FailureAction {
    PAUSE = "pause",
    CONTINUE = "continue",
    ROLLBACK = "rollback",
}

export enum Order {
    STOP_FIRST = "stop-first",
    START_FIRST = "start-first",
}

interface RollbackConfigConstructor {
    parallelism?: number;
    delay?: Delay;
    failure_action?: FailureAction;
    monitor?: Delay;
    max_failure_ratio?: number;
    order?: Order;
}

export class RollbackConfig {
    parallelism?: number;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected static parse(input: any): RollbackConfigConstructor | undefined {
        if (!input || typeof input !== "object") {
            return undefined;
        }
        const failureActions = Object.values(FailureAction) as string[];
        const orders = Object.values(Order) as string[];
        return {
            parallelism: typeof input.parallelism === "number" ? input.parallelism : undefined,
            delay: Delay.fromString(input.delay),
            failure_action: failureActions.includes(input.failure_action)
                ? (input.failure_action as FailureAction)
                : undefined,
            monitor: Delay.fromString(input.monitor),
            max_failure_ratio: typeof input.max_failure_ratio === "number" ? input.max_failure_ratio : undefined,
            order: orders.includes(input.order) ? (input.order as Order) : undefined,
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromDict(input: any): RollbackConfig | undefined {
        const options = RollbackConfig.parse(input);
        return options ? new RollbackConfig(options) : undefined;
    }

    toJSON(){
        return this.toDict()
    }
}

export class UpdateConfig extends RollbackConfig {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromDict(input: any): UpdateConfig | undefined {
        const options = RollbackConfig.parse(input);
        return options ? new UpdateConfig(options) : undefined;
    }
}
