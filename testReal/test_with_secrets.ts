import { Compose, Service, Image, PortMapping, Translator, Secret} from "../lib/cjs/";
import { stringify } from "yaml";
import { promises as fs } from "fs";
import { join } from "path";
import { v4 } from "uuid";

const compose = new Compose();
const service = new Service({
    name: "web",
    image: new Image({ name: "nginx" }),
    ports: [new PortMapping({ hostPort: 80, containerPort: 80 })],
});

const secret = new Secret({
    name: "JWT_KEY",
    file: "jwt.txt"
})

compose.addService(service);
compose.addSecret(secret,[service])

const translator = new Translator(compose);

const yaml = stringify(translator.toDict());

const cacheDir = "./cache";
const filename = `${v4()}.yaml`;

fs.mkdir(cacheDir, { recursive: true }) // Ensure the directory exists
    .then(() => fs.writeFile(join(cacheDir, filename), yaml))
    .then(() => console.log(`${join(cacheDir, filename)}`))
    .catch(console.error);
