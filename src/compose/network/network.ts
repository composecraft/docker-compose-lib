import { KeyValue } from "@commons/keyValue";
import { v4 } from "uuid";
import { NetworkDriver } from "@compose/network/driver";

export interface NetworkConstructor {
    name: string;
    driver?: NetworkDriver;
    driver_opts?: KeyValue[];
    attachable?: boolean;
    external?: boolean;
    internal?: boolean;
    labels?: KeyValue[];
}

class Network {
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
        this.id = "net_" + v4();
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

    toJSON(){
        return this.toDict()
    }
}

export { Network };
