# LY Fullstack

[简体中文](README.md) | English

[![CI](https://github.com/liangy0323/ly-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/liangy0323/ly-fullstack/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Release](https://img.shields.io/badge/release-v0.1.0-087f5b.svg)](docs/releases/v0.1.0.md)

A general-purpose fullstack solution for open-source showcasing and real-world projects.

The admin console foundation is complete and wired end to end: login authentication, dynamic menus, user/role/menu/dictionary/public-config management, five-table RBAC, database migrations, and seed data all work against a real database. The project also ships a default consumer-facing API limited to health checks and public reads of dictionaries and shared config. Future stages will not count unimplemented consumer-side business features toward current capability.

## Core Philosophy

The concrete consumer-facing business of a product cannot be predefined by one repository: it might be a mini program, an SSR marketing site, a single-page app, a mobile client, or a functional product in some vertical domain. But whatever shape the consumer product takes, it needs a matching admin system — and admin capabilities such as login authentication, users, roles, menus, permissions, and engineering conventions are highly reusable across all of them.

So LY Fullstack starts by distilling the management core that almost every business can reuse, a standard monorepo engineering pattern, and a clearly bounded Vue 3 admin directory layout:

- `apps/admin`: a general Vue 3 admin console with explicit boundaries between page entries, business components, base components, the request layer, state, routing, navigation, and theming.
- `apps/admin-api`: a general NestJS admin service that organizes authentication, RBAC, and system management as modules.
- `apps/api`: the default consumer-facing NestJS API, providing only health checks and public reads of dictionaries and shared config, serving as the coding baseline for new business modules.
- `packages/*`: reusable capabilities — database, cross-app types, pure utilities, and charts — so apps never copy code or depend on each other in reverse.
- Root engineering: pnpm workspace, Turborepo, a unified app registry, and architecture checks organize apps and shared packages, providing a standard monorepo workflow for development, testing, and building.

The project does not invent consumer-side pages or concrete businesses before requirements are clear. The default `apps/api` keeps only the health-check, dictionary, and public-config read capabilities that nearly every consumer product could reuse; it contains no end-user authentication and represents no specific product shape. Once a real project starts, business modules can be added directly to this service; run `pnpm new:server` when a separate service is needed. Clients should still choose Nuxt, Next.js, Vue, React, a mini program, or any other stack based on real requirements.

For consumer scenarios that are already well defined, the project can further provide matching business APIs and client solutions. Those solutions sit on top of the common core, but no single business shape gets frozen into the default answer of this core repository.

## Scope & Architecture Boundaries

LY Fullstack currently uses an engineering architecture centered on a NestJS modular monolith, with the monorepo managing the front end, the admin service, shared packages, and independently created business apps. Multiple apps can run and deploy separately, but that is not microservices: the project provides no API gateway, service registry or discovery, config center, distributed tracing, distributed transactions, or a complete service-governance stack.

### Why Not Microservices by Default

Microservices are not the "advanced version" of a monolith, and architecture does not become more professional by becoming more complex. Microservices solve specific problems — services that need independent deployment and scaling, fault isolation, and multi-team autonomy — while introducing extra costs: network calls, data consistency, message idempotency, tracing, deployment orchestration, and operational governance. Splitting services before those needs actually appear usually just uses the complexity of a distributed system to solve problems that do not exist.

For developers with some Vue, TypeScript, or Node.js experience who are systematically moving into fullstack development — and for personal projects, small teams, and the large population of small-to-mid real businesses — it is far more valuable to first master the complete front-end/back-end boundary, database design, login authentication, permission models, testing, and deployment. LY Fullstack chose the modular monolith not because microservices are out of reach, but to deliver a real, disciplined, maintainable fullstack project that covers most common scenarios at a lower cognitive and operational cost.

This architecture prioritizes development efficiency, code boundaries, reusable admin capabilities, and long-term maintainability for small-to-mid real projects. It fits:

- Corporate websites, mini programs, content platforms, and functional web products built by individual developers or small teams.
- Startup products, MVPs, and projects still validating their business model.
- Operations consoles, internal management systems, and supporting business APIs for small-to-mid organizations.
- Projects whose concurrency, data volume, availability targets, and integration complexity can still be reasonably served by a monolith and a single database.

It should not be advertised as a foundation for large distributed systems, nor used without additional design for:

- Ultra-high concurrency, massive data volumes, or hard real-time computing.
- Multi-region disaster recovery, strict high availability, and complex elastic scaling.
- Complex systems with many independent teams delivering in parallel, services that must scale and fail independently.
- Systems requiring complex multi-tenant isolation, distributed transactions, message-driven architectures, or strict industry compliance.

Whether the project fits cannot be judged by company size alone. A small product can carry enormous traffic, and an internal system of a mid-size organization can remain a good modular-monolith fit for years. Evaluate against peak concurrency, data growth, SLAs, tenancy model, deployment environment, team boundaries, and release cadence.

As the business grows, first address clear bottlenecks with database indexes and connection pooling, caching, task queues, object storage, rate limiting, monitoring, and multi-instance deployment; only split services and add a gateway plus service governance after business boundaries, team boundaries, and independent scaling needs have actually appeared. LY Fullstack offers a sustainable engineering starting point — it does not promise that one default architecture covers every project scale.

### What's Next: a Microservices Edition

The next phase plans a standalone NestJS microservices solution for projects where service splitting, independent scaling, fault isolation, and multi-team collaboration needs have genuinely emerged. That solution will focus on an API gateway, inter-service communication, message reliability, authentication propagation, configuration management, observability, containerized deployment, and distributed testing.

The microservices edition will not be stacked onto this repository, and LY Fullstack will not be forcibly converted into microservices. The two solutions keep a clear boundary: LY Fullstack continues to solve efficient delivery for modular monoliths and small-to-mid projects; the microservices edition addresses problems whose business scale and organizational complexity already require a distributed architecture. Until the standalone solution ships, all of this remains future planning and is not part of current capability.

## UI Preview

The admin console ships complete dark and light themes. Both themes share one design language and functional structure, with separate adaptations for readability, component states, and data visualization.

### Dashboard

| Dark theme                                                                         | Light theme                                                                          |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| ![LY Fullstack dashboard, dark theme](docs/images/ly-fullstack-dashboard-dark.png) | ![LY Fullstack dashboard, light theme](docs/images/ly-fullstack-dashboard-light.png) |

### Login

| Dark theme                                                                      | Light theme                                                                       |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| ![LY Fullstack login page, dark theme](docs/images/ly-fullstack-login-dark.png) | ![LY Fullstack login page, light theme](docs/images/ly-fullstack-login-light.png) |

## Tech Stack

| Area           | Choice                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| Admin console  | Rsbuild 2 + Vue 3 + TypeScript + Element Plus + SCSS                              |
| Server         | NestJS 11 + Fastify; the admin API and the default consumer API run independently |
| Data layer     | `@repo/database` + PostgreSQL 17 + Prisma 7 (driver adapter mode)                 |
| Shared package | `@repo/shared` (cross-app types and framework-agnostic utilities)                 |
| Charts package | `@repo/charts` (ECharts on-demand registration, initialization, and shared types) |
| Engineering    | pnpm workspace + Turborepo + ESLint + Prettier + Husky + commitlint               |
| Testing        | Rstest                                                                            |

## Quick Start

### 1. Prepare the environment

| Dependency        | Version    | How to get it                                                                                                           |
| ----------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| Node.js           | >= 22.19   | [Official downloads](https://nodejs.org/en/download)                                                                    |
| pnpm              | >= 11 < 12 | Node 22 ships Corepack — run `corepack enable`; or see the [pnpm install guide](https://pnpm.io/installation)           |
| PostgreSQL        | 17.x       | [Official downloads](https://www.postgresql.org/download/) — note the `postgres` superuser password during installation |
| Docker (optional) | any stable | When PostgreSQL is not installed locally, the repo's `compose.yaml` starts a container automatically                    |

A few notes:

- The exact Node and pnpm versions are pinned by the root `packageManager` and `engines` fields; with Corepack enabled there is nothing to align manually.
- PostgreSQL and Docker are interchangeable here: with a local PostgreSQL, make sure the service can start; without one, `pnpm setup` starts the project container via Docker Compose.
- Database creation, schema, and seed data are all handled by `pnpm setup` — no manual database creation or SQL.
- [pgAdmin](https://www.pgadmin.org/) is a recommended visual client for browsing tables and seed data; refer to its official docs for installation and usage.
- The `postgres` password set during the graphical PostgreSQL install is the first input of the next step. Resetting it later is costly, so record it at install time.

### 2. Install dependencies

```bash
pnpm install
```

The install runs `prisma generate` automatically to produce the database client code, but it does not connect to PostgreSQL, create the database, build the schema, or load seed data.

### 3. Initialize the database and local config

From the repository root, run:

```bash
pnpm setup
```

The script asks for four inputs and only starts writing once all are provided:

1. **PostgreSQL password**: the password of the local `postgres` user, hidden input.
2. **Database name**: defaults to `ly_fullstack` — just press Enter; only letters, digits, and underscores are allowed.
3. **Initial admin password**: the password used to create the `admin` account, 8–64 characters, hidden input.
4. **Confirm admin password**: enter it again; a mismatch asks you to re-enter.

After the inputs, the script automatically:

- Probes `127.0.0.1:5432`: reuses an existing PostgreSQL service; if none is found and Docker Compose is available, it starts the project's PostgreSQL 17 container.
- Creates the target database idempotently — an existing database is skipped, no data is ever deleted.
- Generates `apps/admin-api/.env.development` and `apps/api/.env.development`; both services share the local database connection, and the admin API additionally gets a random JWT secret. Neither file is committed to Git.
- Runs the Prisma migration to create the full schema.
- Loads the RBAC seed data: the super-admin role, the complete menu permission tree, and the `admin` account; re-running Setup never overwrites an existing account's password.

CI and automation can skip the prompts: `pnpm setup --non-interactive` with the `SETUP_DATABASE_PASSWORD`, `SETUP_DATABASE_NAME`, and `SETUP_ADMIN_PASSWORD` environment variables. See [`docs/environment.md`](docs/environment.md) for the security boundaries of these env files.

### 4. Start the apps

```bash
# Interactive selection: first pick server apps, then front-end apps
pnpm dev

# Or non-interactive
pnpm dev all                    # start every app
pnpm dev api admin-api admin    # start a specific combination
```

Local URLs are maintained centrally in the root [`workspace.config.json`](workspace.config.json):

- Admin console: <http://localhost:8081>
- Admin API health check: <http://localhost:3000/api/health>
- Default consumer API health check: <http://localhost:3001/api/health>
- Public dictionary example: `GET http://localhost:3001/api/public/dictionaries/:code`
- Public config example: `GET http://localhost:3001/api/public/configs/:key`

Open the admin console and sign in with the account `admin` and the admin password set during Setup. When you are done, run `pnpm dev:stop` to stop every dev process started from this repository.

## Creating a new service

When you need a standalone business service beyond the default `apps/api`, run from the root:

```bash
pnpm new:server
```

The generator asks for a service name and a local port, then does four things:

1. Creates a NestJS + Fastify service with only a health check, from `scripts/templates/server`.
2. Uses `@repo/<service-name>` as the package name.
3. Registers the service under `apps.server` in `workspace.config.json`.
4. Installs dependencies and validates the new service's typecheck, tests, and build.

For example, entering `content-api` and `3002` creates `apps/content-api`, which then appears automatically in the `pnpm dev` service list. The template ships no database, JWT, or business modules; end-user authentication and admin authentication are separate application boundaries, to be implemented independently when real requirements appear.

There is no client stack restriction for business APIs: mini programs, SSR sites built with Nuxt or Next.js, Vue or React single-page apps, mobile clients, or any other functional website. Create the client once the real product shape is decided; to bring it into this monorepo, register it under `apps.web` in `workspace.config.json`.

## Common commands

| Command                   | Description                                                                 |
| ------------------------- | --------------------------------------------------------------------------- |
| `pnpm setup`              | Validate front-end ports; initialize DB, seed data, server config           |
| `pnpm new:server`         | Generate and register a new NestJS + Fastify service                        |
| `pnpm dev`                | Interactively pick server and front-end apps from the registry              |
| `pnpm dev all`            | Non-interactively start every app in the registry                           |
| `pnpm dev:admin`          | Start admin only                                                            |
| `pnpm dev:admin-api`      | Start admin-api only                                                        |
| `pnpm dev:api`            | Start the default consumer API only                                         |
| `pnpm dev:stop`           | Stop leftover dev processes from this repository                            |
| `pnpm typecheck`          | Typecheck the whole workspace                                               |
| `pnpm check:architecture` | Check cross-package dependencies, directory purity, service-layer direction |
| `pnpm lint`               | ESLint check (`lint:fix` auto-fixes)                                        |
| `pnpm format`             | Prettier formatting (`format:check` checks only)                            |
| `pnpm test`               | Service template smoke tests and workspace-wide Rstest unit tests           |
| `pnpm test:e2e`           | Start the admin system and run Playwright critical-path smoke tests         |
| `pnpm build`              | Build every artifact                                                        |
| `pnpm check`              | typecheck + lint + format:check + test + build                              |

## Directory structure

```text
ly-fullstack/
├── apps/
│   ├── admin/                 # Admin console (Rsbuild + Vue 3 + Element Plus)
│   ├── admin-api/             # Admin API (NestJS + Fastify)
│   └── api/                   # Default consumer API (health check, public dictionaries and configs)
├── packages/
│   ├── charts/                # Framework-free ECharts capability and shared types
│   ├── database/              # Prisma schema, migrations, generated client, and DB types
│   └── shared/                # Cross-app types and framework-agnostic utilities
├── scripts/
│   ├── templates/server/      # Generatable NestJS service skeleton
│   └── *.mjs                  # Dev launcher, setup, config reading, and template test scripts
├── docs/                      # Project documentation
├── .rules/                    # Development conventions
├── .github/workflows/ci.yml   # Quality gate for Pull Requests and the main branch
├── workspace.config.json      # Source of truth for app categories, paths, package names, local ports, and health checks
└── compose.yaml               # Local PostgreSQL dependency
```

## Current capability boundaries

Implemented:

- Admin shell: collapsible sidebar (with a narrow-screen drawer), header, dashboard, 404 page, and the design token system.
- Multi-theme: dark and light themes, Element Plus Sass variable overrides, component-level theme adaptation, and theme-switch animation.
- Login authentication: real username/password login, JWT session restore, token revocation on password change, login rate limiting, server-side one-time image slider captcha, 401 handling, and route guards.
- Five-table RBAC: users, roles, menus, user-role relations, and role-menu relations; the default Admin super-user holds the highest permissions.
- System management: real pagination, filtering, create, edit, status control, relation assignment, and protection rules for users, roles, menus, dictionaries, and public configs.
- Dynamic navigation: the sidebar consumes the menu tree returned by the login session from the database; menu icons are managed through a Lucide allowlist.
- Request layer: `AxiosFactory` + isolated service instances + interceptors; token handling, auth expiry, and UI feedback are injected from the app bootstrap layer.
- Admin API: CORS allowlist, ValidationPipe, JWT guard, permission guard, health check, and system-management CRUD.
- Default consumer API: a standalone NestJS app providing the health check plus login-free, key-exact reads of enabled dictionaries and non-sensitive public configs.
- Database: Prisma schema, migrations, seed data, and the default admin initialization flow.
- Service scaling: config-driven dev launcher and a NestJS service template verified by real generation.
- Engineering baseline: workspace catalog, Turborepo, architecture boundary checks, ESLint, Prettier, Husky, commitlint, Rstest, and GitHub Actions CI.

Not yet implemented: concrete consumer business, end-user authentication, and any consumer client. The default `apps/api` is only the coding starting point for business services and must not be advertised as a finished end-user product. The deployment environment-variable contract is defined; current CI is a quality gate only — CD that has not been connected to a real server does not count as existing capability.

## Documentation system & AI collaboration

### `.rules/`: development conventions — "how code should be written"

Mandatory coding conventions split by stack, 13 files in total: the admin CRUD template and page rules (`admin.md`), Vue component structure and ordering (`vue3.md`), TypeScript type principles (`typescript.md`), comment style (`comment-style.md`), error-handling layers (`error-handling.md`), request-layer encapsulation (`axios.md`), state management (`pinia.md`), styles (`style.md`), naming and directories (`naming.md`, `directory.md`), engineering config (`engineering.md`), and the pre-commit self-review checklist (`code-review.md`).

Read the matching file before starting a task; the full routing table lives in section 4 of [`AGENTS.md`](AGENTS.md). These rules are not suggestions: code that violates them fails lint, architecture checks, and the CI gate.

### `docs/`: topic docs — "how the system is designed and runs"

Implementation notes for specific topics, read on demand:

| Document                                                         | Contents                                              |
| ---------------------------------------------------------------- | ----------------------------------------------------- |
| [`docs/environment.md`](docs/environment.md)                     | Environment variable boundaries and Setup behavior    |
| [`docs/public-api.md`](docs/public-api.md)                       | Capabilities and security boundary of the default API |
| [`docs/admin-theme.md`](docs/admin-theme.md)                     | Multi-theme and Element Plus customization            |
| [`docs/admin-design-system.md`](docs/admin-design-system.md)     | Design system and page delivery checklist             |
| [`docs/admin-version-offline.md`](docs/admin-version-offline.md) | Version detection and offline caching                 |
| [`docs/deployment.md`](docs/deployment.md)                       | Production deployment                                 |
| [`docs/releases/`](docs/releases)                                | Release notes for each version                        |

The repository root also carries [`ROADMAP.md`](ROADMAP.md) (roadmap), [`CHANGELOG.md`](CHANGELOG.md) (changelog), and [`CONTRIBUTING.md`](CONTRIBUTING.md) (contribution process).

### Keep one set of conventions across AI coding tools

This documentation system is designed for AI collaboration from the ground up — the way this project keeps output consistent whether written by humans, AI, or a mix of both:

1. **`AGENTS.md` is the single entry point for AI**. It is the workspace instruction automatically loaded by AI coding agents (Codex, Claude Code, and other tools that follow the AGENTS.md convention) and contains the programming philosophy, tech stack, hard architecture boundaries, and the `.rules/` task routing table.
2. **Open the repository root as your workspace when using AI**. The tool loads `AGENTS.md` automatically, then routes to the matching `.rules/` file by task type (page CRUD, server modules, styles, tests, …) — no need to paste conventions into the prompt.
3. **Conventions are enforced by tooling, not discipline**. Code produced by humans or AI alike must pass `pnpm check` (architecture check + typecheck + lint + format + tests + build, plus remote CI); boundaries such as cross-package dependency direction and directory purity are machine-verified by `scripts/check-architecture.mjs`.
4. **Switch tools without switching conventions**. `AGENTS.md` and `.rules/` are plain Markdown bound to no AI product; any tool that reads workspace instructions consumes the same set of rules.

## License

The project is open source under the [MIT License](LICENSE).

LY Fullstack Team
