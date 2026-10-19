# Step 01 — Project structure and queue business rules

**Date:** 2026-10-18
**Tool:** Claude Code (`claude-opus-5-5`)

## Prompt (verbatim)

> Let's start with the project structure and the queue's business rules.
>
> Set up npm workspaces for api and web, add Node 22 to .nvmrc, and create an appropriate .gitignore. Use Node 22 through nvm. Follow the assignment's Docker Compose configuration: postgres:16, kitchen_queue for the username, password, and database, and port mapping 5433:5432.
>
> For the API, use CommonJS and Jest. At this stage, keep the implementation limited to pure modules under src/modules/orders/. We should be able to test the business rules without a database or HTTP server.
>
> Organize the modules as follows:
>
> priorityRules.js holds the scoring values as data: the type points from the assignment, 20 points for VIP, 5 points per 10 minutes of waiting capped at 40, 5 points per 15 minutes of complexity capped at 20, and promise-time buckets of 25 points for <=30 minutes and 15 points for >30 and <=60 minutes.
>
> priority.js exposes computePriority(order, now), returning a number, along with scoreBreakdown and minutesWaiting.
>
> compareQueue.js defines an ordered list of comparators: score descending, promised_at ascending with nulls last, placed_at ascending, then id ascending.
>
> transitions.js defines an ACTIONS table for start, cancel, ready, and pickup, with from[] and to. Include ACTIVE_STATUSES, availableActions(status), and nextStatus(status, action).
>
> errors.js defines DomainError with stable error codes, including INVALID_TRANSITION and UNKNOWN_ACTION.
>
> Pass the current time into the functions rather than reading the clock internally. Waiting time uses whole minutes, so 9m50s counts as 9 minutes. If placed_at is in the future, clamp the waiting time to zero.
>
> Promise-time scoring is different: use the exact time difference. An overdue order gets 25 points, while an order due in 30m30s gets 15.
>
> Write the unit tests first, using a fixed now and no Date.now(). Cover:
>
> Worked examples A and B from the assignment: both score 60, with B ahead of A.
>
> Both scoring caps.
>
> Every promise-time bucket, including 30:00, 30:30, 60:00, 61 minutes, null, and overdue.
>
> The full tie-break sequence.
>
> A delivery VIP order outranking a non-VIP dine-in order.
>
> The complete status/action matrix: 4 legal and 16 illegal combinations.

## Blocker found

The assignment brief is **not in the repository** (the directory held only `ai-logs/`), and it wasn't anywhere else Claude checked. Three things depend on it:
- the **order-type points** for `priorityRules.js`
- **worked examples A and B**
- the type keys (e.g. `delivery`, `dine_in`) for the VIP-delivery vs. dine-in test

Claude did **not** guess these values. `TYPE_POINTS` is left empty, with a TODO, and the three tests are `test.todo` (pending, not passing).

## Summary of changes

| File | Purpose |
|------|---------|
| `package.json` | Root, private, `workspaces: ["api","web"]`, `engines.node >=22 <23`, `test`/`db:up`/`db:down` scripts |
| `.nvmrc` | `22` |
| `.gitignore` | node_modules, .env*, logs, coverage, build output, OS/editor files |
| `docker-compose.yml` | `postgres:16`, user/password/db `kitchen_queue`, ports `5433:5432`, named volume `pgdata` |
| `api/package.json` | `"type": "commonjs"`, Jest (`testEnvironment: node`) |
| `web/package.json` | Placeholder workspace only (no framework yet) |
| `api/src/modules/orders/errors.js` | `DomainError(code, message, details)`, frozen `ERROR_CODES`: `INVALID_TRANSITION`, `UNKNOWN_ACTION`, `UNKNOWN_ORDER_TYPE`; rejects unregistered codes |
| `api/src/modules/orders/priorityRules.js` | Scoring values as frozen data (type points still empty) |
| `api/src/modules/orders/priority.js` | `computePriority`, `scoreBreakdown`, `minutesWaiting`, plus per-component helpers |
| `api/src/modules/orders/compareQueue.js` | `COMPARATORS` (ordered list) and `compareQueue` |
| `api/src/modules/orders/transitions.js` | `STATUSES`, `ACTIONS`, `ACTIVE_STATUSES`, `availableActions`, `nextStatus` |
| `api/test/modules/orders/*.test.js` | 4 test files (written before the implementation) |

## Suggestions & decisions

**User decisions (explicit, from the prompt):** npm workspaces, Node 22 through nvm, the compose settings, CommonJS + Jest, pure modules only, the module names and APIs, all scoring values except type points, the comparator order, injected `now`, whole-minute waiting with a clamp at zero, exact-difference promise buckets, tests first, and the required coverage list.

**AI choices the user hasn't reviewed (please check):**
1. **Order field names:** `id`, `type`, `is_vip`, `placed_at`, `promised_at`, `complexity_minutes`. `complexity_minutes` especially is a guess; the assignment may use a different name.
2. **Status names:** `queued`, `in_progress`, `ready`, `picked_up`, `cancelled` (5 statuses × 4 actions = 20 combinations).
3. **Legal transitions:** start `queued→in_progress`, cancel `queued→cancelled`, ready `in_progress→ready`, pickup `ready→picked_up`. This gives exactly 4 legal combinations, so **cancel is allowed only from `queued`**. Check this against the assignment.
4. **`ACTIVE_STATUSES` = `queued`, `in_progress`, `ready`** (all non-terminal statuses).
5. **Complexity steps are whole blocks:** 14 min → 0, 15 → 5, 60+ → 20 (capped). Negative or missing values count as 0.
6. **Promise bucket boundary:** an order due exactly now, or overdue, falls into the ≤30 bucket (25 points). 60:00 exactly gets 15, and anything over 60:00 gets 0.
7. **Unknown order type** throws `DomainError(UNKNOWN_ORDER_TYPE)` instead of silently scoring 0. That adds a third error code.
8. **Comparators** work on entries shaped `{ ...order, score }`, so the score is computed beforehand. `id` compares numerically when both ids are numbers, and as strings otherwise.
9. **Extra exported helpers** (`typePoints`, `vipPoints`, `waitingPoints`, `complexityPoints`, `promisePoints`). The caps and buckets are tested through them, so those tests don't depend on the missing type points.
10. Every priority function also takes an optional `rules` argument (defaults to `PRIORITY_RULES`), so the rules stay data.
11. The compose file adds a named volume `pgdata` (not requested). Remove it if the assignment's compose file doesn't have one.

## Commands run (actual results)

| Command | Result |
|---------|--------|
| `find .` and a search of ~/Downloads, ~/Desktop for an assignment file | Nothing found |
| `ls ~/.nvm/versions/node`; `node -v` | Installed: v22.23.3, v24.12.0. The shell default `node` is **v25.6.1** (not from nvm) |
| `source ~/.nvm/nvm.sh && nvm use 22` | nvm 0.40.3 → Node v22.23.3, npm 10.9.9 |
| `npm install -D jest -w api` (under Node 22) | Installed jest@30.5.2 |
| `npm audit` | **19 moderate** advisories in dev dependencies (e.g. `sprintf-js` GHSA-hp3w-g68c-fv3c, pulled in through Jest). `npm audit fix --force` was **not** run |
| `npm test -w api` (tests only, before the implementation) | 4 suites failed with `Cannot find module` (expected red phase) |
| `npm test -w api` (after the implementation) | **4 suites passed; 68 passed, 3 todo, 71 total** |
| `docker compose config --quiet` | OK (syntax only; the container was **not** started) |

## Corrections

- In the first draft of the "does not read the clock" test, the assertion was `expect(() => scoreBreakdown).not.toThrow()`, which never calls the function, so the test checked nothing. Claude rewrote it to call every clock-dependent helper with a `Date.now` spy before the implementation existed.

## Needs human review

- [ ] **Provide the assignment brief** (or the type points and examples A/B). Then fill in `TYPE_POINTS` and turn the 3 `test.todo`s into real tests.
- [ ] Confirm or correct items 1–11 under "AI choices" above, especially the field names, status names, and where cancel is allowed from.
- [ ] Check that the compose file matches the assignment's exactly (volume, any container name or healthcheck).
- [ ] Decide whether the npm audit advisories matter (they affect dev dependencies only).
- [ ] Remember to run `nvm use` in new shells: the shell default is Node 25.
- [ ] `web/` is only an empty workspace; no framework has been chosen.

---
**Follow-up (added in step 02):** The brief was found in step 02. Type points, examples A/B and the VIP test were filled in. AI choices 1, 2 and 4 above (field names, status names, `ACTIVE_STATUSES`) turned out to be **wrong** and were corrected. See `02-persistence-and-http-api.md`. The original text above is kept as written.
