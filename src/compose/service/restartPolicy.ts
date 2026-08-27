import { Delay } from "@commons/units";

export enum RestartPolicyCondition {
    NONE = "none",
    ON_FAILURE = "on-failure",
    ALWAYS = "always",
    UNLESS_STOPPED = "unless-stopped",
    /** @deprecated typo kept for backwards compatibility — use {@link RestartPolicyCondition.UNLESS_STOPPED}. */
    // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
    UNLESS_TOPPED = "unless-stopped",
    ANY = "any",
    NO = "no",
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromDict(input: any): RestartPolicy | undefined {
        const condition = toRestartPolicyCondition(input?.condition);
        if (!condition) {
            return undefined;
        }
        return new RestartPolicy({
            condition,
            delay: Delay.fromString(input?.delay),
            max_attempts: typeof input?.max_attempts === "number" ? input.max_attempts : undefined,
            window: Delay.fromString(input?.window),
        });
    }

    toJSON(){
        return this.toDict()
    }
}

/** Maps a raw `restart:` / `restart_policy.condition:` value onto the enum, or undefined if unknown. */
export function toRestartPolicyCondition(input: unknown): RestartPolicyCondition | undefined {
    if (typeof input !== "string") {
        return undefined;
    }
    const known = Object.values(RestartPolicyCondition) as string[];
    return known.includes(input) ? (input as RestartPolicyCondition) : undefined;
}
