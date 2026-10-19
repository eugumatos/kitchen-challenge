# Decisions

> Sections 1–4 and 6 were drafted with AI assistance from the implementation and the step logs
> in [`ai-logs/`](ai-logs/). Section 5 was provided by the author.

## 1. Scope

**Built:** the required core end to end.

- **API:** `GET /orders/queue` with the optional `status` filter, and the four transition
  endpoints. One migration for `menu_items`, `orders` and `order_items`. A seed whose timestamps
  are relative to when it runs.
- **Web:** the single Kitchen Display page with the three filters, an empty state per filter,
  one action button per allowed action, a two-step cancel, and on-screen API errors.
- **Required tests:** Jest priority and transition tests with a frozen `now`. Beyond those:
  - service tests against an in-memory repository
  - HTTP tests with supertest
  - repository integration tests against a separate test database

**Extra points:**

- **11.2 Vitest component test: attempted.** Four contract tests: empty state, Cancel shown
  only when the API lists it, rows kept in API order, a 409 rendered on screen.
- **11.1 `POST /orders`: skipped.** The required flow doesn't need order creation; the seed
  covers the demo.
- **11.3 Playwright end-to-end: skipped.** `playwright-core` is in `web/` only because it was
  used to take screenshots during UI review. There is no `test:e2e` script.

**Cut or deferred:** everything in the brief's out-of-scope list (auth, real-time push,
pagination, etc.). The web bundle isn't code-split; `vite build` warns about a chunk over 500 kB.

**Layout:** it follows the suggested `api/src`, `web/src`, `ai-logs/` structure. Additions:
`api/test/` for Jest, `api/src/schema/` for Sequelize config, models, migrations and seeders
(through `.sequelizerc`), and npm workspaces at the root so that one install, one `dev` and one
`test` command cover both apps.

## 2. Layers

- **Module** (`api/src/modules/orders/`): all business rules. It has no Express or Sequelize
  imports.
  - `priorityRules.js` holds the scoring numbers as data.
  - `priority.js` turns an order plus `now` into a score.
  - `compareQueue.js` is the ordered list of tie-break comparators.
  - `transitions.js` is the state machine as a table.
  - `ordersService.js` composes these with a repository it receives as a dependency.
- **Repository** (`api/src/repositories/orderRepository.js`): the Sequelize queries and
  includes. It returns plain objects, so nothing above it depends on Sequelize instances.
- **Endpoint** (`api/src/http/`): each handler reads the request, calls the service, and writes
  the serialized result. Error-to-status mapping lives in one error handler.
- **Schema**: models and the migration.
- **UI** (`web/`): renders what the API returns, in the order it returns it. The rule kept out
  of the UI is **which actions an order allows**. The UI renders one button per entry in the
  order's `available_actions` and never infers actions from `status`; a component test covers a
  `received` order without `cancel`. Duplicating the state machine in the client would create a
  second copy that drifts when the status rules change, and a hidden button doesn't stop a
  direct API call anyway. The score and the sort order are likewise taken as given, and a test
  feeds deliberately unsorted scores to catch accidental client-side sorting.

**The one place the UI does time arithmetic:** the "5m late / due in 20m" label. It compares
`promised_at` with the response's `generated_at`, not the browser clock, so the label always
agrees with the snapshot the scores were computed from.

**Database as a backstop:** `category`, `type` and `status` are `VARCHAR` columns with named
`CHECK` constraints rather than PostgreSQL enums. The trade-off: a later migration can change the
allowed values by dropping and re-adding one constraint inside a transaction, whereas enum values
are awkward to remove or rename. The migration keeps its own copy of the allowed values
on purpose. A migration is a snapshot of the schema at one point in time and shouldn't change
when the domain constants change.

## 3. Priority

**Request-time scoring:** the score is never stored. On each `GET /orders/queue`:

1. The handler reads `now` from an injected clock (`createApp({ ordersService, clock })`).
2. The service loads the active orders with their items.
3. `computePriority(order, now)` scores each one, `scoreBreakdown` adds the per-component points.
4. The list is sorted with `compareQueue`.

The response includes `generated_at` (that same `now`), the score, and its breakdown. Because
`now` is an argument, the priority tests use a fixed instant and the worked examples A and B
from the brief are reproduced exactly (both 60, B first). In production the clock is
`() => new Date()`. Each change to the ranking lands in one place:

- **Values** (type points, steps, caps, buckets): `priorityRules.js`.
- **Tie-break:** reorder or add an entry in the comparator list.

**Two time rules that look alike but differ, and were easy to get wrong:**

- **Wait time** uses whole elapsed minutes, floored: 9m50s is 9 minutes, so 0 points. A
  `placed_at` in the future clamps to 0.
- **Promised time** uses the exact difference.
  - The brief's buckets ("within 30", "31–60") leave a gap between 30:00 and 31:00. Exact
    comparison closes it: ≤ 30:00 scores 25, so 30:30 scores 15, 60:00 scores 15, and 61:00
    scores 0.
  - An overdue promise counts as "within 30 minutes" and scores 25. It never drops back to
    0, so a late order doesn't lose urgency.
  - Flooring the promise difference like the wait time would have moved 30:30 into the 25 bucket.

**Seed edge case:** the two seed orders whose tie is broken by `promised_at` share the exact
same `placed_at` and are both already overdue. Their wait points and promise points therefore
stay equal as time passes, and the tie keeps demonstrating the rule instead of dissolving after
a few minutes.

## 4. Transitions

**Enforced on the server, in three layers:**

1. **State machine** (`transitions.js`): an `ACTIONS` table where each action lists its allowed
   `from` statuses and its `to` status. There are four legal combinations out of twenty, and a
   test covers all twenty. `nextStatus(status, action)` throws `INVALID_TRANSITION` for anything
   not in the table, which covers skipping a step, repeating a transition, and acting on a
   terminal status.
2. **Service** (`applyAction`): validates the id and the action name, loads the order, and asks
   the state machine for the next status. It then persists with
   `updateStatusIf(id, from, to)`, an `UPDATE … WHERE id = ? AND status = ?`. If two requests
   race (say start and cancel on the same order), only one update matches. The loser re-reads
   the order and gets `INVALID_TRANSITION` against the status the order has *now*. Both cases
   were verified: an integration test runs two concurrent conditional updates where exactly one
   wins, and two simultaneous curl requests returned 200 and 409.
3. **Database:** `orders_status_check` rejects any status outside the allowed list.

**Starting an order that is already `preparing`:** `POST /orders/:id/start` returns **409**
`INVALID_TRANSITION` with the message "Cannot start an order that is preparing" and
`details: { status: "preparing", action: "start" }`. Nothing is written. Repeating a transition
is an error, not a silent success. In the UI the 409 appears as an error banner, and the queue
is refetched so the screen shows the real state.

**Error codes:** an unknown action returns 404 `UNKNOWN_ACTION` rather than 400, because
`/orders/:id/<action>` names a sub-resource that doesn't exist. A missing order returns 404
`ORDER_NOT_FOUND`, and a malformed id returns 400 `INVALID_ORDER_ID`.

## 5. AI

**Suggestion kept:** “The two tied seed orders are already overdue, so both keep 25 promise points.”

I kept this seed strategy because, together with identical placed_at values, it keeps their scores tied as time passes. This makes the promised_at tie-break reliable during the demo.

**Suggestion rewritten:** “ACTIVE_STATUSES is queued, in_progress and ready.”

This initial AI proposal was corrected after checking the brief. The implementation now uses received and preparing as the only active statuses and excludes ready. The AI identified the mismatch when it read the specification. This reinforced the importance of checking generated assumptions against the actual requirements.

The conversation history, including these corrections, is included in ai-logs/.

## 6. Next

If this had to run in a real kitchen next month, the first two changes would be:

1. **Record every status change in an append-only history table** (order, from, to, when, and
   later who). Today only the current status is stored.
   - Prep time can't be measured, so the scoring weights can't be tuned against reality.
   - A disputed cancellation or a lost race can't be explained after the fact.
   - Wait time keeps counting after an order starts preparing. Whether that is right is a
     product question, and the history would provide the data to answer it.
2. **Push queue changes to the screen instead of polling every 20 seconds.** Two expeditors, or
   a kitchen screen and a front-of-house screen, currently see different states for up to 20
   seconds, and the conditional update turns that staleness into 409s. Server-sent events on
   status change, with the existing `GET /orders/queue` as the initial and fallback load, would
   keep the current API contract.
