import { ByteUnits, ByteValue, Delay, TimeUnits } from "../../src";
import { expect } from "@jest/globals";

describe("to string manip", () => {
    test("time unit", () => {
        const time = new Delay(2, TimeUnits.HOURS);
        expect(time.toString()).toBe("2h");
    });

    test("byte unit", () => {
        const byte = new ByteValue(3, ByteUnits.GIGABYTES);
        expect(byte.toString()).toBe("3gb");
    });
});
