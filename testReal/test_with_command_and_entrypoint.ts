import {
    Compose,
    Image,
    PortMapping,
    Service,
    Translator,
} from "../lib/cjs";
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
    ports:[
        new PortMapping({hostPort:8080,containerPort:80})
    ],
    command: ["nginx","-g","daemon off;"],
    entrypoint : "/bin/sh"
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
