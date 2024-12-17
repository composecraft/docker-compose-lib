import { IllegalArgumentException, Secret } from "../../src";
import { expect } from "@jest/globals";

describe("constructor", () => {
    test("create simple secret", () => {
        const secret = new Secret({ name: "secret name", file: "secret.txt" });
        expect(secret).toBeDefined();
    });

    test("create secret illegal", () => {
        expect(() => {
            new Secret({ name: "secret name", file: "secret.txt", external: true });
        }).toThrow(IllegalArgumentException);
    });
});
