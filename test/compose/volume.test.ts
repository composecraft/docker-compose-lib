import { describe, expect } from "@jest/globals";
import { AccessType, Binding, BindingType, Volume, VolumeDriver } from "../../src";

describe("bindings constructors", () => {
    test("binding constructor local ./", () => {
        const binding = new Binding({
            source: "./data",
            target: "/conf",
        });
        expect(binding.getBindingType()).toBe(BindingType.LOCAL);
    });

    test("binding constructor local /", () => {
        const binding = new Binding({
            source: "/data",
            target: "/conf",
        });
        expect(binding.getBindingType()).toBe(BindingType.LOCAL);
    });

    test("binding constructor docker volume", () => {
        const binding = new Binding({
            source: new Volume({ name: "test" }),
            target: "/conf",
        });
        expect(binding.getBindingType()).toBe(BindingType.DOCKER_VOLUME);
    });

    test("binding constructor VolumeAccesType", () => {
        const binding = new Binding({
            source: "data",
            target: "/conf",
        });
        expect(binding.mode).toBe(AccessType.READ_WRITE);
    });

    test("binding constructor VolumeAccesType read-only", () => {
        const binding = new Binding({
            source: "data",
            target: "/conf",
            mode: AccessType.READ_ONLY,
        });
        expect(binding.mode).toBe(AccessType.READ_ONLY);
    });
});

describe("volume constructor", () => {
    test("tiniest volume", () => {
        const volume = new Volume({
            name: "test volume",
        });
        expect(volume.id).toBeDefined();
        expect(volume.name).toBe("test volume");
        expect(volume.external).toBe(false);
        expect(volume.driver).toBe(VolumeDriver.OVERLAY2);
        expect(volume.labels).toBeUndefined();
    });

    test("complete volume", () => {
        const volume = new Volume({
            name: "test volume",
            driver: VolumeDriver.VFS,
            external: true,
            labels: [],
            driver_opts: [],
        });
        expect(volume.id).toBeDefined();
        expect(volume.name).toBe("test volume");
        expect(volume.external).toBe(true);
        expect(volume.driver).toBe(VolumeDriver.VFS);
        expect(volume.labels).toEqual([]);
        expect(volume.driver_opts).toEqual([]);
    });
});
