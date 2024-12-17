import {
    Compose,
    Image,
    PortMapping,
    Service,
    Env,
    RestartPolicyCondition,
    Translator,
    Binding,
    Volume,
} from "../lib/cjs";
import { stringify } from "yaml";
import { v4 } from "uuid";
import { promises as fs } from "fs";
import { join } from "path";

const compose = new Compose({ version: 3.8 });

const strapi = new Service({
    name: "strapi",
    image: new Image({
        name: "strapi/strapi",
        tag: "2.0",
    }),
    ports: [new PortMapping({ hostPort: 1337, containerPort: 1337 })]
});

compose.addEnv(new Env("DATABASE_CLIENT", "postgres"),[strapi])
compose.addEnv(new Env("DATABASE_HOST", "db"),[strapi])
compose.addEnv(new Env("DATABASE_PORT", "5432"),[strapi])
compose.addEnv(new Env("DATABASE_NAME", "strapi"),[strapi])
compose.addEnv(new Env("DATABASE_USERNAME", "strapi"),[strapi])
compose.addEnv(new Env("DATABASE_PASSWORD", "strapi"),[strapi])

const postgres = new Service({
    name: "db",
    image: new Image({
        name: "postgres",
    }),
    restart: RestartPolicyCondition.UNLESS_TOPPED,
});

compose.addEnv(new Env("POSTGRES_USER", "strapi"),[strapi])
compose.addEnv(new Env("POSTGRES_PASSWORD", "strapi"),[strapi])
compose.addEnv(new Env("POSTGRES_DB", "strapi"),[strapi])

strapi.depends_on.add(postgres);

compose.addService(strapi);
compose.addService(postgres);

const strapi_volume = new Volume({ name: "strapi_volume" });

compose.addBinding(new Binding({ source: strapi_volume, target: "/srv/app" }), [strapi]);
compose.addBinding(new Binding({ source: "./data", target: "/var/lib/postgresql/data" }), [postgres]);

const translator = new Translator(compose);

const yaml = stringify(translator.toDict())

const cacheDir = "./cache";
const filename = `${v4()}.yaml`;

fs.mkdir(cacheDir, { recursive: true }) // Ensure the directory exists
    .then(() => fs.writeFile(join(cacheDir, filename), yaml))
    .then(() => console.log(`${join(cacheDir, filename)}`))
    .catch(console.error);
