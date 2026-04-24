# CLI vs MCP parity

`qring` (CLI) and `qring-mcp` (MCP) share `src/core/*`, `src/services/*`, and
the same governance rules. Some workflows exist only on one surface by design.

The canonical source for tool registrations is `src/mcp/tools/*.ts`. CLI
commands live in `src/cli/commands/*.ts` and delegate to the same core modules
so both surfaces see identical policy enforcement, audit log entries, and
approval gates.

## Shared behavior

- **List key filter:** `qring list --filter` and MCP `list_secrets` use the
  same glob rules (`src/services/list-secrets-filter.ts`): `*` → `.*`,
  `?` → `.`, other regex metacharacters escaped.
- **Version:** Both read `PACKAGE_VERSION` from `src/version.ts` (resolved from
  `package.json` next to `dist/`).
- **Policy enforcement:** Every MCP tool runs `enforceToolPolicy` before
  executing; the CLI goes through the same `checkToolPolicy`, `checkExecPolicy`,
  and `checkKeyReadPolicy` helpers in `src/core/policy.ts`.
- **SSRF protection:** All outbound HTTP (hooks, JIT providers, provider
  validation) routes through `src/utils/http-request.ts` and, for
  user-configurable URLs, `src/core/ssrf.ts`.

## Command ↔ tool map

| Concern            | CLI                                              | MCP                                                             |
| ------------------ | ------------------------------------------------ | --------------------------------------------------------------- |
| Secret CRUD        | `set` `get` `delete` `list` `inspect` `export` `import` | `set_secret` `get_secret` `delete_secret` `list_secrets` `inspect_secret` `export_secrets` `import_dotenv` |
| Existence check    | `list` / `inspect`                               | `has_secret`                                                    |
| Generation         | `generate`                                       | `generate_secret`                                               |
| Entanglement       | `entangle` / `disentangle`                       | `entangle_secrets` / `disentangle_secrets`                      |
| Tunnel             | `tunnel create/read/destroy/list`                | `tunnel_create` / `tunnel_read` / `tunnel_destroy` / `tunnel_list` |
| Teleport           | `teleport pack/unpack`                           | `teleport_pack` / `teleport_unpack`                             |
| Project context    | `context`                                        | `get_project_context`                                           |
| Project check      | `check`                                          | `check_project`                                                 |
| Env generation     | `env:generate`                                   | `env_generate`                                                  |
| Env detection      | `env`                                            | `detect_environment`                                            |
| Validation         | `validate` / `validate --all` / `--list-providers` | `validate_secret` / `list_providers`                            |
| CI validation      | `ci:validate`                                    | `ci_validate_secrets`                                           |
| Rotation           | `rotate`                                         | `rotate_secret`                                                 |
| Audit              | `audit` / `audit --anomalies`                    | `audit_log` / `detect_anomalies`                                |
| Audit integrity    | `audit:verify` / `audit:export`                  | `verify_audit_chain` / `export_audit`                           |
| Health             | `health`                                         | `health_check`                                                  |
| Hooks (callbacks)  | `hook add/list/remove/enable/disable/test`       | `register_hook` / `list_hooks` / `remove_hook`                  |
| Scanning           | `scan` / `lint`                                  | `scan_codebase_for_secrets` / `lint_files`                      |
| Exec               | `exec`                                           | `exec_with_secrets`                                             |
| Dashboard          | `status`                                         | `status_dashboard`                                              |
| Agent scan         | `agent`                                          | `agent_scan`                                                    |
| Agent memory       | `remember` / `recall` / `forget`                 | `agent_remember` / `agent_recall` / `agent_forget`              |
| Analysis           | `analyze`                                        | `analyze_secrets`                                               |
| Policy summary     | `policy`                                         | `get_policy_summary`                                            |

## CLI-only (no MCP tool)

| CLI                                                       | Notes                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| `qring approve` / `approvals`                             | Interactive approval tokens for MCP secret reads                |
| `hook:install` / `hook:uninstall` / `hook:run`            | Git pre-commit wiring                                           |
| `qring wizard`                                            | Interactive service setup                                       |
| `hook enable` / `disable` / `test`                        | Runtime lifecycle for secret-change hooks                       |

## MCP-only (no CLI subcommand)

| MCP tool        | Notes                                                                            |
| --------------- | -------------------------------------------------------------------------------- |
| `has_secret`    | Existence check — CLI users can use `qring inspect` or `qring list --filter`.    |
| `check_policy`  | Programmatic policy probe — CLI surfaces the same information via `qring policy`. |

## JSON output

- **Global:** `qring --json …` applies to commands that support machine
  output (see `wantsJsonOutput` in `src/cli/helpers.ts`).
- **Per-flag:** `qring context --json`, `qring ci:validate --json`,
  `qring policy --json` remain valid aliases.

## Intentional differences

- **Raw secrets:** MCP tools such as `get_secret` return JSON payloads; CLI
  `qring get` defaults to JSON and uses `--raw` for the legacy single-value
  stream.

When adding a feature, update this file and the Cursor plugin skills/commands
if user-facing behavior changes.
