#!/usr/bin/env bash
set -uo pipefail

green() { printf '\033[32m%s\033[0m\n' "$1"; }
red()   { printf '\033[31m%s\033[0m\n' "$1"; }

if ! docker compose version >/dev/null 2>&1; then
    red "docker compose is required to run the real-world tests"
    exit 1
fi

if [ ! -d ./lib/cjs ]; then
    red "./lib is missing — run 'pnpm run build' first"
    exit 1
fi

# fixtures interpolate host-specific variables; defaults let `config` resolve them
export DOCKER_SOCKET_LOCATION="${DOCKER_SOCKET_LOCATION:-/var/run/docker.sock}"

failures=0

for ts_file in testReal/*.ts; do
    if ! npx tsc --module commonjs --target ES2020 --moduleResolution node --esModuleInterop "$ts_file"; then
        red "Failed to compile $ts_file"
        failures=$((failures + 1))
        continue
    fi

    js_file="${ts_file%.ts}.js"
    if ! yaml_files=$(node "$js_file"); then
        red "Failed to run $js_file"
        failures=$((failures + 1))
        continue
    fi

    # a script may emit several compose files, one path per line
    while IFS= read -r yaml_file; do
        [ -n "$yaml_file" ] || continue
        if docker compose -f "$yaml_file" config -q; then
            green "$yaml_file generated from $ts_file is a valid compose file ⭐️"
        else
            red "Invalid compose file $yaml_file generated from $ts_file"
            failures=$((failures + 1))
        fi
    done <<< "$yaml_files"
done

if [ "$failures" -gt 0 ]; then
    red "$failures real-world test(s) failed"
    exit 1
fi

green "All real-world tests passed"
