import { Service } from "@compose/service";
import { Network } from "@compose/network";
import { Binding, BindingType, Volume } from "@compose/volume";
import { Secret } from "@compose/secret";
import { SuperSet } from "@commons/superSet";
import { Serializable } from "@commons/serializable";
import { Env } from "@commons/keyValue";

/**
 * All allowed versions of a docker-compose.yaml file.
 */
export type ComposeVersion = 3.9 | 3.8 | 3.7 | 3.6 | 3.5 | 3.4 | 3.3 | 3.2 | 3.1 | 3.0 | 2.4 | 2.3 | 2.2 | 2.1 | 2.0;

const COMPOSE_VERSIONS: ComposeVersion[] = [3.9, 3.8, 3.7, 3.6, 3.5, 3.4, 3.3, 3.2, 3.1, 3.0, 2.4, 2.3, 2.2, 2.1, 2.0];

const VERSION_BY_SPELLING = new Map<string, ComposeVersion>(
    COMPOSE_VERSIONS.flatMap((version) => [
        [version.toFixed(1), version] as [string, ComposeVersion],
        [String(version), version] as [string, ComposeVersion],
    ]),
);

/**
 * Coerces a raw `version:` value, rejecting anything outside {@link ComposeVersion}.
 *
 * Matching is done on the spelling, not on `Number()`: `"3.10"` is not a valid
 * compose version and must not silently become `3.1`.
 */
export function toComposeVersion(input: unknown): ComposeVersion | undefined {
    if (input === undefined || input === null) {
        return undefined;
    }
    return VERSION_BY_SPELLING.get(String(input).trim());
}

/** Instance fields that carry no meaning for structural comparison. */
const VOLATILE_KEYS = new Set(["id"]);

function normalize(value: unknown, seen: Set<object> = new Set()): unknown {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value !== "object") {
        return value;
    }
    if (seen.has(value)) {
        return "[circular]";
    }
    const nested = new Set(seen).add(value);
    const serializable = value as { toJSON?: () => unknown };
    if (typeof serializable.toJSON === "function") {
        return normalize(serializable.toJSON(), nested);
    }
    if (Array.isArray(value)) {
        const items = value.map((item) => normalize(item, nested));
        const allObjects = items.every((item) => item !== null && typeof item === "object");
        // set-derived collections carry no meaningful order, unlike command/dns/ports
        return allObjects ? items.map((item) => JSON.stringify(item)).sort().map((item) => JSON.parse(item)) : items;
    }
    const result: Record<string, unknown> = {};
    Object.keys(value)
        .filter((key) => !VOLATILE_KEYS.has(key))
        .sort()
        .forEach((key) => {
            const entry = (value as Record<string, unknown>)[key];
            if (entry !== undefined) {
                result[key] = normalize(entry, nested);
            }
        });
    return result;
}

/**
 * The main class of this package.
 * Can be used as a state manager under a library like zustand.
 */
export class Compose extends Serializable {
    name?: string
    version?: ComposeVersion;
    services: SuperSet<Service>;
    networks: SuperSet<Network>;
    volumes: SuperSet<Volume>;
    secrets: SuperSet<Secret>;
    envs: SuperSet<Env>

    constructor(options?: Partial<Compose>) {
        super();
        this.name = options?.name
        this.version = options?.version;
        this.services = options?.services ?? new SuperSet();
        this.networks = options?.networks ?? new SuperSet();
        this.volumes = options?.volumes ?? new SuperSet();
        this.secrets = options?.secrets ?? new SuperSet();
        this.envs = options?.envs ?? new SuperSet();
    }

    shallowCopy(): Compose {
        const compose = new Compose({});
        compose.name = this.name;
        compose.version = this.version;
        compose.services = new SuperSet(Array.from(this.services));
        compose.networks = new SuperSet(Array.from(this.networks));
        compose.volumes = new SuperSet(Array.from(this.volumes));
        compose.secrets = new SuperSet(Array.from(this.secrets));
        compose.envs = new SuperSet(Array.from(this.envs));
        return compose;
    }

    addNetwork(network: Network, to?: Service[]): void {
        this.networks.add(network);
        to?.forEach((service) => service.networks?.add(network));
    }

    removeNetwork(network: Network): void {
        this.services.forEach((serv) => serv.networks.delete(network));
        this.networks.delete(network);
    }

    addService(service: Service): void {
        this.services.add(service);
    }

    removeService(service: Service): void {
        this.services.forEach((serv) => serv.depends_on.delete(service));
        this.services.delete(service);
    }

    addBinding(binding: Binding, to: Service[]) {
        if (binding.getBindingType() === BindingType.DOCKER_VOLUME) {
            if (binding.source instanceof Volume) {
                this.volumes.add(binding.source);
            }
        }
        to.forEach((service) => service.bindings.add(binding));
    }

    removeBinding(binding: Binding, from: Service | Service[]) {
        (Array.isArray(from) ? from : [from]).forEach((service) => service.bindings.delete(binding));
    }

    removeVolume(volume: Volume) {
        this.services.forEach((serv) => {
            serv.bindings.forEach((bin) => {
                if (bin.source instanceof Volume && bin.source.name === volume.name) {
                    serv.bindings.delete(bin);
                }
            });
        });
        this.volumes.delete(volume);
    }

    addSecret(secret: Secret, to?: Service[]): void {
        this.secrets.add(secret);
        to?.forEach((serv) => serv.secrets.add(secret));
    }

    removeSecret(secret: Secret): void {
        this.services.forEach((serv) => serv.secrets.delete(secret));
        this.secrets.delete(secret);
    }

    addEnv(env: Env, to?: Service[]): void {
        this.envs.add(env);
        to?.forEach((serv) => {
            const serv_env = serv.environment
            if(serv_env){
                serv.environment?.add(env)
            }else{
                serv.environment = new SuperSet()
                serv.environment.add(env)
            }
        });
    }

    removeEnv(env: Env): void {
        this.services.forEach((serv) => {
            const serv_env = serv.environment
            if(serv_env){
                serv.environment?.delete(env)
            }
        });
        this.envs.delete(env);
    }

    /**
     * Stable, structural string representation usable as an equality key.
     *
     * Object keys are sorted, generated `id`s are dropped and set-derived
     * collections are order-normalised, so two independently built but
     * structurally identical compositions hash the same. A plain
     * `JSON.stringify` does not: it leaks random UUIDs and insertion order.
     */
    public hash():string{
        return JSON.stringify(normalize(this));
    }

    public equal(other:Compose):boolean{
        return this.hash() === other.hash()
    }
}
