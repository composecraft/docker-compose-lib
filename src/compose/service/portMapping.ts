
export enum Protocol {
    TCP = "tcp",
    UDP = "udp",
}

interface PortMappingConstructor {
    containerPort: number;
    hostPort: number;
    hostIp?: string;
    protocol?: Protocol;
}

export class PortMapping {
    containerPort: number;
    hostPort: number;
    hostIp?: string;
    protocol?: Protocol;

    constructor(options: PortMappingConstructor) {
        this.containerPort = options.containerPort;
        this.hostPort = options.hostPort;
        this.hostIp = options.hostIp;
        this.protocol = options.protocol;
    }

    toString() {
        return `${this?.hostIp ? `${this.hostIp}:` : ""}${this.hostPort}:${this.containerPort}${this.protocol ? `/${this.protocol}` : ""}`;
    }

    toJSON(){
        return this.toString()
    }
}
