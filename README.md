# Kitchen Display Queue

An internal tool for a restaurant expeditor. It shows every active order ranked by a priority
score computed on the server and lets the expeditor move each order through its stages.

- `api/`: Node.js 22, Express 5, Sequelize 6, PostgreSQL 16, Jest
- `web/`: Vite, React 19, TypeScript, MUI 7, Vitest + Testing Library
- `ai-logs/`: how AI was used on this project (see [AI usage](#ai-usage))
- [`DECISIONS.md`](DECISIONS.md): the design decisions and trade-offs

## Prerequisites

- **Docker** (runs PostgreSQL 16)
- **Node.js 22**. The repo ships an `.nvmrc`, so `nvm use` picks the right version.

## Getting started

```bash
docker compose up -d   # 1. start PostgreSQL 16 on localhost:5433
npm install            # 2. install the API and web workspaces
npm run db:setup       # 3. reset the database: undo all migrations, migrate, seed
npm run dev            # 4. start the API and the web app together
```

Open http://localhost:5173.

> **`npm run db:setup` resets the configured database.** It undoes every migration (dropping
> all tables and data), re-runs the migrations and loads the demo seed. Run it again whenever you
> want fresh demo data. By default it targets the development database `kitchen_queue` on
> `localhost:5433`; set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` or `DB_PASSWORD` to point it
> elsewhere. `npm run db` is an alias for the same command.

Seed timestamps are relative to the moment the seed runs, so the demo never goes stale. As time
passes, wait-time points grow, so re-run the seed if you want the exact starting picture.

### Ports

| Service | Port | Notes |
|---|---|---|
| Web (Vite dev server) | `5173` | Proxies `/api/*` to the API, stripping the `/api` prefix |
| API (Express) | `4000` | Set with `PORT` |
| PostgreSQL | `5433` on the host → `5432` in the container | 5433 avoids clashing with a local Postgres |

## Tests

| Command | What it runs | Needs the database? |
|---|---|---|
| `npm test` | API unit + HTTP tests (Jest) **and** web component tests (Vitest) | No |
| `npm test -w api` | API only: priority, tie-break, transitions, service (in-memory repository), HTTP layer (supertest) | No |
| `npm test -w web` | Web only: component tests against a mocked `fetch` | No |
| `npm run test:integration` | Repository tests against `kitchen_queue_test`: plain-object mapping, conditional status update, CHECK constraint | Yes |

Before the first integration run, create the test database once:

```bash
npm run db:test:create -w api   # creates kitchen_queue_test on localhost:5433
npm run test:integration        # resets the test schema, then runs the integration tests
```

Priority tests use a frozen `now` and never read the clock.

## API

All responses are JSON. Timestamps are ISO 8601 in UTC.

| Method | Path | Behaviour |
|---|---|---|
| `GET` | `/orders/queue` | Active queue (`received` + `preparing`), sorted by score and tie-break. Optional `?status=received` or `?status=preparing`. Response: `{ generated_at, orders: [...] }`. Each order includes `score`, `score_breakdown`, `minutes_waiting`, `total_prep_minutes`, `items`, `items_summary` and `available_actions`. |
| `POST` | `/orders/:id/start` | `received` → `preparing` |
| `POST` | `/orders/:id/ready` | `preparing` → `ready` |
| `POST` | `/orders/:id/pickup` | `ready` → `picked_up` |
| `POST` | `/orders/:id/cancel` | `received` → `cancelled` |

A successful action returns `{ order }`, the updated order with its new `available_actions`.
`generated_at` is the server time the scores were computed at. The web app uses it, not the
browser clock, to decide whether a promised time has passed.

### Error codes

Every error has the shape `{ "error": { "code", "message", "details"? } }`.

| Code | HTTP | When |
|---|---|---|
| `INVALID_TRANSITION` | 409 | The action is not allowed from the order's current status: skipping a step, repeating a transition, acting on a terminal order, or losing a race with a concurrent action. `details` holds `{ status, action }`. |
| `ORDER_NOT_FOUND` | 404 | No order with that id |
| `UNKNOWN_ACTION` | 404 | `:action` is not `start`, `ready`, `pickup` or `cancel` |
| `INVALID_ORDER_ID` | 400 | `:id` is not a positive integer |
| `INVALID_STATUS_FILTER` | 400 | `status` is anything other than `received` or `preparing` (including repeated `status` params) |
| `INVALID_JSON` | 400 | The request body is not valid JSON |
| `ROUTE_NOT_FOUND` | 404 | No such route |
| `INTERNAL_ERROR` | 500 | Unexpected failure (e.g. the database is unreachable). The details are logged on the server, never returned. |

The domain also defines `UNKNOWN_ORDER_TYPE`, raised when scoring an order whose `type` has no
points. It has no HTTP mapping, so it would surface as `INTERNAL_ERROR`. In practice the
`orders_type_check` constraint prevents such rows from existing.

`NETWORK_ERROR` is used only in the web app, when the API cannot be reached.

## Where the rules live

| Rule | File |
|---|---|
| Scoring values (type points, VIP, wait-time and complexity steps and caps, promise buckets) | [`api/src/modules/orders/priorityRules.js`](api/src/modules/orders/priorityRules.js) |
| Score calculation (pure: `computePriority(order, now)`, `scoreBreakdown`, `minutesWaiting`) | [`api/src/modules/orders/priority.js`](api/src/modules/orders/priority.js) |
| Queue order (comparators: score desc → `promised_at` asc, nulls last → `placed_at` asc → `id` asc) | [`api/src/modules/orders/compareQueue.js`](api/src/modules/orders/compareQueue.js) |
| Status machine (`ACTIONS` table, `ACTIVE_STATUSES`, `availableActions`, `nextStatus`) | [`api/src/modules/orders/transitions.js`](api/src/modules/orders/transitions.js) |
| Domain error codes | [`api/src/modules/orders/errors.js`](api/src/modules/orders/errors.js) |
| Use cases (`getQueue`, `applyAction`, including the concurrency guard) | [`api/src/modules/orders/ordersService.js`](api/src/modules/orders/ordersService.js) |
| Data access (plain domain objects, `updateStatusIf`) | [`api/src/repositories/orderRepository.js`](api/src/repositories/orderRepository.js) |
| Error code → HTTP status | [`api/src/http/errorHandler.js`](api/src/http/errorHandler.js) |
| Schema and database constraints | [`api/src/schema/migrations/`](api/src/schema/migrations/) |

**Typical changes:**
- **Ranking weights:** edit `priorityRules.js`.
- **Tie-break order:** edit the `COMPARATORS` list in `compareQueue.js`.
- **New or changed transition between existing statuses:** edit `ACTIONS` in `transitions.js`.
  The UI picks it up from `available_actions`; an unlabelled action shows its own name.
- **New status:** also add a migration that drops and re-adds `orders_status_check`, and
  optionally a label in `web/src/components/presentation.ts`.

The web app holds no copy of these rules. It renders orders in the order the API returns,
shows the API's score, and renders one button per `available_actions` entry.

## Project layout

```
api/
  src/
    app.js, server.js          createApp({ ordersService, clock }); server on :4000
    http/                      router (thin handlers), serializers, error handler
    modules/orders/            business rules and use cases (no Express, no Sequelize)
    repositories/              Sequelize queries → plain objects
    schema/                    config, models, migrations, seeders (.sequelizerc points here)
  test/                        unit, HTTP and integration tests
web/
  src/
    api/                       fetch client and response types
    hooks/useQueue.ts          loading, 20 s polling, actions
    components/                Kitchen Display UI and its tests
    test/                      Vitest setup, fetch mock and render helpers
    theme/                     MUI theme and styles
ai-logs/                       AI usage log, screenshots, transcript exports
docker-compose.yml
DECISIONS.md
```

## AI usage

AI tools were used to build this project. The [`ai-logs/`](ai-logs/) folder documents that use:

- [`ai-logs/README.md`](ai-logs/README.md): index, conventions and the transcript status
- `ai-logs/NN-*.md`: per-step summaries (the prompt, the changes, AI recommendations kept
  separate from explicit decisions, commands run and their actual results, corrections, open
  review items)
- [`ai-logs/transcripts/`](ai-logs/transcripts/): full conversation exports, kept separate from
  the summaries
