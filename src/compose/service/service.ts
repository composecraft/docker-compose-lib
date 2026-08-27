import { Image, PullPolicy } from "@compose/service/image";
import { PortMapping } from "@compose/service/portMapping";
import { Binding } from "@compose/volume";
import { Build } from "@compose/service/build";
import { Deploy } from "@compose/service/deploy";
import { HealthCheck } from "@compose/service/healthCheck";
import { Env, KeyValue } from "@commons/keyValue";
import { RestartPolicyCondition } from "@compose/service/restartPolicy";
import { BlkioConfig } from "@compose/service/blkioConfig";
import { Secret } from "@compose/secret";
import { IllegalArgumentException } from "@compose/errors";
import { randomUUID } from "@commons/randomUuid";
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
    blkio_config?: BlkioConfig;
    build?: Build;
    /** Shell form is kept as a string, exec form as an argv array — docker treats them differently. */
    command?: string | string[];
    configs?: string[];
    container_name?: string;
    deploy?: Deploy;
    dns?: string[];
    entrypoint?: string | string[];
    env_file?: string[];
    environment?: SuperSet<Readonly<Env>>;
    expose?: string[];
    extra_hosts?: string[];
    healthcheck?: HealthCheck;
    hostname?: string;
    labels?: KeyValue[];
    privileged: boolean;
    pull_policy?: PullPolicy;
    read_only?: boolean;
    restart?: RestartPolicyCondition;
    secrets: SuperSet<Readonly<Secret>>;
    stop_signal?: string;
    working_dir?: string;
    depends_on: SuperSet<Readonly<Service>>;
    networks: SuperSet<Readonly<Network>>;
    network_mode?: string

    constructor(init: Partial<Service>) {
        super();
        this.id = "ser_" + randomUUID();
        this.name = init.name || "";
        this.image = init.image;
        this.ports = init.ports;
        this.attach = init.attach;
        this.blkio_config = init.blkio_config;
        this.build = init.build;
        this.command = init.command;
        this.configs = init.configs;
        this.container_name = init.container_name;
        this.deploy = init.deploy;
        this.dns = init.dns;
        this.entrypoint = init.entrypoint;
        this.env_file = init.env_file;
        this.environment = init.environment;
        this.expose = init.expose;
        this.extra_hosts = init.extra_hosts;
        this.healthcheck = init.healthcheck;
        this.hostname = init.hostname;
        this.labels = init.labels;
        this.privileged = init.privileged ?? false;
        this.pull_policy = init.pull_policy;
        this.read_only = init.read_only;
        this.restart = init.restart;
        this.secrets = init.secrets || new SuperSet();
        this.stop_signal = init.stop_signal;
        this.working_dir = init.working_dir;
        this.bindings = init.bindings || new SuperSet();
        this.depends_on = init.depends_on || new SuperSet();
        this.networks = init.networks || new SuperSet();
        this.network_mode = init.network_mode
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
