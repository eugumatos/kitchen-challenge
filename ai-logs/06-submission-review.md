# Step 06 — Submission review against the assignment, clean rebuild, all suites

**Date:** 2026-10-18
**Tool:** Claude Code (`claude-opus-5-5`)

## Prompt (as received)

> /Users/gustavomatos/Downloads/Take-Home Test for Staff Engineer.pdf
>
> Review the submission against every section of the original assignment.
>
> Compare each requirement with the implementation and flag any gaps or unresolved ambiguities.
>
> Reset the project's local development database and rebuild it from scratch using the README instructions. Confirm that someone cloning the repository can follow those steps successfully.
>
> Run all test suites: API unit tests, integration tests, frontend component tests, and Playwright end-to-end tests. Check that scripts, ports, API examples, and documentation match the current implementation.

The PDF had already been read in full in step 02; this review used that reading.

## Requirement-by-requirement review

Legend: ✅ met · ⚠️ met with an interpretation or risk · ❌ not met · ➖ optional / not attempted

| § | Requirement | Status | Evidence / note |
|---|---|---|---|
| 1 | Ranked active orders; advance stages; ranking/status changes local and quick | ✅ | Rules isolated in `priorityRules.js`, `compareQueue.js`, `transitions.js`; README "Typical changes" |
| 2 | Able to explain every file | n/a | Author's responsibility; not something Claude can assess |
| 2 | `DECISIONS.md`: one AI suggestion kept, one rejected | ❌ | Section 5 deliberately left to the author |
| 2 | `ai-logs/` with **full exported conversation history** | ❌ | Summaries exist; the transcript export is missing (`ai-logs/transcripts/README.md`) |
| 3 | Order types, items, optional promise; no auth/payments/real data | ✅ | Seed uses first names only |
| 4.1 | Menu item: unique non-empty name, category list, prep > 0 | ✅ | Unique index + CHECKs in the migration |
| 4.2 | Order fields and rules | ⚠️ | All enforced by NOT NULL/CHECKs. **Ambiguity:** "promised_at … Relevant for delivery and takeout" isn't enforced: a dine_in order *may* have a `promised_at`, and it would earn promise points. `placed_at` defaults to `now()`, but there's no creation endpoint |
| 4.3 | Order item FK + quantity > 0 | ✅ | FKs (CASCADE/RESTRICT) + CHECK |
| 5 | Default queue = received + preparing; ready/terminal excluded; request-time score; frozen now in tests; UTC | ✅ | `ACTIVE_STATUSES`; injected clock; ISO `Z` timestamps |
| 5.1 | Score table | ⚠️ | All components implemented. **Interpretations:** (a) an overdue promise counts as "within 30 minutes" → 25; (b) the "30" / "31–60" gap is closed with exact time (30:30 → 15); (c) wait time keeps growing while an order is `preparing` |
| 5.2 | Tie-break | ✅ | `COMPARATORS`; full sequence tested |
| 5.3 | Worked examples A/B | ✅ | Exact breakdowns tested; B before A |
| 6 | State machine, terminal states, no skipping, repeating is an error, server-enforced | ✅ | `ACTIONS` table, 20-combination matrix test, 409 on repeat, compare-and-set update, DB CHECK |
| 7 | Endpoints, `status` filter, score per order, stable 4xx codes documented | ✅ | All verified with curl from a fresh clone (below). Choice: unknown action → 404 |
| 8 | UI columns: score, customer, type, items summary, wait, promised time, VIP, status | ✅ | All present per row |
| 8 | "**A table** showing the active queue" | ⚠️ | Implemented as a list of grid rows (`role="list"`) following the user's design direction in step 03, not a `<table>`. A reviewer reading literally may flag it |
| 8 | Filter received / preparing / default | ✅ | MUI ToggleButtonGroup |
| 8 | Only valid actions shown; cancel for received; empty state; API errors on screen | ✅ | Driven by `available_actions`; component tests 1, 2, 4 |
| 8 | Use MUI; dense ops-dashboard layout | ⚠️ | MUI provides the theme, buttons, toggle, alert and icons; the row layout is custom CSS. Rows are ~96px tall (about 7 orders per 900px screen) with decorative lanes, so **density is lower than a typical ops table**. Design risk |
| 8 | Score and sort from the API; no scoring formula in the UI | ✅ | Component test 3 with deliberately unsorted scores; checked by temporarily adding a sort (step 04) |
| 9 | One repo, two apps, no private deps | ⚠️ | Two apps in npm workspaces. **Not a git repository yet** (see §12) |
| 9.1 | Node 22, JS, Express, Sequelize 6 + migrations, PG 16, Jest | ✅ | Express 5.3, Sequelize 6.37, `postgres:16`; `sync()` never called |
| 9.1 | Layers; pure priority function; tests without PG and without mocking Sequelize | ✅ | `npm test` passed with Postgres stopped (step 04); the service uses an in-memory repository, not a Sequelize mock |
| 9.2 | Vite, React 19, TS, MUI 7, Vitest | ✅ | Vite 8.3, React 19.3, TS 5.9, MUI 7.3, Vitest 5.0 |
| 9.3 | `docker-compose.yml`, PG 16 only, host port 5433 | ✅ | Matches the snippet plus a named volume `pgdata` (harmless addition) |
| 9.4 | README: compose up, one install, one `db:setup`, one `dev` | ✅ | Verified from a fresh clone; `npm run db` alias also exists |
| 9.4 | Ports 4000 / 5173 | ✅ | Verified; `PORT` override verified on 4010 |
| 9.5 | Seed: relative dates; menu items + orders with items; types, VIP/non-VIP, both caps, promised_at tie, statuses incl. a ready one | ✅ | Seed rows confirmed after the rebuild |
| 10 | Jest priority coverage | ✅ | All named cases, incl. the delivery-VIP case |
| 10 | Jest transitions coverage incl. cancelled/picked-up absent from the default queue | ✅ | Matrix + service tests |
| 10 | Frozen `now`, no `Date.now()` in priority tests | ✅ | A spy test asserts `Date.now` is never called |
| 11.1 | `POST /orders` | ➖ | Skipped (DECISIONS §1) |
| 11.2 | Vitest component test | ✅ | 4 tests, covering both suggested scenarios |
| 11.3 | Playwright e2e with `webServer`, `npm run test:e2e` | ➖ | **Not implemented.** `npm run test:e2e` → "Missing script". The prompt asked to run this suite; it doesn't exist (see below) |
| 12 | Git repository to clone | ❌ | Directory isn't under git. Clone-ability was simulated (below) |
| 12 | README: prerequisites, four commands, ports, error codes | ✅ | |
| 12.1 | DECISIONS sections 1–6 | ⚠️ | 1–4 and 6 drafted by Claude (unreviewed); 5 missing |
| 13 | Boot in a couple of minutes; live change in ranking/status | ✅ | Fresh clone: install 5 s (warm npm cache), db:setup 1 s, dev ready 2 s. A cold network install will be slower |
| 14 | Out-of-scope items avoided | ✅ | No auth, no WebSockets, no pagination (polling every 20 s) |
| 14 | Layout deviations explained | ✅ | DECISIONS §1 "Layout" |

### Unresolved ambiguities (need an author decision or an explicit note)

1. **Overdue promises score 25** (treated as "within 30 minutes"). A literal reading of "within
   30 minutes from now" could exclude past times.
2. **The 30:00–31:00 gap** in the bucket table is closed by exact comparison (30:30 → 15).
3. **`promised_at` on dine_in orders** is allowed and scored.
4. **Wait time doesn't stop** when preparation starts.
5. **"A table"** vs the list-of-rows UI, and **density** vs the ops-dashboard guidance.
6. **Prompt-vs-brief naming** (`db` vs `db:setup`, `:id/:action`). Resolved with the brief's
   names plus an alias, but the original prompts can only be confirmed by the author.
7. **Visual reference screenshot** (step 03) was never received, so the UI can't be checked
   against it.

## Clean rebuild and clone simulation

**Clone simulation.** The project isn't a git repo, so the working tree (without `node_modules`)
was copied into the scratchpad. There it went through `git init`, `git add -A` (which applies
`.gitignore`) and a commit with a throwaway identity, then was `git clone`d to a second
scratchpad folder. Nothing was committed in the real project. The clone contained **80 files**;
`web/dist/` was correctly ignored and `api/.sequelizerc` was included.

**Local dev database reset.** In the real project, `docker compose down -v` removed the container
and the `kitchen-challenge_pgdata` volume. That deleted **both** `kitchen_queue` and
`kitchen_queue_test`.

## Commands run (actual results)

| Where | Command | Result |
|---|---|---|
| real | `pkill` dev processes; `lsof` :4000/:5173 | 0 listeners |
| scratch | rsync → `git init/add/commit` → `git ls-files` | 80 tracked files; `web/dist/` ignored |
| real | `docker compose down -v` | Container, network and volume removed; volume count 0 |
| clone | `git clone`; `nvm use` | Node v22.23.3 |
| clone | `docker compose up -d` | 0 s; pg ready after ~2 s |
| clone | `npm install` | 5 s; added 593 packages |
| clone | `npm run db:setup` | 1 s; "No executed migrations found." → schema + seed migrated |
| clone | `npm run dev` | Ready in 2 s: `[api] … :4000`, `[web] … :5173` |
| clone | README endpoint table via curl | `GET /orders/queue` 200 (7 orders, 14 fields each, `generated_at` present); `?status=received` 200 (5); `?status=preparing` 200 (2); `2/start` → preparing; `2/ready` → ready; `2/pickup` → picked_up; `4/cancel` → cancelled (all 200) |
| clone | README error table via curl | 409 INVALID_TRANSITION, 404 ORDER_NOT_FOUND, 404 UNKNOWN_ACTION, 400 INVALID_ORDER_ID, 400 INVALID_STATUS_FILTER (`ready` and repeated param), 404 ROUTE_NOT_FOUND. INVALID_JSON first showed a parse error **in Claude's curl helper** (shell quoting); a direct curl returned **400 INVALID_JSON** |
| clone | `/api` proxy on 5173; `PORT=4010` | 200; 200 |
| clone | `npm test` | Jest **6 suites, 116 passed**; Vitest **4 passed** |
| clone | `npm test -w api` / `-w web` | 116 passed / 4 passed |
| clone | `npm run db:test:create -w api`; `npm run test:integration` | Test DB created; **5 passed** |
| clone | `npm run typecheck -w web`; `npm run build` | Clean; build rc=0, with the >500 kB chunk warning |
| clone | `npm run test:e2e` (root and `-w web`); look for `playwright.config.*` | **"Missing script: test:e2e"**; no config. No Playwright suite exists |
| clone | Headless Chrome smoke test of http://localhost:5173 | 5 rows rendered (state after the curl actions), next-up on the first row, 0 page errors |
| clone | stop dev; `docker compose down -v`; delete clone + snapshot | Clone container/volume removed; folders deleted |
| real | `docker compose up -d` → `npm install` → `npm run db:setup` | New volume; up to date; "No executed migrations found." → migrated |
| real | Seed check via psql | received 5, preparing 2, ready 1, picked_up 1, cancelled 1 |
| real | `npm run dev` + queue via proxy | Fabio 80, Ana 70, Carla 60, Diego 55, Elisa 55, Bruno 40, Gabi 30 (the documented order); stopped afterwards |
| real | `npm run db:test:create -w api`; `npm test`; `npm run test:integration` | Created; 116 + 4 passed; 5 passed |
| real | `npm run db:setup` | Demo data reseeded fresh |

## Documentation consistency

Checked: README scripts, ports, the `PORT` override, `/api` proxy stripping, the endpoint table,
the error table, the queue response fields, test commands, and the DB-reset warning. All match
the implementation. DECISIONS facts checked: the 20-combination matrix, the 409 message, and no
`test:e2e` script.

**Doc changes made:**
- `README.md` project layout now lists `web/src/test/`.
- `README.md` gained a "Typical changes" list (ranking weights, tie-break, transitions, new
  status needs a constraint migration). The live interview change will be in this area.

## Corrections

- The INVALID_JSON row first looked like a failure. The cause was word-splitting of
  `-H 'Content-Type: application/json'` inside Claude's `${3:+…}` helper expansion, not the API.
  Re-tested directly: 400 INVALID_JSON.

## Needs human review

- [ ] **Playwright e2e:** requested in this prompt but not implemented (§11.3 is optional and was
  skipped). Decide whether to add it. It would need `@playwright/test`, a `webServer` config
  booting API + web, and a reseed before the run.
- [ ] Ambiguities 1–7 above: decide, or keep and mention them in DECISIONS.
- [ ] Blockers for submission are unchanged: transcript export, DECISIONS §5, `git init` + commit.
- [ ] The local test DB was recreated during this step. Anyone who reset the volume earlier must
  run `npm run db:test:create -w api` again (documented in the README).
