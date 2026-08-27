import { KeyValue } from "@commons/keyValue";
import { RestartPolicy } from "@compose/service/restartPolicy";
import { RollbackConfig, UpdateConfig } from "@compose/service/config";
import { toKeyValuePairs } from "@commons/utils";

export type Placement = {
    max_replicas_per_node?: number;
    constraints?: KeyValue[];
    preferences?: KeyValue[];
};

export enum Mode {
    GLOBAL = "global",
    REPLICATED = "replicated",
}

export type Resource = {
    limits?: {
        cpus?: number;
        memory?: string;
        pids?: number;
    };
    reservations?: {
        cpus?: number;
        memory?: string;
    };
};

/** @deprecated misspelling kept for backwards compatibility — use {@link Resource}. */
export type Ressource = Resource;

interface DeployConstructor {
    replicas?: number;
    labels?: KeyValue[];
    mode?: Mode;
    placement?: Placement;
    resources?: Resource;
    restart_policy?: RestartPolicy;
    rollback_config?: RollbackConfig;
    update_config?: UpdateConfig;
}

export class Deploy {
    replicas?: number;
    labels?: KeyValue[];
    mode?: Mode;
    placement?: Placement;
    resources?: Resource;
    restart_policy?: RestartPolicy;
    rollback_config?: RollbackConfig;
    update_config?: UpdateConfig;

    constructor(options: DeployConstructor) {
        this.replicas = options.replicas;
        this.labels = options.labels;
        this.mode = options.mode;
        this.placement = options.placement;
        this.resources = options.resources;
        this.restart_policy = options.restart_policy;
        this.rollback_config = options.rollback_config;
        this.update_config = options.update_config;
    }

    private placementToDict(): object | undefined {
        if (!this.placement) {
            return undefined;
        }
        return {
            max_replicas_per_node: this.placement.max_replicas_per_node,
            constraints: this.placement.constraints?.map((constr) => constr.toString()),
            preferences: this.placement.preferences?.map((pref) => pref.toString()),
        };
    }

    toDict(): object {
        return {
            replicas: this.replicas,
            labels: this.labels?.map((keyvalue) => keyvalue.toString()),
            mode: this.mode?.toString(),
            placement: this.placementToDict(),
            resources: this.resources,
            restart_policy: this.restart_policy?.toDict(),
            rollback_config: this.rollback_config?.toDict(),
            update_config: this.update_config?.toDict(),
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static placementFromDict(input: any): Placement | undefined {
        if (!input || typeof input !== "object") {
            return undefined;
        }
        const toKeyValues = (raw: unknown, prefix: string) => {
            const pairs = toKeyValuePairs(raw);
            return pairs.length > 0 ? pairs.map(([key, value]) => new KeyValue(key, value, prefix)) : undefined;
        };
        return {
            max_replicas_per_node:
                typeof input.max_replicas_per_node === "number" ? input.max_replicas_per_node : undefined,
            constraints: toKeyValues(input.constraints, "cst_"),
            preferences: toKeyValues(input.preferences, "prf_"),
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromDict(input: any): Deploy | undefined {
        if (!input || typeof input !== "object") {
            return undefined;
        }
        const modes = Object.values(Mode) as string[];
        const labels = toKeyValuePairs(input.labels);
        return new Deploy({
            replicas: typeof input.replicas === "number" ? input.replicas : undefined,
            labels: labels.length > 0 ? labels.map(([key, value]) => new KeyValue(key, value, "lab_")) : undefined,
            mode: modes.includes(input.mode) ? (input.mode as Mode) : undefined,
            placement: Deploy.placementFromDict(input.placement),
            resources: input.resources && typeof input.resources === "object" ? (input.resources as Resource) : undefined,
            restart_policy: RestartPolicy.fromDict(input.restart_policy),
            rollback_config: RollbackConfig.fromDict(input.rollback_config),
            update_config: UpdateConfig.fromDict(input.update_config),
        });
    }

    toJSON(){
        return this.toDict()
    }
}
