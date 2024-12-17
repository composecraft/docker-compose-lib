import {
    Binding,
    Compose,
    Delay,
    Env,
    HealthCheck,
    Image,
    PortMapping,
    RestartPolicyCondition,
    Service,
    TimeUnits,
    Translator,
    Volume
} from "../../src";

import { expect } from "@jest/globals";

describe("transform compose file to json", () => {
    test("simple try", () => {
        const compose = new Compose({ version: 3.8,name:"test-real" });

        const translator = new Translator(compose);
        const result = translator.toDict();
        expect((result as {name:string})?.name === "test-real").toBeTruthy()
    });

    test("full-strapi", () => {
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

        translator.toDict();
    });

    test("no test specified", () => {
        const compose = new Compose({ version: 3.8,name:"test-real" });

        const strapi = new Service({
            name: "strapi",
            healthcheck: new HealthCheck({test: [],interval: new Delay(1,TimeUnits.SECONDS)})
        });

        compose.addService(strapi)

        const translator = new Translator(compose);
        const result = translator.toDict();
        expect((result as {name:string})?.name === "test-real").toBeTruthy()
        // eslint-disable-next-line
        expect((result as any)?.services?.strapi?.healthcheck?.test).toBeUndefined()
    });
});
