import { Image, PullPolicy } from "@compose/service/image";
import { PortMapping } from "@compose/service/portMapping";
import { Binding } from "@compose/volume";
import { Build } from "@compose/service/build";
import { Deploy } from "@compose/service/deploy";
import { HealthCheck } from "@compose/service/healthCheck";
import { Env, KeyValue } from "@commons/keyValue";
import { RestartPolicyCondition } from "@compose/service/restartPolicy";
import { Secret } from "@compose/secret";
import { IllegalArgumentException } from "@compose/errors";
import { v4 } from "uuid";
import { Network } from "@compose/network";
import { SuperSet } from "@commons/superSet";
import { Serializable } from "@commons/serializable";

export class Service extends Serializable {
    id: string;
    name: string;
    image?: Image;
    ports?: PortMapping[];
    bindings: SuperSet<Binding>;
    attach?: boolean;
    build?: Build;
    command?: string[];
    configs?: string[];
    deploy?: Deploy;
    dns?: string[];
    entrypoint?: string;
    environment?: SuperSet<Readonly<Env>>;
    healthcheck?: HealthCheck;
    hostname?: string;
    labels?: KeyValue[];
    privileged: boolean;
    pull_policy?: PullPolicy;
    readonly?: boolean;
    restart?: RestartPolicyCondition;
    secrets: SuperSet<Readonly<Secret>>;
    working_dir?: string;
    depends_on: SuperSet<Readonly<Service>>;
    networks: SuperSet<Readonly<Network>>;

    constructor(init: Partial<Service>) {
        super();
        this.id = "ser_" + v4();
        this.name = init.name || "";
        this.image = init.image;
        this.ports = init.ports;
        this.attach = init.attach;
        this.build = init.build;
        this.command = init.command;
        this.configs = init.configs;
        this.deploy = init.deploy;
        this.dns = init.dns;
        this.entrypoint = init.entrypoint;
        this.environment = init.environment;
        this.healthcheck = init.healthcheck;
        this.hostname = init.hostname;
        this.labels = init.labels;
        this.privileged = init.privileged ?? false;
        this.pull_policy = init.pull_policy;
        this.readonly = init.readonly;
        this.restart = init.restart;
        this.secrets = init.secrets || new SuperSet();
        this.working_dir = init.working_dir;
        this.bindings = init.bindings || new SuperSet();
        this.depends_on = init.depends_on || new SuperSet();
        this.networks = init.networks || new SuperSet();
        this.check();
    }

    check() {
        if (this.image && this.build) {
            throw new IllegalArgumentException("Service cannot have both an image and build");
        }
    }

    equals(other: Service): boolean {
        return this.name === other.name;
    }
}
