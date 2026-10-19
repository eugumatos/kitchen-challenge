# Step 02 — Persistence and HTTP API

**Date:** 2026-10-18
**Tool:** Claude Code (`claude-opus-5-5`)

## Prompt (verbatim, as received)

> Now let's add persistence and expose the queue through an HTTP API.
>
> Configure Sequelize with .sequelizerc pointing to src/schema. Use kitchen_queue for development and kitchen_queue_test for tests, both on localhost:5433.
>
> Create one migration for menu_items, orders, and order_items, following the assignment's schema. Use snake_case columns, INTEGER IDs, and timestamptz timestamps. Configure the models with underscored: true.
>
> For category, type, and status, use VARCHAR columns with CHECK constraints rather than PostgreSQL ENUMs. This lets us change the allowed values later by replacing a constraint within a transaction. Add indexes on orders.status and order_items.order_id. Use migrations for schema changes; never call sync().
>
> Create a seed that demonstrates the queue's behavior. Calculate all timestamps relative to the moment the seed runs. Include every order type, VIP and non-VIP customers, orders reaching each scoring cap, and orders in received, preparing, ready, picked_up, and cancelled.
>
> Include two orders whose score tie is resolved by promised_at. Give them exactly the same placed_at so the tie remains stable as time passes.
>
> Put database access in repositories/orderRepository.js and return plain domain objects rather than Sequelize instances. Add updateStatusIf(id, from, to), which updates a row only if its current status still matches from. We'll use that to prevent concurrent actions from overwriting each other.
>
> In modules/orders/ordersService.js, implement:
>
> getQueue({ statusFilter, now }): retrieves orders, adds score, breakdown, and available_actions, then sorts the queue.
>
> applyAction({ orderId, action }): validates the transition and persists it safely.
>
> Keep the HTTP handlers thin. Expose GET /orders/queue and POST /orders//. Add serializers for snake_case fields, ISO UTC timestamps, and items_summary. Include generated_at in the queue response so the frontend has a consistent time reference.
>
> Centralize error handling with these mappings:
>
> INVALID_TRANSITION: 409
>
> ORDER_NOT_FOUND: 404
>
> UNKNOWN_ACTION: 404
>
> INVALID_ORDER_ID: 400
>
> INVALID_STATUS_FILTER: 400
>
> INVALID_JSON: 400
>
> ROUTE_NOT_FOUND: 404
>
> INTERNAL_ERROR: 500
>
> Expose createApp({ ordersService, clock }) from app.js so tests can inject a fixed clock. Start the server on port 4000 from server.js.
>
> Add root scripts for db, which undoes all migrations and then runs migrations and seeds, and dev.
>
> Start PostgreSQL, run db, and exercise the live queue and error responses with curl. For the 500 case, use a controlled test setup rather than adding a failure endpoint to the application.

## Assignment brief located

The step-01 blocker is resolved. Spotlight (`mdfind "kitchen_queue"`) found the brief at `~/Downloads/Take-Home Test for Staff Engineer.pdf`, and Claude read all 9 pages. It is **outside the repo** and was **not** copied in.

What the brief required that changed step-01 code:

| Step-01 AI guess | Brief says | Fix applied |
|---|---|---|
| Statuses `queued / in_progress / ready / picked_up / cancelled` | `received / preparing / ready / picked_up / cancelled` | Renamed in `transitions.js` and its tests |
| `ACTIVE_STATUSES` = queued, in_progress, **ready** | Active queue = **received, preparing** only; `ready` stays off the queue | Corrected |
| Complexity from a `complexity_minutes` field | `total_prep_minutes = Σ(prep_time_minutes × quantity)` over items | New `totalPrepMinutes(order)`; complexity reads `order.items` |
| `TYPE_POINTS` empty | dine_in 30, takeout 20, delivery 10 | Filled in |
| 3 `test.todo` | Examples A/B, delivery VIP beats dine_in | Real tests now; they pass |

**Interpretation of the prompt (please confirm):**
- "POST /orders//" was read as **`POST /orders/:id/:action`**, which matches the brief. The `:id/:action` part looks like it was lost when the prompt was pasted.
- "root scripts for db" was implemented as **`db:setup`**, the name the brief requires (§9.4).

**AI-log requirement in the brief (§2):** "export the full conversation history from the tool you used". Under your instruction, that overrides a summaries-only log. See "Needs human review".

## Summary of changes

| Area | Files |
|---|---|
| Sequelize config | `api/.sequelizerc` → `src/schema/{config,models,migrations,seeders}`; `src/schema/config/config.js` (dev `kitchen_queue`, test `kitchen_queue_test`, localhost:5433, overridable through `DB_*` env vars, `define.underscored`) |
| Migration | `src/schema/migrations/20261018000000-create-orders-schema.js`: one migration, in a transaction. INTEGER ids, timestamptz, VARCHAR + named CHECKs (`menu_items_category_check`, `orders_type_check`, `orders_status_check`), plus CHECKs for non-blank names, `prep_time_minutes > 0` and `quantity > 0`. Unique `menu_items.name`. FKs (`order_items.order_id` CASCADE, `menu_item_id` RESTRICT). Indexes `orders_status_idx` and `order_items_order_id_idx`. |
| Models | `src/schema/models/{index,menuItem,order,orderItem}.js`, `underscored: true`, associations. `sync()` is never called. |
| Seed | `src/schema/seeders/20261018000100-demo-queue.js`: 8 menu items, 10 orders, all times relative to `Date.now()` at seed time |
| Repository | `src/repositories/orderRepository.js`: `findByStatuses`, `findById`, `updateStatusIf`; returns plain objects |
| Service | `src/modules/orders/ordersService.js`: `createOrdersService({ orderRepository })` → `getQueue`, `applyAction` |
| HTTP | `src/http/ordersRouter.js` (thin), `serializers.js`, `errorHandler.js`; `src/app.js` (`createApp({ ordersService, clock })`); `src/server.js` (port 4000) |
| Domain updates | `errors.js` adds `ORDER_NOT_FOUND`, `INVALID_ORDER_ID`, `INVALID_STATUS_FILTER`; `priority.js` adds `totalPrepMinutes` |
| Tests | Updated `priority.test.js` and `transitions.test.js`; new `ordersService.test.js`, `test/http/app.test.js`, `test/integration/orderRepository.test.js`, `test/support/{inMemoryOrderRepository,fixtures}.js` |
| Scripts | Root: `dev`, `db:setup`, `test`, `db:up`, `db:down`. API: `start`, `dev` (`node --watch`), `test`, `test:integration`, `db:setup`, `db:test:create`, `db:test:migrate` |
| Dependencies | express@5.3.0, sequelize@6.37.8, pg@8.23.1, pg-hstore@2.3.4; dev: sequelize-cli@6.6.5, supertest@7.3.1 |

## Suggestions & decisions

**User decisions (explicit):** `.sequelizerc` → `src/schema`, the two DB names, a single migration, snake_case / INTEGER / timestamptz, `underscored: true`, VARCHAR + CHECK instead of ENUM, the two indexes, no `sync()`, the seed's content, a tie with identical `placed_at`, a repository returning plain objects, `updateStatusIf` compare-and-set, the `getQueue` / `applyAction` signatures, thin handlers, serializers with `items_summary` and `generated_at`, the error-code → HTTP-status table, `createApp({ ordersService, clock })`, port 4000, a 500 tested without a failure endpoint.

**AI choices the user hasn't reviewed (please check):**
1. **The tied pair is overdue** (Diego promised −5 min, Elisa −2 min, same `placed_at`). An overdue promise always scores 25, so their scores stay equal forever and the tie always goes to `promised_at`. A future promise would move between buckets and break the tie within minutes.
2. **The migration hard-codes the allowed values** instead of importing them from `transitions.js`. A migration is a point-in-time snapshot, and importing would silently change history whenever the constants changed.
3. Extra CHECKs beyond the request (non-blank names, positive prep time, positive quantity) enforce the brief's §4 field rules in the database.
4. **`applyAction` order of checks:** id format → action exists (before any DB read) → order exists → `nextStatus` → `updateStatusIf`. If the conditional update loses a race, it re-reads and returns `INVALID_TRANSITION` with the **current** status (or `ORDER_NOT_FOUND` if the order is gone).
5. **`statusFilter`** accepts only `ACTIVE_STATUSES` values (`received`, `preparing`), as in brief §7. `ready`, an empty value, or a repeated `?status=` get `INVALID_STATUS_FILTER`.
6. **The queue response adds** `score_breakdown`, `minutes_waiting` and `total_prep_minutes`, so the UI can show wait time without recomputing anything. The **action response** is `{ order }` with `available_actions` and no score (`applyAction` has no `now` in its signature).
7. **Error body shape:** `{ error: { code, message, details? } }`. A 500 returns a generic message, and the full error goes only to the server log.
8. **Express 5** (async handler errors reach the error middleware without wrappers).
9. **Tests use an in-memory repository** (`test/support/inMemoryOrderRepository.js`) that follows the same contract, not a mocked Sequelize. The brief says priority tests must not mock Sequelize.
10. **Repository integration tests** run against `kitchen_queue_test` and are excluded from the default `npm test`, which stays DB-free. Run them with `npm run test:integration -w api`.
11. **Root `dev` starts only the API for now.** The brief wants one command for API + web; that waits until `web/` exists.
12. **Test order:** this step's new tests were written **after** the implementation. Step 01 was test-first; this step was not.

## Commands run (actual results)

| Command | Result |
|---|---|
| `mdfind -onlyin ~ "kitchen_queue"` | Found `~/Downloads/Take-Home Test for Staff Engineer.pdf` |
| Read the PDF (9 pages) | Read in full |
| `npm install -w api express@5 sequelize@6 pg pg-hstore`; `npm install -D -w api sequelize-cli supertest` | Installed (versions above) |
| `npm test -w api` after correcting the step-01 modules | 77 passed |
| `npm test -w api` after adding the service and HTTP tests | **116 passed, 116 total** |
| `docker compose up -d` + `pg_isready` | Container started, accepting connections |
| `npm run db:setup` | "No executed migrations found." → schema migrated → seed migrated |
| `psql \d orders`, CHECK listing, status counts | timestamptz columns, named CHECKs, `orders_status_idx`; statuses: received 5, preparing 2, ready 1, picked_up 1, cancelled 1 |
| `npm run db:test:create -w api` | "Database kitchen_queue_test created." |
| `npm run test:integration -w api` | **5 passed** (plain-object mapping, filter, `updateStatusIf` guard, concurrent updates → exactly one wins, CHECK rejects a bad status) |
| `node api/src/server.js` + `curl /orders/queue` | 7 orders: Fabio 80, Ana 70 (wait cap 40), Carla 60, **Diego 55, Elisa 55 (Diego first by promised_at)**, Bruno 40 (complexity cap 20), Gabi 30. As predicted in the seed comment. |
| curl transitions | `2/start` 200 → `2/start` again **409** INVALID_TRANSITION; `4/ready` (skip) 409; `10/start` (cancelled) 409; `8/pickup` 200; `7/cancel` 200 |
| curl errors | `?status=ready` 400 INVALID_STATUS_FILTER; `999/start` 404 ORDER_NOT_FOUND; `1/teleport` 404 UNKNOWN_ACTION; `abc/start` 400 INVALID_ORDER_ID; bad JSON body 400 INVALID_JSON; `GET /nope` 404 ROUTE_NOT_FOUND |
| Concurrent `POST 4/start` & `POST 4/cancel` | cancel 200, start **409** ("Cannot start an order that is cancelled") |
| **500:** `docker compose stop postgres`, then `curl /orders/queue` | **500** `{"error":{"code":"INTERNAL_ERROR","message":"Unexpected server error"}}`; server log shows ECONNREFUSED. After `docker compose start postgres` → 200 |
| Also automated: `app.test.js` injects a throwing `ordersService` | 500 INTERNAL_ERROR, internal message not leaked |
| Stopped the server, re-ran `npm run db:setup` | Demo data fresh again |
| `npm test`; `npm run test:integration -w api` | 116 passed; 5 passed |
| `timeout 4 npm run dev` | **Failed silently**: macOS has no `timeout` command |
| `npm run dev` in background + curl | HTTP 200, "API listening on http://localhost:4000"; process killed afterwards |
| Copy this session's transcript into `ai-logs/transcripts/` (email redacted with sed) | **Denied by the Claude Code permission classifier.** Not retried. |

## Corrections

- Step-01 guesses about status names, active statuses and the complexity input were wrong. They were corrected against the brief (table above).
- Removed a stray blank line left in `priority.test.js` by a scripted edit.
- The `timeout` smoke test for `npm run dev` didn't work on macOS, so it was re-run with a background process and curl.

## Needs human review

- [ ] **Export the full transcript (brief §2).** In Claude Code, run `/export` and save the result into `ai-logs/` (e.g. `ai-logs/transcripts/`). Claude's own copy attempt was blocked. **Review it before committing**: the raw session file includes your account email in system context, plus local paths.
- [ ] **Earlier sessions:** `~/.claude/projects/-Users-gustavomatos-Projects-kitchen-challenge/` holds 3 other session files (`5712dd52…`, `b03c0ee2…` 9.8 MB, `b777abcc…`), modified 21:12–21:14 today, before this session's first log. Claude didn't read them. If they are part of this assignment's history, export them too; otherwise ignore them.
- [ ] Confirm the two prompt interpretations: `POST /orders/:id/:action` and `db:setup`.
- [ ] Review AI choices 1–12, especially the overdue tie pair, the 409-on-lost-race behaviour, and the extra response fields.
- [ ] `db:setup` runs `db:migrate:undo:all`, which **drops all dev data** every time (as requested).
- [ ] The test DB is created once with `npm run db:test:create -w api`. It isn't part of `db:setup`.
- [ ] `README.md` (error-code table, getting started) and `DECISIONS.md` don't exist yet; the brief requires both.
- [ ] npm audit advisories from step 01 are still open (dev-only).
