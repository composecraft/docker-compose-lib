import { KeyValue } from "@commons/keyValue";
import { RestartPolicy } from "@compose/service/restartPolicy";
import { RollbackConfig, UpdateConfig } from "@compose/service/config";

export type Placement = {
    max_replicas_per_node?: number;
    constraints?: KeyValue[];
    preferences?: KeyValue[];
};

export enum Mode {
    GLOBAL = "global",
    REPLICATED = "replicated",
}

export type Ressource = {
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

interface DeployConstructor {
    replicas?: number;
    labels?: KeyValue[];
    mode?: Mode;
    placement?: Placement;
    restart_policy?: RestartPolicy;
    rollback_config?: RollbackConfig;
    update_config?: UpdateConfig;
}

export class Deploy {
    replicas?: number;
    labels?: KeyValue[];
    mode?: Mode;
    placement?: Placement;
    restart_policy?: RestartPolicy;
    rollback_config?: RollbackConfig;
    update_config?: UpdateConfig;

    constructor(options: DeployConstructor) {
        this.replicas = options.replicas;
        this.labels = options.labels;
        this.mode = options.mode;
        this.placement = options.placement;
        this.restart_policy = options.restart_policy;
        this.rollback_config = options.rollback_config;
        this.update_config = options.update_config;
    }

    toDict(): object {
        return {
            replicas: this.replicas,
            labels: this.labels?.map((keyvalue) => keyvalue.toString()),
            mode: this.mode?.toString(),
            placement: {
                max_replicas_per_node: this.placement?.max_replicas_per_node,
                constraints: this.placement?.constraints?.map((constr) => constr.toString()),
                preferences: this.placement?.preferences?.map((pref) => pref.toString()),
            },
            restart_policy: this.restart_policy?.toDict(),
            rollback_config: this.rollback_config?.toDict(),
            update_config: this.update_config?.toDict(),
        };
    }

    toJSON(){
        return this.toDict()
    }
}
