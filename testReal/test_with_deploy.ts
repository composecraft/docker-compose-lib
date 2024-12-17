import { Compose, Image, PortMapping, RestartPolicy, RestartPolicyCondition, Service , Translator, Delay, Deploy, TimeUnits} from "../lib/cjs";
import { stringify } from "yaml";
import { v4 } from "uuid";
import { promises as fs } from "fs";
import { join } from "path";

const compose = new Compose();

const service = new Service({
    name:"nginx",
    image: new Image({
        name: "nginx"
    }),
    ports : [
        new PortMapping({hostPort:80,containerPort:80})
    ],
    deploy: new Deploy({
        restart_policy: new RestartPolicy({
            condition : RestartPolicyCondition.ANY,
            delay: new Delay(5, TimeUnits.SECONDS),
            max_attempts: 3,
            window: new Delay(120,TimeUnits.SECONDS)
        }),
    })
})

compose.addService(service)

const translator = new Translator(compose);

const yaml = stringify(translator.toDict());

const cacheDir = "./cache";
const filename = `${v4()}.yaml`;

fs.mkdir(cacheDir, { recursive: true }) // Ensure the directory exists
    .then(() => fs.writeFile(join(cacheDir, filename), yaml))
    .then(() => console.log(`${join(cacheDir, filename)}`))
    .catch(console.error);
