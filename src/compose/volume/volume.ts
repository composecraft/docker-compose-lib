import { v4 } from "uuid";
import { KeyValue } from "@commons/keyValue";
import { VolumeDriver } from "@compose/volume/driver";
import { Serializable } from "@commons/serializable";

export interface VolumeConstructor {
    name: string;
    driver?: VolumeDriver;
    driver_opts?: KeyValue[];
    labels?: KeyValue[];
    external?: boolean;
}

class Volume extends Serializable{
    id: string;
    name: string;
    driver: VolumeDriver;
    driver_opts?: KeyValue[];
    labels?: KeyValue[];
    external: boolean;

    constructor({ name, driver = VolumeDriver.LOCAL, driver_opts, labels, external = false }: VolumeConstructor) {
        super();
        this.id = "vol_" + v4();
        this.name = name;
        this.driver = driver;
        this.driver_opts = driver_opts;
        this.labels = labels;
        this.external = external;
    }

    isSimple(): boolean {
        return !(this.driver || this.driver_opts || this.labels || this.external);
    }

    toDict(): object {
        return {
            driver: this.driver.toString(),
            driver_opts: this.driver_opts?.map((dr) => dr.toString()),
            labels: this.labels?.map((lab) => lab.toString()),
            external: this.external,
        };
    }
}

export { Volume };
