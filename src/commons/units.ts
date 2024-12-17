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
}
