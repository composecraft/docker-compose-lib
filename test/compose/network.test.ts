import { Network, KeyValue, NetworkDriver } from "../../src";

import { expect } from "@jest/globals";

describe("initialisation tests", () => {
    test("minimal init", () => {
        const network = new Network({
            name: "test network",
        });
        expect(network.driver).toBe(NetworkDriver.BRIDGE);
        expect(network.driver_opts).toBe(undefined);
        expect(network.attachable).toBe(false);
        expect(network.external).toBe(false);
        expect(network.labels).toBe(undefined);
    });

    test("full init", () => {
        const network = new Network({
            name: "test network",
            driver: NetworkDriver.HOST,
            driver_opts: [new KeyValue("lala", "lolo")],
            attachable: true,
            external: true,
            labels: [new KeyValue("key", "value")],
        });

        expect(network.driver).toBe(NetworkDriver.HOST);
        expect(network.driver_opts?.length).toBe(1);
        expect(network.attachable).toBe(true);
        expect(network.external).toBe(true);
        expect(network.labels?.length).toBe(1);
    });
});
