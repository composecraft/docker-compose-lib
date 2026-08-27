export enum Protocol {
    TCP = "tcp",
    UDP = "udp",
}

interface PortMappingConstructor {
    containerPort: number;
    containerPortEnd?: number;
    hostPort?: number;
    hostPortEnd?: number;
    hostIp?: string;
    protocol?: Protocol;
}

const SHORT_SYNTAX =
    /^(?:(?<ip>\[[0-9a-fA-F:]+\]|\d{1,3}(?:\.\d{1,3}){3}):)?(?:(?<host>\d+(?:-\d+)?):)?(?<container>\d+(?:-\d+)?)(?:\/(?<protocol>\w+))?$/;

function parseRange(value: string): [number, number | undefined] {
    const [start, end] = value.split("-");
    return [Number(start), end === undefined ? undefined : Number(end)];
}

/**
 * A published port, in docker compose short syntax:
 * `[HOST_IP:][HOST_PORT[-RANGE]:]CONTAINER_PORT[-RANGE][/PROTOCOL]`.
 *
 * `hostPort` is optional: `ports: ["3000"]` publishes container port 3000 on a
 * host port picked by docker, which is not the same as `3000:3000`.
 */
export class PortMapping {
    containerPort: number;
    containerPortEnd?: number;
    hostPort?: number;
    hostPortEnd?: number;
    hostIp?: string;
    protocol?: Protocol;

    constructor(options: PortMappingConstructor) {
        this.containerPort = options.containerPort;
        this.containerPortEnd = options.containerPortEnd;
        this.hostPort = options.hostPort;
        this.hostPortEnd = options.hostPortEnd;
        this.hostIp = options.hostIp;
        this.protocol = options.protocol;
    }

    static fromString(input: string | number): PortMapping | undefined {
        const match = SHORT_SYNTAX.exec(String(input).trim());
        if (!match?.groups) {
            return undefined;
        }
        const { ip, host, container, protocol } = match.groups;
        const [containerPort, containerPortEnd] = parseRange(container);
        const [hostPort, hostPortEnd] = host === undefined ? [undefined, undefined] : parseRange(host);
        return new PortMapping({
            containerPort,
            containerPortEnd,
            hostPort,
            hostPortEnd,
            hostIp: ip,
            protocol: protocol as Protocol | undefined,
        });
    }

    toString() {
        const host =
            this.hostPort === undefined
                ? ""
                : `${this.hostPort}${this.hostPortEnd === undefined ? "" : `-${this.hostPortEnd}`}:`;
        const container = `${this.containerPort}${this.containerPortEnd === undefined ? "" : `-${this.containerPortEnd}`}`;
        return `${this.hostIp ? `${this.hostIp}:` : ""}${host}${container}${this.protocol ? `/${this.protocol}` : ""}`;
    }

    toJSON() {
        return this.toString();
    }
}
