export class Image {
    name?: string;
    tag?: string;
    digest?: string;

    constructor({ name, tag = "latest", digest }: { name: string; tag?: string; digest?: string }) {
        this.name = name;
        this.tag = digest ? undefined : tag;
        this.digest = digest;
    }

    /**
     * Parses a docker image reference. A colon only introduces a tag when it
     * comes after the last `/`, so a registry port (`registry:5000/app:1.2`)
     * is not mistaken for one.
     */
    static fromString(input: string): Image {
        const reference = String(input);
        const digestSeparator = reference.indexOf("@");
        if (digestSeparator !== -1) {
            return new Image({
                name: reference.slice(0, digestSeparator),
                digest: reference.slice(digestSeparator + 1),
            });
        }
        const lastColon = reference.lastIndexOf(":");
        if (lastColon > reference.lastIndexOf("/")) {
            return new Image({ name: reference.slice(0, lastColon), tag: reference.slice(lastColon + 1) });
        }
        return new Image({ name: reference });
    }

    toString() {
        if (this.digest) {
            return `${this.name}@${this.digest}`;
        }
        return `${this.name}:${this.tag || "latest"}`;
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
    DAILY = "daily",
    WEEKLY = "weekly",
}
