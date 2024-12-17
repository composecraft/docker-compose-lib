import { Serializable } from "@commons/serializable";
import { AccessType } from "@commons/volumeAccesType";
import { Volume } from "@compose/volume/volume";
import { v4 } from "uuid";

export enum BindingType {
    LOCAL,
    DOCKER_VOLUME,
}

export class Binding extends Serializable {
    id: string;
    source: string | Volume;
    target: string;
    mode: AccessType;

    constructor({
        source,
        target,
        mode = AccessType.READ_WRITE,
    }: {
        source: string | Volume;
        target: string;
        mode?: AccessType;
    }) {
        super();
        this.id = "bin_" + v4();
        this.source = source;
        this.target = target;
        this.mode = mode;
    }

    getBindingType(): BindingType {
        if (this.source instanceof Volume) {
            return BindingType.DOCKER_VOLUME;
        }
        return BindingType.LOCAL;
    }

    toString(): string {
        return `${this.source instanceof Volume ? this.source.name : this.source}:${this.target}${this.mode === AccessType.READ_ONLY ? `:${this.mode.toString()}` : ""}`;
    }
}
