/* eslint-disable @typescript-eslint/no-explicit-any */
import { Compose, toComposeVersion } from "@compose/compose";
import { Network, NetworkDriver } from "@compose/network";
import { Binding, isNamedVolumeReference, Volume, VolumeDriver } from "@compose/volume";
import {
    blkioConfigFromDict,
    blkioConfigToDict,
    Build,
    Deploy,
    HealthCheck,
    Image,
    PortMapping,
    PullPolicy,
    Service,
    toRestartPolicyCondition,
} from "@compose/service";
import { Secret } from "@compose/secret";
import { getSimpleValues, toKeyValuePairs, toStringArray, turnObjectInArrayWithName } from "@commons/utils";
import { AccessType } from "@commons/volumeAccesType";
import { Env, KeyValue } from "@commons/keyValue";
import { SuperSet } from "@commons/superSet";

type VolumeBindingRead = {
    type: "bind" | "volume";
    source: string;
    target: string;
    read_only?: boolean;
};

function toEnum<T extends Record<string, string>>(enumeration: T, value: unknown): T[keyof T] | undefined {
    if (typeof value !== "string") {
        return undefined;
    }
    return (Object.values(enumeration) as string[]).includes(value) ? (value as T[keyof T]) : undefined;
}

function toKeyValues(raw: unknown, prefix: string): KeyValue[] | undefined {
    const pairs = toKeyValuePairs(raw);
    return pairs.length > 0 ? pairs.map(([key, value]) => new KeyValue(key, value, prefix)) : undefined;
}

/** `["a", {source: "b"}]` → `["a", "b"]`, the two spellings compose accepts for secrets/configs refs. */
function toReferenceNames(raw: unknown): string[] {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw
        .map((entry) => (typeof entry === "string" ? entry : entry?.source))
        .filter((name): name is string => typeof name === "string");
}

function isBlank(value: unknown): boolean {
    if (value === undefined || value === null) {
        return true;
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    if (typeof value === "object") {
        return Object.keys(value).length === 0;
    }
    return false;
}

/** Recursively strips unset entries so nested blocks never surface as `placement: {}`. */
function dropBlanks(input: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    Object.keys(input).forEach((key) => {
        const value = input[key];
        const pruned = value !== null && typeof value === "object" && !Array.isArray(value) ? dropBlanks(value) : value;
        if (!isBlank(pruned)) {
            result[key] = pruned;
        }
    });
    return result;
}

/**
 * This is an implementation of the translator pattern, that allow us to have an instance over {@link Compose} that can smartly know about top level params and deep one without the need of any extra references.
 *
 * @example
 * ```typescript
 * //assume compose object has been defined before (as a ts Compose instance).
 *
 * const translator = new Translator(compose)
 * const compose_as_object = translator.toDict()
 * ```
 */
export class Translator {
    compose?: Compose;

    constructor(compose?: Compose) {
        this.compose = compose;
    }

    private serviceToDict(service: Service): object {
        const dict: Record<string, any> = {
            image: service.image?.toString(),
            build: service.build?.toDict(),
            container_name: service.container_name,
            ports: service.ports?.map((port) => port.toString()),
            expose: service.expose,
            attach: service.attach,
            blkio_config: service.blkio_config ? blkioConfigToDict(service.blkio_config) : undefined,
            command: service.command,
            configs: service.configs,
            deploy: service.deploy?.toDict(),
            dns: service.dns,
            entrypoint: service.entrypoint,
            env_file: service.env_file,
            environment: service.environment?.map((env) => env.toString()),
            extra_hosts: service.extra_hosts,
            healthcheck: service.healthcheck?.toDict(),
            hostname: service.hostname,
            labels: service.labels?.map((lab) => lab.toString()),
            privileged: service.privileged ? service.privileged : undefined,
            pull_policy: service.pull_policy?.toString(),
            read_only: service.read_only,
            restart: service.restart?.toString(),
            stop_signal: service.stop_signal,
            working_dir: service.working_dir,
            network_mode: service.network_mode,
            secrets: Array.from(service.secrets).map((sec) => sec.name),
            depends_on: Array.from(service.depends_on).map((dep) => dep.name),
            networks: Array.from(service.networks).map((net) => net.name),
            volumes: Array.from(service.bindings).map((binding) => binding.toString()),
        };
        return dropBlanks(dict);
    }

    toDict(): object {
        const result: any = {};
        result.name = this.compose?.name ?? undefined;
        result.version = this.compose?.version?.toString() ?? undefined;

        result.services = {};
        this.compose?.services.forEach((service) => {
            result.services[service.name] = this.serviceToDict(service);
        });

        result.networks = {};
        this.compose?.networks.forEach((network) => {
            result.networks[network.name] = dropBlanks(network.toDict() as Record<string, any>);
        });

        result.volumes = {};
        this.compose?.volumes.forEach((volume) => {
            // a named volume must still be declared even when it carries no options
            result.volumes[volume.name] = volume.isSimple() ? null : dropBlanks(volume.toDict() as Record<string, any>);
        });

        result.secrets = {};
        this.compose?.secrets.forEach((secret) => {
            result.secrets[secret.name] = dropBlanks(secret.toDict() as Record<string, any>);
        });

        if (Object.keys(result.networks).length === 0) {
            result.networks = undefined;
        }
        if (Object.keys(result.volumes).length === 0) {
            result.volumes = undefined;
        }
        if (Object.keys(result.secrets).length === 0) {
            result.secrets = undefined;
        }

        return result;
    }

    /**
     *
     * @param input should be an object representation of a {@link Compose} object
     *
     * @example
     * ```typescript
     * //assume compose object has been defined before (as a ts object).
     *
     * const compose_as_Compose: Compose = Translator.fromDict(compose)
     * ```
     */
    public static fromDict(input: any): Compose {
        const result = new Compose();
        result.name = input?.name;
        result.version = toComposeVersion(input?.version);
        if (!input?.services) {
            throw new Error("The docker compose file do not have any services");
        }

        if (input?.networks) {
            Object.keys(input.networks).forEach((key: string) => {
                const network = input.networks[key];
                const simple = getSimpleValues(network);
                result.networks.add(
                    new Network({
                        name: key,
                        driver: toEnum(NetworkDriver, network?.driver),
                        driver_opts: toKeyValues(network?.driver_opts, "dro_"),
                        labels: toKeyValues(network?.labels, "lab_"),
                        attachable: simple.attachable as boolean | undefined,
                        external: simple.external as boolean | undefined,
                        internal: simple.internal as boolean | undefined,
                    }),
                );
            });
        }

        if (input?.volumes) {
            Object.keys(input.volumes).forEach((key: string) => {
                const volume = input.volumes[key];
                result.volumes.add(
                    new Volume({
                        name: key,
                        driver: toEnum(VolumeDriver, volume?.driver),
                        driver_opts: toKeyValues(volume?.driver_opts, "dro_"),
                        labels: toKeyValues(volume?.labels, "lab_"),
                        external: getSimpleValues(volume).external as boolean | undefined,
                    }),
                );
            });
        }

        if (input?.secrets) {
            Object.keys(input.secrets).forEach((key: string) => {
                const secret = input.secrets[key];
                result.secrets.add(
                    new Secret({
                        name: key,
                        external: secret?.external === true ? true : undefined,
                        file: typeof secret?.file === "string" ? secret.file : undefined,
                        environment: typeof secret?.environment === "string" ? secret.environment : undefined,
                    }),
                );
            });
        }

        // referenced-but-undeclared networks/volumes/secrets are registered on demand
        // rather than dropped, mirroring how docker compose auto-creates them
        const ensure = <T extends { name: string }>(set: SuperSet<T>, name: string, create: () => T): T => {
            let found = Array.from(set).find((item) => item.name === name);
            if (!found) {
                found = create();
                set.add(found);
            }
            return found;
        };
        const ensureNetwork = (name: string) => ensure(result.networks, name, () => new Network({ name }));
        const ensureVolume = (name: string) => ensure(result.volumes, name, () => new Volume({ name }));
        const ensureSecret = (name: string) => ensure(result.secrets, name, () => new Secret({ name }));

        Object.keys(input.services).forEach((key: string) => {
            const raw = input.services[key];
            const service = new Service({ name: key });

            if (raw?.image) {
                service.image = Image.fromString(raw.image);
            }
            if (raw?.build) {
                service.build = Build.fromDict(raw.build);
            }
            // shell form must stay a string: splitting it on spaces corrupts quoting
            service.command = Array.isArray(raw?.command) ? raw.command.map(String) : raw?.command;
            service.entrypoint = Array.isArray(raw?.entrypoint) ? raw.entrypoint.map(String) : raw?.entrypoint;
            service.container_name = raw?.container_name;
            service.hostname = raw?.hostname;
            service.working_dir = raw?.working_dir;
            service.stop_signal = raw?.stop_signal;
            service.network_mode = raw?.network_mode;
            service.attach = typeof raw?.attach === "boolean" ? raw.attach : undefined;
            service.privileged = raw?.privileged === true;
            service.read_only = typeof raw?.read_only === "boolean" ? raw.read_only : undefined;
            service.restart = toRestartPolicyCondition(raw?.restart);
            service.pull_policy = toEnum(PullPolicy, raw?.pull_policy);
            service.dns = toStringArray(raw?.dns);
            service.env_file = toStringArray(raw?.env_file);
            service.expose = toStringArray(raw?.expose);
            service.extra_hosts = toStringArray(raw?.extra_hosts);
            service.deploy = Deploy.fromDict(raw?.deploy);
            service.healthcheck = HealthCheck.fromDict(raw?.healthcheck);
            service.blkio_config = blkioConfigFromDict(raw?.blkio_config);
            service.labels = toKeyValues(raw?.labels, "lab_");

            const configs = toReferenceNames(raw?.configs);
            if (configs.length > 0) {
                service.configs = configs;
            }
            toReferenceNames(raw?.secrets).forEach((name) => service.secrets.add(ensureSecret(name)));

            if (raw?.ports) {
                const ports = (Array.isArray(raw.ports) ? raw.ports : [raw.ports])
                    .map((port: string | number) => PortMapping.fromString(port))
                    .filter((port: PortMapping | undefined): port is PortMapping => port !== undefined);
                if (ports.length > 0) {
                    service.ports = ports;
                }
            }

            if (Array.isArray(raw?.volumes)) {
                raw.volumes.forEach((entry: string | VolumeBindingRead) => {
                    if (typeof entry === "string") {
                        const binding = Binding.fromString(entry);
                        if (!binding) {
                            return;
                        }
                        if (typeof binding.source === "string" && isNamedVolumeReference(binding.source)) {
                            binding.source = ensureVolume(binding.source);
                        }
                        service.bindings.add(binding);
                        return;
                    }
                    if (!entry?.target) {
                        return;
                    }
                    const mode = entry.read_only ? AccessType.READ_ONLY : AccessType.READ_WRITE;
                    service.bindings.add(
                        new Binding({
                            source: entry.type === "volume" ? ensureVolume(entry.source) : entry.source,
                            target: entry.target,
                            mode,
                        }),
                    );
                });
            }

            result.services.add(service);
        });

        // envs are global and deduplicated by key+value, then shared by reference
        Object.keys(input.services).forEach((key: string) => {
            toKeyValuePairs(input.services[key]?.environment).forEach(([envKey, envValue]) => {
                if (!Array.from(result.envs).find((env) => env.key === envKey && env.value === envValue)) {
                    result.envs.add(new Env(envKey, envValue));
                }
            });
        });

        Object.keys(input.services).forEach((key: string) => {
            const raw = input.services[key];
            const service = Array.from(result.services).find((item) => item.name === key);
            if (!service) {
                return;
            }

            if (raw?.networks) {
                turnObjectInArrayWithName(raw.networks).forEach((reference: string | { name: string }) => {
                    const name = typeof reference === "string" ? reference : reference.name;
                    service.networks.add(ensureNetwork(name));
                });
            } else if (!service.network_mode) {
                // docker compose default: no `networks:` and no `network_mode` means the implicit default network
                service.networks.add(ensureNetwork("default"));
            }

            if (raw?.depends_on) {
                const dependencies = Array.isArray(raw.depends_on) ? raw.depends_on : Object.keys(raw.depends_on);
                dependencies.forEach((name: string) => {
                    const dependency = Array.from(result.services).find((item) => item.name === name);
                    if (dependency) {
                        service.depends_on.add(dependency);
                    }
                });
            }

            toKeyValuePairs(raw?.environment).forEach(([envKey, envValue]) => {
                const env = Array.from(result.envs).find((item) => item.key === envKey && item.value === envValue);
                if (!env) {
                    return;
                }
                if (!service.environment) {
                    service.environment = new SuperSet<Readonly<Env>>();
                }
                service.environment.add(env);
            });
        });

        return result;
    }
}
