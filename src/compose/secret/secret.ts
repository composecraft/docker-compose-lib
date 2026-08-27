import { IllegalArgumentException } from "@compose/errors";
import { randomUUID } from "@commons/randomUuid";
import { Serializable } from "@commons/serializable";

interface SecretOptions {
    name: string;
    external?: boolean;
    file?: string;
    environment?: string;
}

export class Secret extends Serializable {
    id: string;
    name: string;
    external?: boolean;
    file?: string;
    environment?: string;

    constructor(options: SecretOptions) {
        super();
        this.id = "sec_" + randomUUID();
        this.name = options.name;
        this.external = options.external;
        this.file = options.file;
        this.environment = options.environment;
        this.check();
    }

    toDict(): object {
        return {
            external: this.external,
            file: this.file,
            environment: this.environment,
        };
    }

    check() {
        const test = [this.external, this.file, this.environment].filter((item) => item !== undefined);
        if (test.length > 1) {
            throw new IllegalArgumentException(
                "Secret must be either external, or have a file or be defined by an environment variable",
            );
        }
    }

    equals(other: Secret): boolean {
        return this.name === other.name;
    }
}
