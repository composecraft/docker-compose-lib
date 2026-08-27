import { randomUUID } from "@commons/randomUuid";
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
        this.id = "vol_" + randomUUID();
        this.name = name;
        this.driver = driver;
        this.driver_opts = driver_opts;
        this.labels = labels;
        this.external = external;
    }

    /** True when the volume carries nothing but docker's defaults, so `name:` alone describes it. */
    isSimple(): boolean {
        return (
            this.driver === VolumeDriver.LOCAL &&
            !this.driver_opts?.length &&
            !this.labels?.length &&
            !this.external
        );
    }

    toDict(): object {
        return {
            driver: this.driver.toString(),
            driver_opts: this.driver_opts?.map((dr) => dr.toString()),
            labels: this.labels?.map((lab) => lab.toString()),
            external: this.external ? this.external : undefined,
        };
    }
}

export { Volume };
