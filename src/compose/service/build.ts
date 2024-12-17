import { KeyValue } from "@commons/keyValue";
import { ByteUnits } from "@commons/units";
import { getSimpleValues } from "@commons/utils";

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
    shm_size?: ByteUnits;
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
    shm_size?: ByteUnits;
    target?: string;
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
            shm_size: this.shm_size,
            target: this.target,
            tags: this.tags,
            platforms: this.platforms,
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromDict(input:any):Build{
        const result = new Build({context:input.context, ...getSimpleValues(input)})
        return result
    }

    toJSON(){
        return this.toDict()
    }
}
