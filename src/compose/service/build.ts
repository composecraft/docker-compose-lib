import { KeyValue } from "@commons/keyValue";
import { ByteValue } from "@commons/units";
import { getSimpleValues, toKeyValuePairs, toStringArray } from "@commons/utils";

export interface BuildConstructor {
    context: string;
    dockerfile?: string;
    args?: KeyValue[];
    ssh?: KeyValue[];
    extra_hosts?: string[];
    privileged?: boolean;
    labels?: KeyValue[];
    no_cache?: boolean;
    pull?: boolean;
    shm_size?: ByteValue;
    target?: string;
    secrets?: string[];
    tags?: string[];
    platforms?: string[];
}

export class Build {
    context: string;
    dockerfile?: string;
    args?: KeyValue[];
    ssh?: KeyValue[];
    extra_hosts?: string[];
    privileged?: boolean;
    labels?: KeyValue[];
    no_cache?: boolean;
    pull?: boolean;
    shm_size?: ByteValue;
    target?: string;
    secrets?: string[];
    tags?: string[];
    platforms?: string[];

    constructor(options: BuildConstructor) {
        this.context = options.context;
        this.dockerfile = options.dockerfile;
        this.args = options.args;
        this.ssh = options.ssh;
        this.extra_hosts = options.extra_hosts;
        this.privileged = options.privileged;
        this.labels = options.labels;
        this.no_cache = options.no_cache;
        this.pull = options.pull;
        this.shm_size = options.shm_size;
        this.target = options.target;
        this.secrets = options.secrets;
        this.tags = options.tags;
        this.platforms = options.platforms;
    }

    toDict(): object {
        return {
            context: this.context,
            dockerfile: this.dockerfile,
            args: this.args?.map((keyvalue) => keyvalue.toString()),
            ssh: this.ssh?.map((ssh) => ssh.toString()),
            extra_hosts: this.extra_hosts,
            privileged: this.privileged,
            labels: this.labels?.map((label) => label.toString()),
            no_cache: this.no_cache,
            pull: this.pull,
            shm_size: this.shm_size?.toString(),
            target: this.target,
            secrets: this.secrets,
            tags: this.tags,
            platforms: this.platforms,
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromDict(input: any): Build {
        if (typeof input === "string") {
            return new Build({ context: input });
        }
        const simple = getSimpleValues(input);
        const toKeyValues = (raw: unknown, prefix: string): KeyValue[] | undefined => {
            const pairs = toKeyValuePairs(raw);
            return pairs.length > 0 ? pairs.map(([key, value]) => new KeyValue(key, value, prefix)) : undefined;
        };
        return new Build({
            context: input?.context ?? ".",
            dockerfile: simple.dockerfile as string | undefined,
            target: simple.target as string | undefined,
            privileged: simple.privileged as boolean | undefined,
            no_cache: simple.no_cache as boolean | undefined,
            pull: simple.pull as boolean | undefined,
            shm_size: ByteValue.fromString(input?.shm_size),
            args: toKeyValues(input?.args, "arg_"),
            ssh: toKeyValues(input?.ssh, "ssh_"),
            labels: toKeyValues(input?.labels, "lab_"),
            extra_hosts: toStringArray(input?.extra_hosts),
            secrets: toStringArray(input?.secrets),
            tags: toStringArray(input?.tags),
            platforms: toStringArray(input?.platforms),
        });
    }

    toJSON(){
        return this.toDict()
    }
}
