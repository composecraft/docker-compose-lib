/**
 * Represents standardized time unit abbreviations.
 *
 * @remarks
 * This enum provides a consistent set of time unit representations
 * ranging from nanoseconds to hours, with their corresponding
 * standard abbreviated symbols.
 */
export enum TimeUnits {
    NANOSECONDS = "ns",
    MICROSECONDS = "us",
    MILLISECONDS = "ms",
    SECONDS = "s",
    MINUTES = "m",
    HOURS = "h",
}

/**
 * Represents standardized bytes units abbreviations.
 *
 * @remarks
 * This enum provides a consistent set of bytes units representations
 * ranging from bytes to gigabytes, with their corresponding
 * standard abbreviated symbols.
 */
export enum ByteUnits {
    BYTES = "b",
    KILOBYTES = "kb",
    MEGABYTES = "mb",
    GIGABYTES = "gb",
}

const NANOSECONDS_PER_UNIT: Record<TimeUnits, number> = {
    [TimeUnits.NANOSECONDS]: 1,
    [TimeUnits.MICROSECONDS]: 1e3,
    [TimeUnits.MILLISECONDS]: 1e6,
    [TimeUnits.SECONDS]: 1e9,
    [TimeUnits.MINUTES]: 60 * 1e9,
    [TimeUnits.HOURS]: 3600 * 1e9,
};

const BYTES_PER_UNIT: Record<ByteUnits, number> = {
    [ByteUnits.BYTES]: 1,
    [ByteUnits.KILOBYTES]: 1024,
    [ByteUnits.MEGABYTES]: 1024 ** 2,
    [ByteUnits.GIGABYTES]: 1024 ** 3,
};

/**
 * Represents a time delay with a specific value and unit {@link TimeUnits}.
 *
 * @remarks
 * The Delay class allows for creating and manipulating time delay
 * representations using various time units from nanoseconds to hours.
 *
 * @example
 * ```typescript
 * // Create delays using different time units
 * const shortDelay = new Delay(500, TimeUnits.MILLISECONDS);
 * const longDelay = new Delay(2, TimeUnits.HOURS);
 *
 * console.log(shortDelay.toString()); // Outputs: "500ms"
 * console.log(longDelay.toString());  // Outputs: "2h"
 * ```
 */
export class Delay {
    value: number;
    unit: TimeUnits;

    constructor(value: number, unit: TimeUnits) {
        this.value = value;
        this.unit = unit;
    }

    toString() {
        return `${this.value}${this.unit}`;
    }

    /**
     * Parses a docker compose duration (`10s`, `1m30s`, `500ms`).
     *
     * Compound durations are collapsed into the smallest unit they mention,
     * so `1m30s` becomes `90s` — a different spelling of the same duration.
     */
    static fromString(input: string | number | undefined): Delay | undefined {
        if (input === undefined || input === null) {
            return undefined;
        }
        if (typeof input === "number") {
            return new Delay(input, TimeUnits.SECONDS);
        }
        const matches = Array.from(input.trim().matchAll(/(\d+(?:\.\d+)?)\s*(ns|us|ms|s|m|h)/g));
        if (matches.length === 0) {
            return undefined;
        }
        let smallest = TimeUnits.HOURS;
        let totalNanoseconds = 0;
        for (const [, rawValue, rawUnit] of matches) {
            const unit = rawUnit as TimeUnits;
            totalNanoseconds += Number(rawValue) * NANOSECONDS_PER_UNIT[unit];
            if (NANOSECONDS_PER_UNIT[unit] < NANOSECONDS_PER_UNIT[smallest]) {
                smallest = unit;
            }
        }
        return new Delay(totalNanoseconds / NANOSECONDS_PER_UNIT[smallest], smallest);
    }
}

/**
 * Represents a byte size with a specific value and unit {@link ByteUnits}.
 *
 * @remarks
 * The ByteValue class allows for creating and manipulating Byte size
 * representations using various bytes size from byte to gigabytes.
 */
export class ByteValue {
    value: number;
    unit: ByteUnits;

    constructor(value: number, unit: ByteUnits) {
        this.value = value;
        this.unit = unit;
    }

    toString() {
        return `${this.value}${this.unit}`;
    }

    toBytes(): number {
        return this.value * BYTES_PER_UNIT[this.unit];
    }

    /**
     * Parses a docker compose byte size (`512m`, `1.5G`, `2gb`, `1024`).
     */
    static fromString(input: string | number | undefined): ByteValue | undefined {
        if (input === undefined || input === null) {
            return undefined;
        }
        if (typeof input === "number") {
            return new ByteValue(input, ByteUnits.BYTES);
        }
        const match = /^\s*(\d+(?:\.\d+)?)\s*([kmgb]?)b?\s*$/i.exec(input);
        if (!match) {
            return undefined;
        }
        const unit = { k: ByteUnits.KILOBYTES, m: ByteUnits.MEGABYTES, g: ByteUnits.GIGABYTES }[
            match[2].toLowerCase()
        ];
        return new ByteValue(Number(match[1]), unit ?? ByteUnits.BYTES);
    }
}
