import { Translator } from "../lib/cjs/";
import { stringify } from "yaml";
import { parse } from "yaml";
import { randomUUID } from "node:crypto";
import { promises as fs, readFileSync, readdirSync } from "fs";
import { join } from "path";

const fixtureDir = join(__dirname, "..", "test", "translator");
const cacheDir = "./cache";

async function main() {
    await fs.mkdir(cacheDir, { recursive: true });
    for (const file of readdirSync(fixtureDir).filter((name) => name.endsWith(".yaml"))) {
        const source = parse(readFileSync(join(fixtureDir, file), "utf8"));
        const roundTripped = stringify(new Translator(Translator.fromDict(source)).toDict());
        const path = join(cacheDir, `${randomUUID()}.yaml`);
        await fs.writeFile(path, roundTripped);
        console.log(path);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
