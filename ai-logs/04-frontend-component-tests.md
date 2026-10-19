# Step 04 — Frontend component tests (Vitest + Testing Library)

**Date:** 2026-10-18
**Tool:** Claude Code (`claude-opus-5-5`)

## Prompt (verbatim)

> Add component tests with Vitest and Testing Library.
>
> Focus on the frontend's contract with the API:
>
> An empty queue renders the empty state.
>
> Cancel is shown only when available_actions includes it.
>
> Rows stay in API order. Use a mocked response with scores deliberately out of order to catch accidental client-side sorting.
>
> A failed action returning 409 INVALID_TRANSITION displays the API error on screen.
>
> Update the root npm test command to run both API unit tests and frontend component tests without requiring a database.

## Summary of changes

| File | Purpose |
|---|---|
| `web/vitest.config.ts` | Merges `vite.config.ts`; jsdom environment; setup file; `restoreMocks`, `unstubGlobals` |
| `web/src/test/setup.ts` | jest-dom matchers, `cleanup` after each test, a `matchMedia` stub that reports reduced motion |
| `web/src/test/renderApp.tsx` | `queueOrder()` fixture builder, `queue()`, `mockApi(route)` (stubs global `fetch` with a small URL/method router; an unmocked request throws), `renderApp()` (real theme + `MotionConfig`) |
| `web/src/components/KitchenDisplay.test.tsx` | The 4 contract tests |
| `web/package.json` | `test: vitest run`, `test:watch: vitest` |
| Root `package.json` | **Unchanged**: `npm test --workspaces --if-present` already runs every workspace's `test`. The API's `test` skips `test/integration/` (step 02) and web now has a `test` script, so the root command covers both without a database. |
| Dev dependencies (web) | vitest 5.0.5, jsdom 30.1.3, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, @testing-library/jest-dom 7.0.1, @testing-library/user-event 14.6.8 |

## The tests

1. **Empty queue → empty state:** the API returns `orders: []` → "No active orders" is shown, with no list items.
2. **Cancel only when listed:** three orders.
   - Ana (`received`, `['start','cancel']`) shows Cancel.
   - Carla (`preparing`, `['ready']`) doesn't.
   - **Diego (`received`, `['start']`) doesn't either.** That case proves the UI follows `available_actions` rather than inferring from `status`.
   - Also checks one button per action with the right labels (`Start, Cancel` and `Mark ready`).
3. **API order kept:** scores 30, 90, 60 (Ana, Bruno, Elisa) render in exactly that order. The first row (score 30) is "next up" and shows its API score.
4. **409 shown on screen:** clicking Start gets a 409 `INVALID_TRANSITION`. The alert shows the title "That action no longer applies", the API message and the code. The test also checks the queue is refetched after the failed action.

## Suggestions & decisions

**User decisions (explicit):** Vitest + Testing Library, the four scenarios, deliberately unsorted scores, and a root `npm test` that covers both apps without a DB.

**AI choices the user hasn't reviewed:**
1. Tests render the **whole `KitchenDisplay`** with `fetch` stubbed, instead of individual components with props. That tests the real contract (HTTP response → screen) through `client.ts` and `useQueue`.
2. The **`matchMedia` stub reports reduced motion**, so rows, balls and count-up scores render their final values immediately. Tests assert on API data, not animation frames. Trade-off: the animated code paths are **not** exercised by these tests.
3. **The Diego case** (received but no cancel) goes slightly beyond the prompt. It's what separates "reads `available_actions`" from "reads `status`".
4. `mockApi` throws on any unmocked request, so an unexpected API call fails loudly.

## Commands run (actual results)

| Command | Result |
|---|---|
| `npm view` versions/peers for vitest, jsdom, Testing Library packages | Compatible with Vite 8 / React 19 |
| `npm install -D -w web vitest jsdom @testing-library/{react,dom,jest-dom,user-event}` | Installed. Exit code 1 came from a follow-up `node -e` that looked for jest-dom in the root `node_modules`; it is installed in `web/node_modules` |
| `npm test -w web` (first run) | **1 failed, 3 passed**: the order test couldn't find the score text "30" |
| Debug test (temporary, deleted afterwards) | Score was `0` right after render and `30` 1.2 s later: the count-up animation was running in jsdom |
| Fixed the `matchMedia` stub, `npm test -w web` | **4 passed** |
| Root `npm test` | API **116 passed**; web **4 passed** |
| `npx tsc --noEmit -p web` | Clean |
| **Mutation check 1:** temporarily added `.sort((a,b) => b.score - a.score)` in `KitchenDisplay` | "rows stay in API order…" **failed** as intended (1 failed, 3 passed); source restored |
| **Mutation check 2:** temporarily derived Cancel from `status === 'received'` | "Cancel is shown only when…" **failed** as intended; source restored |
| `cmp` of the backups against the restored sources, then `vitest run` | Identical; 4 passed |
| `docker compose stop postgres` → root `npm test` → `docker compose start postgres` | **116 + 4 passed with Postgres stopped**; Postgres restarted |

## Corrections

- **Root cause of the first failure:** motion's `useReducedMotion` queries `(prefers-reduced-motion)` in boolean form. Claude's stub only matched `prefers-reduced-motion: reduce`, so the animation ran and the test caught the score mid count-up. The stub now matches both forms.
- **Mutation-check misfire:** the first attempt used `npx vitest run --root web` from the repo root and printed no test results, so it proved nothing. Re-run from inside `web/`, it gave the results above.
- **Stray temp file:** that first mutation command also copied a backup to `/tmp/kd.bak`, outside the session scratchpad. It was deleted (`rm -f /tmp/kd.bak`) and wasn't used for the restore (the scratchpad copies were).

## Needs human review

- [ ] Confirm that skipping animations in tests (reduced-motion stub) is acceptable.
- [ ] The Playwright e2e extra (§11.3) isn't done; `playwright-core` is only used for screenshots.
- [ ] Still pending from earlier steps: the `/export` transcript, the reference screenshot, `README.md`, `DECISIONS.md`.
