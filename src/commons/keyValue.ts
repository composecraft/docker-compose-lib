import { randomUUID } from "@commons/randomUuid";

/**
 * Represents a key-value pair with a unique identifier.
 *
 * @remarks
 * This class is used to create structured key-value objects with an automatically
 * generated unique ID. The value is optional and can be left undefined.
 *
 * @example
 * ```typescript
 * const item = new KeyValue('username', 'johndoe');
 * console.log(item.toString());
 *
 * const emptyItem = new KeyValue('description');
 * console.log(item.toString());
 * ```
 */
export class KeyValue {
    key: string;
    value?: string;
    id: string;

    constructor(key: string, value?: string, prefix?: string) {
        this.key = key;
        this.value = value;
        this.id = (prefix || "") + randomUUID();
    }

    toString() {
        return `${this.key}=${this.value ? this.value : '""'}`;
    }
}

/**
 * Inherit from {@link KeyValue}, The only difference is the ID generated is formed as :
 * ```typescript
 * this.id = "env_" + randomUUID();
 * ```
 */
export class Env extends KeyValue{

    constructor(key: string, value?: string) {
        super(key,value);
        this.id = "env_" + randomUUID();
    }
}