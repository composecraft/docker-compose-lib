import { KeyValue } from "@commons/keyValue";
import { randomUUID } from "@commons/randomUuid";
import { NetworkDriver } from "@compose/network/driver";
import { Serializable } from "@commons/serializable";

export interface NetworkConstructor {
    name: string;
    driver?: NetworkDriver;
    driver_opts?: KeyValue[];
    attachable?: boolean;
    external?: boolean;
    internal?: boolean;
    labels?: KeyValue[];
}

class Network extends Serializable {
    id: string;
    name: string;
    driver: NetworkDriver;
    driver_opts?: KeyValue[];
    attachable: boolean;
    external: boolean;
    internal: boolean;
    labels?: KeyValue[];

    constructor({
        name,
        driver = NetworkDriver.BRIDGE,
        driver_opts,
        attachable = false,
        external = false,
        internal = false,
        labels,
    }: NetworkConstructor) {
        super();
        this.id = "net_" + randomUUID();
        this.name = name;
        this.driver = driver;
        this.driver_opts = driver_opts;
        this.attachable = attachable;
        this.external = external;
        this.internal = internal;
        this.labels = labels;
    }

    toDict(): object {
        return {
            driver: this.driver.toString(),
            driver_opts: this.driver_opts?.map((driv) => driv.toString()),
            attachable: this.attachable ? this.attachable : undefined,
            external: this.external ? this.external : undefined,
            internal: this.internal ? this.internal : undefined,
            labels: this.labels?.map((lab) => lab.toString()),
        };
    }

    equals(other: Network): boolean {
        return this.name === other.name;
    }
}

export { Network };
