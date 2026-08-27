import { Delay } from "@commons/units";
import { toStringArray } from "@commons/utils";

/** Prefixes docker already understands — anything else is a bare command needing `CMD`. */
const TEST_KEYWORDS = ["NONE", "CMD", "CMD-SHELL"];

interface HealthCheckConstructor {
    test: string | string[];
    interval?: Delay;
    timeout?: Delay;
    retries?: number;
    start_period?: Delay;
    start_interval?: Delay;
    disable?: boolean;
}

export class HealthCheck {
    test: string | string[];
    interval?: Delay;
    timeout?: Delay;
    retries?: number;
    start_period?: Delay;
    start_interval?: Delay;
    disable?: boolean;

    constructor(options: HealthCheckConstructor) {
        this.test = options.test;
        this.interval = options.interval;
        this.timeout = options.timeout;
        this.retries = options.retries;
        this.start_period = options.start_period;
        this.start_interval = options.start_interval;
        this.disable = options.disable;
    }

    /**
     * Shell form (`test` as a string) is emitted verbatim; an array is emitted
     * as-is when it already starts with NONE/CMD/CMD-SHELL, and prefixed with
     * `CMD` only when it is a bare argv.
     */
    private testToDict(): string | string[] | undefined {
        if (typeof this.test === "string") {
            return this.test.length > 0 ? this.test : undefined;
        }
        if (this.test.length === 0) {
            return undefined;
        }
        return TEST_KEYWORDS.includes(this.test[0]) ? this.test : ["CMD", ...this.test];
    }

    toDict(): object | undefined {
        const test = this.testToDict();
        if (!test) {
            return undefined;
        }
        return {
            test,
            interval: this.interval?.toString(),
            timeout: this.timeout?.toString(),
            retries: this.retries,
            start_period: this.start_period?.toString(),
            start_interval: this.start_interval?.toString(),
            disable: this.disable,
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromDict(input: any): HealthCheck | undefined {
        if (!input || typeof input !== "object") {
            return undefined;
        }
        const test = typeof input.test === "string" ? input.test : toStringArray(input.test);
        if (!test) {
            return undefined;
        }
        return new HealthCheck({
            test,
            interval: Delay.fromString(input.interval),
            timeout: Delay.fromString(input.timeout),
            retries: typeof input.retries === "number" ? input.retries : undefined,
            start_period: Delay.fromString(input.start_period),
            start_interval: Delay.fromString(input.start_interval),
            disable: typeof input.disable === "boolean" ? input.disable : undefined,
        });
    }

    toJSON(){
        return this.toDict()
    }
}
