/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AccessType,
    Binding,
    BindingType,
    ByteUnits,
    Compose,
    Delay,
    Deploy,
    Env,
    HealthCheck,
    Image,
    PortMapping,
    Protocol,
    RestartPolicyCondition,
    Service,
    TimeUnits,
    Translator,
    Volume,
    VolumeDriver,
} from "../../src";
import { expect } from "@jest/globals";

const roundTrip = (input: object) => new Translator(Translator.fromDict(input)).toDict() as any;

describe("port parsing", () => {
    test("host ip is kept and the container port is not swallowed", () => {
        const port = PortMapping.fromString("127.0.0.1:8080:80");
        expect(port?.hostIp).toBe("127.0.0.1");
        expect(port?.hostPort).toBe(8080);
        expect(port?.containerPort).toBe(80);
        expect(port?.toString()).toBe("127.0.0.1:8080:80");
    });

    test("ranges survive", () => {
        const port = PortMapping.fromString("3000-3005:4000-4005");
        expect(port?.hostPort).toBe(3000);
        expect(port?.hostPortEnd).toBe(3005);
        expect(port?.containerPort).toBe(4000);
        expect(port?.containerPortEnd).toBe(4005);
        expect(port?.toString()).toBe("3000-3005:4000-4005");
    });

    test("container-only short form does not invent a host port", () => {
        const port = PortMapping.fromString("3000");
        expect(port?.hostPort).toBeUndefined();
        expect(port?.containerPort).toBe(3000);
        expect(port?.toString()).toBe("3000");
    });

    test("ipv6 host and protocol", () => {
        const port = PortMapping.fromString("[::1]:5001:5000/udp");
        expect(port?.hostIp).toBe("[::1]");
        expect(port?.protocol).toBe(Protocol.UDP);
        expect(port?.toString()).toBe("[::1]:5001:5000/udp");
    });

    test("round trips through the translator", () => {
        const result = roundTrip({ services: { a: { image: "alpine", ports: ["127.0.0.1:8080:80", "9000"] } } });
        expect(result.services.a.ports).toEqual(["127.0.0.1:8080:80", "9000"]);
    });
});

describe("key=value parsing", () => {
    test("env values containing '=' are not truncated", () => {
        const compose = Translator.fromDict({
            services: { a: { image: "alpine", environment: ["TOKEN=abc==", "URL=postgres://u:p@h/db?sslmode=require"] } },
        });
        const envs = Array.from<Env>(compose.envs);
        expect(envs.find((env) => env.key === "TOKEN")?.value).toBe("abc==");
        expect(envs.find((env) => env.key === "URL")?.value).toBe("postgres://u:p@h/db?sslmode=require");
    });

    test("label values containing '=' are not truncated", () => {
        const compose = Translator.fromDict({
            services: { a: { image: "alpine", labels: ["traefik.rule=Host(`a.tld`) && Path(`/x`)"] } },
        });
        const service = compose.services.get("name", "a") as Service;
        expect(service.labels?.[0].value).toBe("Host(`a.tld`) && Path(`/x`)");
    });

    test("an env with no '=' keeps an empty value", () => {
        const compose = Translator.fromDict({ services: { a: { image: "alpine", environment: ["PASSTHROUGH"] } } });
        expect(Array.from<Env>(compose.envs)[0].value).toBe("");
    });
});

describe("command and entrypoint", () => {
    test("shell form is preserved verbatim", () => {
        const command = `sh -c "echo 'a b' && exit 0"`;
        const result = roundTrip({ services: { a: { image: "alpine", command, entrypoint: command } } });
        expect(result.services.a.command).toBe(command);
        expect(result.services.a.entrypoint).toBe(command);
    });

    test("exec form is preserved as an array", () => {
        const result = roundTrip({ services: { a: { image: "alpine", command: ["sh", "-c", "echo a b"] } } });
        expect(result.services.a.command).toEqual(["sh", "-c", "echo a b"]);
    });
});

describe("volume bindings", () => {
    test("interpolated sources are not split on their inner colon", () => {
        const binding = Binding.fromString("${DOCKER_VOLUME_STORAGE:-/mnt/volumes}/conf:/etc/conf:ro");
        expect(binding?.source).toBe("${DOCKER_VOLUME_STORAGE:-/mnt/volumes}/conf");
        expect(binding?.target).toBe("/etc/conf");
        expect(binding?.mode).toBe(AccessType.READ_ONLY);
    });

    test("a home-relative source is a bind mount, not a dropped entry", () => {
        const compose = Translator.fromDict({ services: { a: { image: "alpine", volumes: ["~/data:/data"] } } });
        const service = compose.services.get("name", "a") as Service;
        const binding = Array.from<Binding>(service.bindings)[0];
        expect(binding.getBindingType()).toBe(BindingType.LOCAL);
        expect(binding.source).toBe("~/data");
        expect(compose.volumes.size).toBe(0);
    });

    test("a single-path entry is an anonymous volume", () => {
        const compose = Translator.fromDict({ services: { a: { image: "alpine", volumes: ["/code/node_modules"] } } });
        const binding = Array.from<Binding>((compose.services.get("name", "a") as Service).bindings)[0];
        expect(binding.getBindingType()).toBe(BindingType.ANONYMOUS);
        expect(binding.toString()).toBe("/code/node_modules");
    });

    test("a named volume referenced but not declared is registered", () => {
        const compose = Translator.fromDict({ services: { a: { image: "alpine", volumes: ["cache:/cache"] } } });
        expect(Array.from<Volume>(compose.volumes).map((vol) => vol.name)).toEqual(["cache"]);
        const binding = Array.from<Binding>((compose.services.get("name", "a") as Service).bindings)[0];
        expect(binding.getBindingType()).toBe(BindingType.DOCKER_VOLUME);
    });

    test("a default-only volume is still declared at top level", () => {
        const result = roundTrip({ services: { a: { image: "alpine", volumes: ["data:/data"] } }, volumes: { data: null } });
        expect(Object.keys(result.volumes)).toEqual(["data"]);
        expect(result.volumes.data).toBeNull();
    });

    test("isSimple is false as soon as an option is set", () => {
        expect(new Volume({ name: "a" }).isSimple()).toBe(true);
        expect(new Volume({ name: "a", external: true }).isSimple()).toBe(false);
        expect(new Volume({ name: "a", driver: VolumeDriver.VFS }).isSimple()).toBe(false);
    });
});

describe("round trip completeness", () => {
    const input = {
        name: "app",
        version: "3.8",
        services: {
            api: {
                image: "nginx:1.27",
                container_name: "api",
                restart: "unless-stopped",
                privileged: true,
                read_only: true,
                pull_policy: "always",
                hostname: "api-host",
                working_dir: "/srv",
                stop_signal: "SIGINT",
                dns: ["1.1.1.1"],
                expose: ["8080"],
                env_file: ["./.env"],
                extra_hosts: ["host.docker.internal:host-gateway"],
                configs: ["api-config"],
                secrets: ["db-password"],
                healthcheck: { test: ["CMD-SHELL", "curl -f localhost || exit 1"], interval: "10s", retries: 3 },
                deploy: { replicas: 3, mode: "replicated", resources: { limits: { memory: "1.5G" } } },
            },
        },
        secrets: { "db-password": { file: "./db-password.txt" } },
    };

    test("every declared field survives fromDict -> toDict", () => {
        const service = roundTrip(input).services.api;
        expect(service.container_name).toBe("api");
        expect(service.restart).toBe("unless-stopped");
        expect(service.privileged).toBe(true);
        expect(service.read_only).toBe(true);
        expect(service.pull_policy).toBe("always");
        expect(service.hostname).toBe("api-host");
        expect(service.working_dir).toBe("/srv");
        expect(service.stop_signal).toBe("SIGINT");
        expect(service.dns).toEqual(["1.1.1.1"]);
        expect(service.expose).toEqual(["8080"]);
        expect(service.env_file).toEqual(["./.env"]);
        expect(service.extra_hosts).toEqual(["host.docker.internal:host-gateway"]);
        expect(service.configs).toEqual(["api-config"]);
        expect(service.secrets).toEqual(["db-password"]);
        expect(service.healthcheck.retries).toBe(3);
        expect(service.deploy.replicas).toBe(3);
        expect(service.deploy.resources).toEqual({ limits: { memory: "1.5G" } });
    });

    test("top level secrets are parsed", () => {
        const result = roundTrip(input);
        expect(result.secrets["db-password"]).toEqual({ file: "./db-password.txt" });
    });

    test("emits read_only, never the invalid `readonly` key", () => {
        const service = roundTrip(input).services.api;
        expect(service.readonly).toBeUndefined();
    });
});

describe("healthcheck", () => {
    test("an explicit CMD-SHELL prefix is not doubled", () => {
        const result = roundTrip({
            services: { a: { image: "alpine", healthcheck: { test: ["CMD-SHELL", "true"], interval: "5s" } } },
        });
        expect(result.services.a.healthcheck.test).toEqual(["CMD-SHELL", "true"]);
    });

    test("a bare argv is prefixed with CMD", () => {
        const check = new HealthCheck({ test: ["curl", "-f", "localhost"], interval: new Delay(5, TimeUnits.SECONDS) });
        expect((check.toDict() as any).test).toEqual(["CMD", "curl", "-f", "localhost"]);
    });

    test("shell form is kept as a string", () => {
        const result = roundTrip({ services: { a: { image: "alpine", healthcheck: { test: "redis-cli ping" } } } });
        expect(result.services.a.healthcheck.test).toBe("redis-cli ping");
    });
});

describe("build", () => {
    test("args, labels and lists are no longer dropped", () => {
        const result = roundTrip({
            services: {
                a: {
                    build: {
                        context: ".",
                        dockerfile: "Dockerfile.dev",
                        target: "builder",
                        shm_size: "512m",
                        args: ["NODE_ENV=production"],
                        labels: { owner: "team" },
                        extra_hosts: ["a:1.2.3.4"],
                        tags: ["repo/img:1"],
                        platforms: ["linux/amd64"],
                        secrets: ["npm-token"],
                    },
                },
            },
        });
        const build = result.services.a.build;
        expect(build.args).toEqual(["NODE_ENV=production"]);
        expect(build.labels).toEqual(["owner=team"]);
        expect(build.extra_hosts).toEqual(["a:1.2.3.4"]);
        expect(build.tags).toEqual(["repo/img:1"]);
        expect(build.platforms).toEqual(["linux/amd64"]);
        expect(build.secrets).toEqual(["npm-token"]);
        expect(build.shm_size).toBe("512mb");
    });

    test("the string short form still works", () => {
        const result = roundTrip({ services: { a: { build: "./backend" } } });
        expect(result.services.a.build.context).toBe("./backend");
    });
});

describe("deploy", () => {
    test("an unset placement is not emitted as an empty object", () => {
        const compose = new Compose({});
        compose.addService(
            new Service({ name: "a", image: new Image({ name: "alpine" }), deploy: new Deploy({ replicas: 2 }) }),
        );
        const result = new Translator(compose).toDict() as any;
        expect(result.services.a.deploy).toEqual({ replicas: 2 });
    });
});

describe("units", () => {
    test("compound durations collapse into their smallest unit", () => {
        expect(Delay.fromString("1m30s")?.toString()).toBe("90s");
        expect(Delay.fromString("10s")?.toString()).toBe("10s");
        expect(Delay.fromString("nonsense")).toBeUndefined();
    });

    test("byte sizes parse the docker spellings", () => {
        expect(ByteUnits.MEGABYTES).toBe("mb");
        expect(Delay.fromString(30)?.toString()).toBe("30s");
    });
});

describe("compose version", () => {
    test("an unknown version is rejected instead of being mangled", () => {
        expect(Translator.fromDict({ version: "3.10", services: { a: { image: "alpine" } } }).version).toBeUndefined();
        expect(Translator.fromDict({ version: "3.9", services: { a: { image: "alpine" } } }).version).toBe(3.9);
    });
});

describe("serialization", () => {
    test("a network keeps its name through JSON", () => {
        const compose = Translator.fromDict({ services: { a: { image: "alpine", networks: ["front"] } } });
        const parsed = JSON.parse(JSON.stringify(compose));
        expect(parsed.networks[0].name).toBe("front");
    });

    test("a secret keeps its name through JSON", () => {
        const compose = Translator.fromDict({
            services: { a: { image: "alpine" } },
            secrets: { token: { file: "./token" } },
        });
        expect(JSON.parse(JSON.stringify(compose)).secrets[0].name).toBe("token");
    });
});

describe("restart policy", () => {
    test("UNLESS_STOPPED and the legacy misspelling agree", () => {
        expect(RestartPolicyCondition.UNLESS_STOPPED).toBe("unless-stopped");
        expect(RestartPolicyCondition.UNLESS_TOPPED).toBe(RestartPolicyCondition.UNLESS_STOPPED);
    });

    test("`restart: no` is understood", () => {
        const result = roundTrip({ services: { a: { image: "alpine", restart: "no" } } });
        expect(result.services.a.restart).toBe("no");
    });
});

describe("image references", () => {
    test("a registry port is not mistaken for a tag", () => {
        const image = Image.fromString("registry.local:5000/team/app:1.2.3");
        expect(image.name).toBe("registry.local:5000/team/app");
        expect(image.tag).toBe("1.2.3");
        expect(image.toString()).toBe("registry.local:5000/team/app:1.2.3");
    });

    test("an untagged registry-qualified image defaults to latest", () => {
        const image = Image.fromString("registry.local:5000/team/app");
        expect(image.name).toBe("registry.local:5000/team/app");
        expect(image.toString()).toBe("registry.local:5000/team/app:latest");
    });

    test("a digest pin survives", () => {
        const reference = "nginx@sha256:0123456789abcdef";
        const image = Image.fromString(reference);
        expect(image.digest).toBe("sha256:0123456789abcdef");
        expect(image.tag).toBeUndefined();
        expect(image.toString()).toBe(reference);
    });

    test("digests round trip through the translator", () => {
        const result = roundTrip({ services: { a: { image: "nginx@sha256:0123456789abcdef" } } });
        expect(result.services.a.image).toBe("nginx@sha256:0123456789abcdef");
    });
});

describe("deploy parsing", () => {
    const input = {
        services: {
            a: {
                image: "alpine",
                deploy: {
                    mode: "replicated",
                    replicas: 4,
                    labels: { tier: "back" },
                    placement: {
                        max_replicas_per_node: 2,
                        constraints: ["node.role==worker"],
                        preferences: ["spread=node.labels.zone"],
                    },
                    restart_policy: { condition: "on-failure", delay: "5s", max_attempts: 3, window: "2m" },
                    update_config: { parallelism: 2, delay: "10s", order: "start-first", failure_action: "rollback" },
                    rollback_config: { parallelism: 1, monitor: "1m30s", max_failure_ratio: 0.3, order: "stop-first" },
                },
            },
        },
    };

    test("the whole deploy block survives the round trip", () => {
        const deploy = roundTrip(input).services.a.deploy;
        expect(deploy.mode).toBe("replicated");
        expect(deploy.replicas).toBe(4);
        expect(deploy.labels).toEqual(["tier=back"]);
        expect(deploy.placement.max_replicas_per_node).toBe(2);
        expect(deploy.placement.constraints).toEqual(["node.role==worker"]);
        expect(deploy.placement.preferences).toEqual(["spread=node.labels.zone"]);
        expect(deploy.restart_policy).toEqual({
            condition: "on-failure",
            delay: "5s",
            max_attempts: 3,
            window: "2m",
        });
        expect(deploy.update_config).toEqual({
            parallelism: 2,
            delay: "10s",
            order: "start-first",
            failure_action: "rollback",
        });
        expect(deploy.rollback_config.monitor).toBe("90s");
        expect(deploy.rollback_config.max_failure_ratio).toBe(0.3);
    });

    test("unknown enum values are dropped rather than emitted", () => {
        const deploy = roundTrip({
            services: { a: { image: "alpine", deploy: { mode: "bogus", update_config: { order: "bogus" } } } },
        }).services.a.deploy;
        expect(deploy?.mode).toBeUndefined();
        expect(deploy?.update_config).toBeUndefined();
    });
});

describe("blkio_config", () => {
    test("round trips instead of being an unused type", () => {
        const result = roundTrip({
            services: {
                a: {
                    image: "alpine",
                    blkio_config: {
                        weight: 300,
                        weight_device: [{ path: "/dev/sda", weight: 400 }],
                        device_read_bps: [{ path: "/dev/sdb", rate: "12mb" }],
                        device_write_iops: [{ path: "/dev/sdb", rate: 30 }],
                    },
                },
            },
        });
        const blkio = result.services.a.blkio_config;
        expect(blkio.weight).toBe(300);
        expect(blkio.weight_device).toEqual([{ path: "/dev/sda", weight: 400 }]);
        expect(blkio.device_read_bps).toEqual([{ path: "/dev/sdb", rate: "12mb" }]);
        expect(blkio.device_write_iops).toEqual([{ path: "/dev/sdb", rate: 30 }]);
    });
});

describe("network parsing", () => {
    test("driver_opts and labels are no longer dropped", () => {
        const result = roundTrip({
            services: { a: { image: "alpine", networks: ["custom"] } },
            networks: {
                custom: {
                    driver: "overlay",
                    attachable: true,
                    internal: true,
                    driver_opts: { "com.docker.network.mtu": "9000" },
                    labels: ["owner=team"],
                },
            },
        });
        expect(result.networks.custom).toEqual({
            driver: "overlay",
            attachable: true,
            internal: true,
            driver_opts: ["com.docker.network.mtu=9000"],
            labels: ["owner=team"],
        });
    });

    test("volume driver_opts and labels are no longer dropped", () => {
        const result = roundTrip({
            services: { a: { image: "alpine", volumes: ["data:/data"] } },
            volumes: { data: { driver: "local", driver_opts: { type: "nfs" }, labels: ["owner=team"] } },
        });
        expect(result.volumes.data).toEqual({
            driver: "local",
            driver_opts: ["type=nfs"],
            labels: ["owner=team"],
        });
    });
});
