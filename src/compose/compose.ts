import { Service } from "@compose/service";
import { Network } from "@compose/network";
import { Binding, BindingType, Volume } from "@compose/volume";
import { Secret } from "@compose/secret";
import { SuperSet } from "@commons/superSet";
import { Serializable } from "@commons/serializable";
import { Env } from "@commons/keyValue";

import * as crypto from 'crypto';

/**
 * All allowed versions of a docker-compose.yaml file.
 */
export type ComposeVersion = 3.8 | 3.7 | 3.6 | 3.5 | 3.4 | 3.3 | 3.2 | 3.1 | 3.0 | 2.4 | 2.3 | 2.2 | 2.1 | 2.0;

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

    removeBinding(binding: Binding, from: Service) {
        from.bindings.delete(binding);
    }

    removeVolume(volume: Volume) {
        this.services.forEach((serv) => {
            serv.bindings.forEach((bin) => {
                if (!(bin.source instanceof Volume) || volume.name === bin.source?.name) {
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

    public hash():string{
        return crypto.createHash('sha256').update(JSON.stringify(this)).digest('hex');
    }

    public equal(other:Compose):boolean{
        return this.hash() === other.hash()
    }
}
