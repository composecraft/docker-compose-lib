import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const changelog = readFileSync(new URL("CHANGELOG.md", root), "utf8");
const argument = process.argv[2];

function fail(message) {
    console.error(message);
    process.exit(1);
}

function latestVersion() {
    const match = /^## \[?(\d+\.\d+\.\d+[^\]\s]*)\]?/m.exec(changelog);
    return match ? match[1] : fail("CHANGELOG.md has no versioned section");
}

const version =
    argument === "--latest"
        ? latestVersion()
        : argument ?? JSON.parse(readFileSync(new URL("package.json", root), "utf8")).version;

const heading = new RegExp(`^## \\[?${version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]?(\\s|$)`, "m");
const start = changelog.search(heading);

if (start === -1) {
    fail(`CHANGELOG.md has no "## ${version}" section`);
}

const body = changelog.slice(start).replace(/^.*\n/, "");
const next = body.search(/^## /m);
const section = (next === -1 ? body : body.slice(0, next)).trim();

if (section.length === 0) {
    fail(`the "## ${version}" section of CHANGELOG.md is empty`);
}

console.error(`changelog section: ${version}`);
process.stdout.write(`${section}\n`);
