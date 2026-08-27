import { Serializable } from "@commons/serializable";
import { AccessType } from "@commons/volumeAccesType";
import { Volume } from "@compose/volume/volume";
import { randomUUID } from "@commons/randomUuid";
import { splitOutsideInterpolation } from "@commons/utils";

export enum BindingType {
    LOCAL,
    DOCKER_VOLUME,
    ANONYMOUS,
}

/** A bare name with no path separator is a named volume; anything else is a host path. */
const NAMED_VOLUME = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;

export function isNamedVolumeReference(source: string): boolean {
    return NAMED_VOLUME.test(source);
}

export class Binding extends Serializable {
    id: string;
    source?: string | Volume;
    target: string;
    mode: AccessType;

    constructor({
        source,
        target,
        mode = AccessType.READ_WRITE,
    }: {
        source?: string | Volume;
        target: string;
        mode?: AccessType;
    }) {
        super();
        this.id = "bin_" + randomUUID();
        this.source = source;
        this.target = target;
        this.mode = mode;
    }

    /**
     * Parses the short syntax `[SOURCE:]TARGET[:MODE]`. Colons nested in a
     * `${VAR:-default}` interpolation are not separators.
     */
    static fromString(input: string): Binding | undefined {
        const parts = splitOutsideInterpolation(input, ":");
        if (parts.length === 1) {
            return new Binding({ target: parts[0] });
        }
        if (parts[0] === "" || parts[1] === "") {
            return undefined;
        }
        return new Binding({
            source: parts[0],
            target: parts[1],
            mode: parts[2] === AccessType.READ_ONLY ? AccessType.READ_ONLY : AccessType.READ_WRITE,
        });
    }

    getBindingType(): BindingType {
        if (this.source instanceof Volume) {
            return BindingType.DOCKER_VOLUME;
        }
        if (this.source === undefined) {
            return BindingType.ANONYMOUS;
        }
        return BindingType.LOCAL;
    }

    toString(): string {
        const source = this.source instanceof Volume ? this.source.name : this.source;
        const mode = this.mode === AccessType.READ_ONLY ? `:${this.mode.toString()}` : "";
        return `${source === undefined ? "" : `${source}:`}${this.target}${mode}`;
    }
}
