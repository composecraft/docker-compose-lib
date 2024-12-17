import { Delay } from "@commons/units";

export enum RestartPolicyCondition {
    NONE = "none",
    ON_FAILURE = "on-failure",
    ALWAYS = "always",
    UNLESS_TOPPED = "unless-stopped",
    ANY = "any",
}

interface RestartPolicyConstructor {
    condition: RestartPolicyCondition;
    delay?: Delay;
    max_attempts?: number;
    window?: Delay;
}

export class RestartPolicy {
    condition: RestartPolicyCondition;
    delay?: Delay;
    max_attempts?: number;
    window?: Delay;

    constructor(options: RestartPolicyConstructor) {
        this.condition = options.condition;
        this.delay = options.delay;
        this.max_attempts = options.max_attempts;
        this.window = options.window;
    }

    toDict(): object {
        return {
            condition: this.condition.toString(),
            delay: this.delay?.toString(),
            max_attempts: this.max_attempts,
            window: this.window?.toString(),
        };
    }

    toJSON(){
        return this.toDict()
    }
}
