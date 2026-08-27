# Changelog

## 2.0.0

Correctness pass over the translator and the compose model. Several fixes change
public types, hence the major bump — see [Changed (breaking)](#changed-breaking)
for the full list and the migration path.

### Fixed

- **`Translator.fromDict` no longer discards most of the file.** `restart`,
  `healthcheck`, `deploy`, `privileged`, `read_only`, `dns`, `hostname`,
  `working_dir`, `stop_signal`, `configs`, `pull_policy`, `attach`,
  `container_name`, `env_file`, `expose`, `extra_hosts`, `blkio_config`,
  service-level `secrets` and the top-level `secrets:` section are now parsed.
- **Port parsing.** `127.0.0.1:8080:80` produced `NaN:8080`; ranges produced
  `NaN:NaN`; `hostIp` was never populated. Short syntax is now parsed in full,
  including IPv6 hosts, ranges and `3000` (container-only, no host port).
- **`KEY=VALUE` splitting.** Environment variables and labels were split on
  *every* `=`, truncating base64 values, JWTs and connection strings. They are
  now split on the first `=` only.
- **`command` / `entrypoint`.** Shell form was split on spaces, corrupting
  quoting (`sh -c "a && b"` became 6 broken tokens). Strings are now preserved
  verbatim; arrays stay arrays.
- **Volume bindings.** `${VAR:-/default/path}:/target:ro` was split on the
  interpolation's inner colon. Colons inside `${...}` are no longer separators.
- **Bind-mount detection.** `~/data:/data` was silently dropped, and a lone
  `/code/node_modules` produced a binding with an `undefined` target. Anonymous
  volumes are now modelled explicitly.
- **`read_only`.** The generated file used the invalid key `readonly`, which
  docker ignores.
- **`Volume.isSimple()`** always returned `false` because `driver` defaults to
  `local`. Default-only volumes are now emitted as a bare `name:` key instead of
  being omitted from the top-level `volumes:` section entirely.
- **`deploy.placement`** was emitted as an empty `{}` when unset. Empty nested
  blocks are pruned recursively.
- **`Compose.hash()` / `equal()`** compared random UUIDs and set insertion
  order, so two structurally identical compositions were never equal. Comparison
  is now structural.
- **`Network` and `Secret` JSON serialization** dropped `name`, losing it in any
  persisted state. They now serialize their full state.
- **`Build.fromDict`** kept only scalar fields, dropping `args`, `labels`,
  `ssh`, `extra_hosts`, `tags`, `platforms`. `Build.secrets` was declared but
  never stored.
- **Network and volume `driver_opts` / `labels`** were dropped when parsing.
- **Image references.** `registry.local:5000/app:1.2` mistook the registry port
  for a tag. Digest pins (`nginx@sha256:...`) are now supported.
- **`healthcheck.test`** was always prefixed with `CMD`, corrupting
  `CMD-SHELL` / `NONE` forms. Shell form is supported.
- **`VolumeDriver.BTRFS`** emitted the misspelt driver name `brtfs`.
- **`version: "3.10"`** was coerced to `3.1`; unknown versions are now rejected.
- **`blkio_config`** was a declared but unused type, with `PathRate[]` fields
  typed as a single `PathRate`. It is now wired into `Service`.
- **`deploy.resources`** had no home on `Deploy` and was dropped.
- Removed an undeclared `uuid` dependency from the real-world test scripts.

### Changed (breaking)

| Before | After |
| --- | --- |
| `Service.readonly` | `Service.read_only` |
| `Service.command?: string[]` | `string \| string[]` |
| `Service.entrypoint?: string` (assigned arrays) | `string \| string[]` |
| `PortMapping.hostPort: number` | optional, plus `hostPortEnd` / `containerPortEnd` |
| `Binding.source: string \| Volume` | optional, plus `BindingType.ANONYMOUS` |
| `Build.shm_size?: ByteUnits` | `ByteValue` (the unit alone was unusable) |
| `HealthCheck.test: string[]`, `interval` required | `string \| string[]`, `interval` optional |
| `RollbackConfig.parallelism` required | optional |
| `Image.tag` always set | `undefined` when a `digest` is used |
| `VolumeDriver.BTRFS = "brtfs"` | `"btrfs"` |
| `JSON.stringify(network \| secret)` returned `toDict()` | full state, `name` included |
| no `exports` map | `exports` map — deep imports into `lib/**` no longer resolve |

Deprecated but still present: `RestartPolicyCondition.UNLESS_TOPPED` (use
`UNLESS_STOPPED`) and the `Ressource` type alias (use `Resource`).

### Added

- `PortMapping.fromString`, `Binding.fromString`, `Image.fromString`,
  `Delay.fromString`, `ByteValue.fromString`, `Deploy.fromDict`,
  `HealthCheck.fromDict`, `RestartPolicy.fromDict`, `RollbackConfig.fromDict`.
- `Service.container_name`, `env_file`, `expose`, `extra_hosts`, `stop_signal`,
  `blkio_config`; `Deploy.resources`; `Secret.id`.
- Compose version `3.9`; `RestartPolicyCondition.NO`; `FailureAction.ROLLBACK`;
  `PullPolicy.DAILY` / `WEEKLY`.
- Referenced-but-undeclared volumes and secrets are auto-registered, as networks
  already were.

### Tooling

- `package.json`: added `types`, `type` and a dual `exports` map; the ESM build
  now emits extension-ful specifiers and a `lib/esm/package.json`, so it is
  loadable by native Node ESM (it previously was not).
- Fixed the broken `clear`, `all` and `format` scripts; added `lint`,
  `typecheck` and `verify`.
- Removed the stale legacy `.eslintrc` and six unused eslint dependencies.
- Added a `ci` workflow running lint, typecheck, tests, build and the real-world
  docker compose validation on every pull request; the publish workflow now gates
  on lint and typecheck too.
- `test.sh` now fails the build when a generated file is invalid (it previously
  always exited 0), uses `docker compose` v2 and portable colours.
- Added `testReal/test_roundtrip_fixtures.ts`, which runs the bundled
  `supabase.yaml` and `voting-app.yaml` through `fromDict`/`toDict` and validates
  the result with the real `docker compose config`.
- Added a `LICENSE` file; the readme claimed MIT while `package.json` declared
  Apache-2.0.
