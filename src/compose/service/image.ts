export class Image {
    name?: string;
    tag?: string;

    constructor({ name, tag = "latest" }: { name: string; tag?: string }) {
        this.name = name;
        this.tag = tag;
    }

    toString() {
        return `${this?.name}:${this?.tag || "latest"}`;
    }

    toJSON(){
        return this.toString()
    }
}

export enum PullPolicy {
    ALWAYS = "always",
    NEVER = "never",
    MISSING = "missing",
    BUILD = "build",
}
