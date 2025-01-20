/* eslint-disable @typescript-eslint/no-explicit-any */
import { Compose, ComposeVersion } from "@compose/compose";
import { Network } from "@compose/network";
import { Binding, Volume } from "@compose/volume";
import { Service, Image, Build, PortMapping, Protocol } from "@compose/service";
import { getSimpleValues, turnObjectInArrayWithName } from "@commons/utils";
import { AccessType } from "@commons/volumeAccesType";
import { Env } from "@commons/keyValue";
import { SuperSet } from "@commons/superSet";
import { serviceworker } from "globals";

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

    toDict(): object {
        const result: any = {};
        result.name = this.compose?.name ?? undefined;
        //top domain compose
        result.version = this.compose?.version?.toString() ?? undefined;
        //services
        result.services = {};
        this.compose?.services.forEach((service) => {
            const serviceDict: any = {};
            serviceDict.image = service.image?.toString();
            serviceDict.ports = service.ports?.map((port) => port.toString());
            serviceDict.attach = service.attach;
            serviceDict.build = service.build?.toDict();
            serviceDict.command = service.command;
            serviceDict.configs = service.configs;
            serviceDict.deploy = service.deploy?.toDict();
            serviceDict.dns = service.dns;
            serviceDict.entrypoint = service.entrypoint;
            serviceDict.environment = service.environment?.map((env) => env.toString());
            serviceDict.healthcheck = service.healthcheck?.toDict();
            serviceDict.hostname = service.hostname;
            serviceDict.labels = service.labels?.map((lab) => lab.toString());
            serviceDict.privileged = service.privileged ? service.privileged : undefined;
            serviceDict.pull_policy = service.pull_policy?.toString();
            serviceDict.readonly = service.readonly;
            serviceDict.restart = service.restart?.toString();
            serviceDict.working_dir = service.working_dir;
            serviceDict.network_mode = service.network_mode

            //ones linked to other params
            serviceDict.secrets = Array.from(service.secrets).map((sec) => sec.name);
            serviceDict.depends_on = Array.from(service.depends_on).map((dep) => dep.name);
            serviceDict.networks = Array.from(service.networks).map((net) => net.name);
            if (service.bindings.size > 0) {
                serviceDict.volumes = [];
            }
            service.bindings.forEach((binding) => {
                serviceDict.volumes.push(binding?.toString());
            });

            //clean the result
            if (serviceDict.depends_on.length === 0) {
                serviceDict.depends_on = undefined;
            }
            if (serviceDict.secrets.length === 0) {
                serviceDict.secrets = undefined;
            }
            if (serviceDict.networks.length === 0) {
                serviceDict.networks = undefined;
            }
            //finally append to result
            result.services[service.name] = serviceDict;
        });
        //networks
        result.networks = {};
        this.compose?.networks.forEach((network) => {
            result.networks[network.name] = network.toDict();
        });
        result.volumes = {};
        //volumes
        this.compose?.volumes.forEach((volume) => {
            if (!volume.isSimple()) {
                result.volumes[volume.name] = volume.toDict();
            }
        });
        //secrets
        result.secrets = {};
        this.compose?.secrets.forEach((secret) => {
            result.secrets[secret.name] = secret.toDict();
        });

        //clean output
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
    public static fromDict(input:any):Compose{
        const result = new Compose()
        result.name = input?.name
        result.version = Number(input?.version) > 0 ? Number(input?.version) as ComposeVersion : undefined
        if(!input.services){
            throw new Error("The docker compose file do not have any services")
        }
        //networks
        if(input?.networks){
            Object.keys(input?.networks)?.forEach((key:string)=>{
                const network = input?.networks[key]
                const net = new Network({name:key,...getSimpleValues(network)})
                result.networks.add(net)
            })
        }
        //volumes
        if(input?.volumes){
            input?.volumes && Object.keys(input?.volumes)?.forEach((key:string)=>{
                const volume = input?.volumes[key]
                const vol = new Volume({name:key,...getSimpleValues(volume)})
                result.volumes.add(vol)
            })
        }
        //services
        Object.keys(input?.services)?.forEach((key:string)=>{
            const service = input?.services[key]
            const ser = new Service({name:key})
            if (service?.image){
                const strippedImage = (service?.image as string).split(':')
                ser.image = new Image({name: strippedImage[0], tag: strippedImage[1] ? strippedImage[1] : "latest"})
            }
            if(service?.build){
                ser.build = typeof service.build === "string"
                    ? service.build = new Build({context: service.build})
                    : Build.fromDict(service?.build)
            }
            if (service?.command) {
                ser.command = Array.isArray(service.command)
                    ? service.command
                    : (service.command as string).split(" ");
            }
            if (service?.entrypoint) {
                ser.entrypoint = Array.isArray(service.entrypoint)
                    ? service.entrypoint
                    : (service.entrypoint as string).split(" ");
            }
            if (service?.ports) {
                service?.ports.forEach((port_raw:string|number)=>{
                    port_raw = port_raw.toString()
                    let source: string
                    let target:string
                    let protocol:Protocol|undefined
                    if (port_raw.includes(":")) {
                        const [sourcePart, targetPart] = port_raw.split(":");
                        source = sourcePart;

                        if (targetPart.includes("/")) {
                            const [targetPort, proto] = targetPart.split("/");
                            target = targetPort;
                            protocol = proto as Protocol | undefined;
                        } else {
                            target = targetPart;
                        }
                    }else{
                        source = port_raw
                        target = port_raw
                        protocol= undefined
                    }
                    if(ser.ports){
                        ser.ports.push(new PortMapping({
                            hostPort: Number(source),
                            containerPort: Number(target),
                            protocol: protocol
                        }))
                    }else{
                        ser.ports = [new PortMapping({
                            hostPort: Number(source),
                            containerPort: Number(target),
                            protocol: protocol as Protocol
                        })]
                    }
                })
            }
            if (service?.volumes){
                service?.volumes?.forEach((vol:string)=>{
                    if(vol.startsWith("/") || vol.startsWith(".")){
                        const strippedVol = vol.split(":")
                        ser.bindings.add(new Binding({
                            source: strippedVol[0],
                            target: strippedVol[1],
                            mode: strippedVol[2] as AccessType
                        }))
                    }
                })
            }
            ser.network_mode = service?.network_mode
            result.services.add(ser)
        })
        //envs
        Object.keys(input?.services)?.forEach((key:string)=>{
            const service = input?.services[key]
            if(service.environment){
                if(!Array.isArray(service.environment)){
                    service.environment = Object.keys(service.environment).map((key)=>`${key}=${service.environment[key]}`)
                }
                (service.environment as string[]).forEach((env)=>{
                    const strippedEnv = env.split("=")
                    if(!Array.from(result.envs).find((env)=>env.key === strippedEnv[0])){
                        result.envs.add(new Env(strippedEnv[0],strippedEnv[1] ? strippedEnv[1]: ""))
                    }
                })
            }
        })

        //links
        Object.keys(input?.services)?.forEach((key:string)=>{
            const rawSer = input?.services[key]
            const service = Array.from(result.services).find(ser=>ser.name===key)
            if(rawSer.networks){
                rawSer.networks = turnObjectInArrayWithName(rawSer.networks)
                rawSer.networks.forEach((net_name:string)=>{
                    const network = Array.from(result.networks).find(net=>net.name===net_name)
                    if(network && service){
                        service.networks.add(network)
                    }
                })
            }
            if(rawSer.volumes){
                rawSer.volumes.forEach((vol_String:string)=>{
                    if(!(vol_String.startsWith(".") || vol_String.startsWith("/"))){
                        const strippedVol = vol_String.split(":")
                        const volume = Array.from(result.volumes).find(vol=>vol.name===strippedVol[0])
                        if(service && volume){
                            service.bindings.add(new Binding({
                                source: volume,
                                target: strippedVol[1],
                                mode: strippedVol[2] as AccessType
                            }))
                        }
                    }
                })
            }
            if(rawSer.depends_on){
                if(!Array.isArray(rawSer.depends_on)){
                    rawSer.depends_on = Object.keys(rawSer.depends_on).map((key)=>key)
                }
                rawSer.depends_on.forEach((ser_name:string)=>{
                    const serviceToAdd = Array.from(result.services).find(ser=>ser.name===ser_name)
                    if(serviceToAdd && service){
                        service.depends_on.add(serviceToAdd)
                    }
                })
            }
            if(rawSer.environment){
                if(!Array.isArray(rawSer.environment)){
                    rawSer.environment = Object.keys(rawSer.environment).map((key)=>`${key}=${rawSer.environment[key]}`)
                }
                rawSer.environment.forEach((rawEnv:string)=>{
                    const strippedEnv = rawEnv.split("=")
                    const env = Array.from(result.envs).find(e=>e.key===strippedEnv[0])
                    if(env && service){
                        if(service.environment){
                            service.environment.add(env)
                        }else{
                            service.environment = new SuperSet<Readonly<Env>>()
                            service.environment.add(env)
                        }
                    }
                })
            }
        })
        return result
    }
}
