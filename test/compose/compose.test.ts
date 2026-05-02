import { describe, expect } from "@jest/globals";
import { Binding, Compose, Image, Network, NetworkDriver, Secret, Service, Volume } from "../../src";

describe("operations on networks", () => {
    test("add & remove network to compose without assigning", () => {
        const compose = new Compose();
        const network = new Network({ name: "test-network" });
        compose.addNetwork(network);
        compose.addNetwork(network);

        expect(compose.networks.size).toBe(1);

        compose.removeNetwork(network);
        expect(compose.networks.size).toBe(0);
    });

    test("add & remove network to compose with assigning", () => {
        const compose = new Compose();
        const service1 = new Service({ name: "test-service" });
        const service2 = new Service({ name: "test-service" });
        compose.addService(service1);
        compose.addService(service2);

        const network = new Network({ name: "test-network" });
        compose.addNetwork(network, [service1]);

        expect(service1.networks.has(network)).toBe(true);
        expect(service2.networks.has(network)).toBe(false);

        compose.removeNetwork(network);
        expect(service1.networks.has(network)).toBe(false);
    });

    test("ensure network ref is propagated in compose", () => {
        const compose = new Compose();
        const network = new Network({ name: "test-network" });
        compose.addNetwork(network);

        network.driver = NetworkDriver.MACVLAN;

        expect(compose.networks.get("name", "test-network")?.driver).toBe(NetworkDriver.MACVLAN);
    });
});

describe("operations on services assignations and dependencies", () => {
    test("add service and dependencies", () => {
        const compose = new Compose();

        const service1 = new Service({ name: "serv1" });
        const service2 = new Service({ name: "serv2" });

        compose.addService(service1);
        compose.addService(service2);

        service1.depends_on.add(service2);

        expect(compose.services.get("name", "serv1")?.depends_on.size).toBe(1);

        compose.removeService(service2);
        expect(compose.services.get("name", "serv1")?.depends_on.size).toBe(0);
    });
});

describe("operations on secrets", () => {
    test("add secrets and remove", () => {
        const compose = new Compose();
        const service = new Service({ name: "test-service" });
        compose.addService(service);

        const secret = new Secret({ name: "secret" });
        compose.addSecret(secret, [service]);

        expect(service.secrets.has(secret)).toBeTruthy();
        expect(compose.secrets.has(secret)).toBeTruthy();

        compose.removeSecret(secret);

        expect(service.secrets.has(secret)).toBeFalsy();
        expect(compose.secrets.has(secret)).toBeFalsy();
    });
});

describe("operations on volumes", () => {
    test("add volumes and remove", () => {
        const compose = new Compose();
        const service = new Service({ name: "test-service" });
        compose.addService(service);

        const volume = new Volume({ name: "volume" });
        const binding = new Binding({ source: volume, target: "/conf" });

        compose.addBinding(binding, [service]);

        expect(service.bindings.has(binding)).toBeTruthy();
        expect(compose.volumes.has(volume)).toBeTruthy();

        compose.removeVolume(volume);

        expect(service.bindings.has(binding)).toBeFalsy();
        expect(compose.volumes.has(volume)).toBeFalsy();
    });

    test("removeVolume keeps bind-mount bindings and other volumes", () => {
        const compose = new Compose();
        const service = new Service({ name: "test-service" });
        compose.addService(service);

        const volA = new Volume({ name: "vol-a" });
        const volB = new Volume({ name: "vol-b" });
        const bindingA = new Binding({ source: volA, target: "/data/a" });
        const bindingB = new Binding({ source: volB, target: "/data/b" });
        const localBinding = new Binding({ source: "./host-data", target: "/host" });

        compose.addBinding(bindingA, [service]);
        compose.addBinding(bindingB, [service]);
        service.bindings.add(localBinding);

        compose.removeVolume(volA);

        expect(service.bindings.has(bindingA)).toBeFalsy();
        expect(service.bindings.has(bindingB)).toBeTruthy();
        expect(service.bindings.has(localBinding)).toBeTruthy();
        expect(compose.volumes.has(volA)).toBeFalsy();
        expect(compose.volumes.has(volB)).toBeTruthy();
    });
});

describe("compose copy", () => {
    test("shallowCopy preserves name", () => {
        const compose = new Compose({ name: "my-compose", version: 3.8 });
        const copy = compose.shallowCopy();
        expect(copy.name).toBe("my-compose");
        expect(copy.version).toBe(3.8);
    });
});

describe("operations on services assignations and dependencies", () => {
    test("add service and dependencies", () => {
        const compose = new Compose();

        const service1 = new Service({ name: "serv1" });
        const service2 = new Service({ name: "serv2",image: new Image({name:"nginx"}) });

        compose.addService(service1);
        compose.addService(service2);
    });

    test("equality", () => {
        const compose1 = new Compose();

        const service1 = new Service({ name: "serv1" });
        const service2 = new Service({ name: "serv2",image: new Image({name:"nginx"}) });

        compose1.addService(service1);
        compose1.addService(service2);

        const compose2 = new Compose();

        const service3 = new Service({ name: "serv1" });
        const service4 = new Service({ name: "serv2",image: new Image({name:"nginx"}) });

        compose2.addService(service3);
        compose2.addService(service4);

        expect(compose1.equal(compose2)).toBeFalsy()
        expect(compose1.equal(compose1)).toBeTruthy()
    });

    test("networkMode", () => {
        const compose1 = new Compose();

        const service1 = new Service({ name: "serv1", network_mode: "host" });

        compose1.addService(service1);

        expect(service1.network_mode).toBe("host")
    });
});