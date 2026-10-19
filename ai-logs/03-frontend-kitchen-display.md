# Step 03 — Frontend: Kitchen Display

**Date:** 2026-10-18
**Tool:** Claude Code (`claude-opus-5-5`), with the `frontend-design` skill loaded as requested

## Prompt (verbatim)

> Let's build the frontend in web/ with Vite, React 19, TypeScript, and MUI 7. Proxy /api requests to the backend on localhost:4000.
>
> Use the attached screenshot as the visual reference. If the frontend-design skill is available, use it to guide the implementation.
>
> The layout should have a near-black background, one bordered panel, monospace typography, and a title with one phrase in an accent color.
>
> Each order row should contain:
>
> An order-type icon tile.
>
> A dark card showing the customer, VIP indicator, status, items, and score in pts.
>
> A lane with a glowing ball positioned using score / top score, moving toward "the pass."
>
> The promised time above the pass line, shown in red when overdue.
>
> Waiting time and action buttons.
>
> Give the next-up row a red glowing border.
>
> Keep business decisions on the API side. Render orders in the order received, use the provided score, and render one button per available_actions entry. Determine whether an order is late using the response's generated_at rather than the browser's clock.
>
> Require a second click to confirm cancellation. Show API errors on screen with their title, message, and code.
>
> Add filters for all active, received, and preparing orders, with an appropriate empty state for each. Refresh every 20 seconds and refetch after every action.
>
> Use motion to explain changes: balls fly in and scores count up on initial load; rows slide into their new positions using FLIP; when an order leaves the queue, its ball moves into the pass while the row collapses. For cancellation, fade the ball out instead. Briefly highlight the card when its status changes.
>
> Respect prefers-reduced-motion.
>
> Open the app and take screenshots. Compare them with the reference, critique the spacing, alignment, contrast, and readability, and fix the issues you find.

## Important gap: no reference screenshot received

**No image was attached to the message** that reached Claude, and none was found in the project. Image files in `~/Downloads` looked like personal phone photos (`IMG_xxxx`), so Claude did **not** open them. The design was built from the **written description only**, and the "compare with the reference" step compared the screenshots against that written spec. **Visual fidelity to your actual reference is unverified.**

## Summary of changes

| Area | Files |
|---|---|
| Web scaffold (hand-written, no `create-vite`) | `web/package.json`, `vite.config.ts` (port 5173, `/api` → `localhost:4000` with the `/api` prefix stripped), `tsconfig.json` (strict), `index.html` (inline SVG favicon) |
| API access | `web/src/api/types.ts` (mirrors the serializer output), `web/src/api/client.ts` (`ApiError` with code/message/status; network failure → `NETWORK_ERROR`) |
| State | `web/src/hooks/useQueue.ts`: fetch per filter, 20 s polling, refetch after every action (success or failure), stale-response guard (request sequence number), exit-reason map, pending row |
| Components | `KitchenDisplay.tsx` (title, meta line from `generated_at`, filter toggle, refresh, error banner, column header, list), `QueueRow.tsx` (tile, card, lane, ball, promise label, pass line, wait, actions, exit choreography, status flash), `ActionButtons.tsx` (one button per `available_actions`, two-step cancel with a 4 s window), `ScoreCountUp.tsx`, `OrderTypeTile.tsx`, `ErrorBanner.tsx`, `EmptyState.tsx`, `presentation.ts` (labels, time formatting, `promiseStatus` against `generated_at`) |
| Theme | `web/src/theme/theme.ts` (MUI dark theme + tokens), `web/src/theme/kitchen.css` (layout, lane, responsive ≤980px / ≤520px, reduced motion) |
| Root | `package.json`: `dev` now runs API + web through `concurrently -k`; added `build` |
| Dependencies | react/react-dom 19.3.1, @mui/material + icons 7.3.11, @emotion/react/styled, motion 14.3.0, @fontsource/jetbrains-mono 5.3.0; dev: vite 8.3.4, @vitejs/plugin-react 6.1.2, typescript 5.9.3, @types/react(-dom) 19, playwright-core 1.64.1 (screenshots only); root dev: concurrently 10.0.6 |
| Evidence | `ai-logs/screenshots/03-frontend/` (11 PNGs + the two Playwright capture scripts) |

## Suggestions & decisions

**User decisions (explicit):** Vite + React 19 + TS + MUI 7, the `/api` proxy, near-black background with one bordered panel, monospace type, one accent phrase in the title, the row anatomy, ball position = score / top score, the promise label above the pass line and red when overdue, a red glow on the next-up row, no business logic in the UI (API order, API score, `available_actions`, lateness from `generated_at`), two-click cancel, errors shown with title, message and code, three filters each with its own empty state, 20 s refresh plus refetch after actions, the specific motion behaviours, reduced motion respected, a screenshot critique loop.

**AI choices the user hasn't reviewed (please check):**
1. **Design plan** (from the frontend-design skill; the brief fixed the overall look):
   - Tokens: ink `#050607`, panel `#0C0E10`, card `#121519`, text `#E6E8EA`, muted `#8B929B`, heat amber `#FFB341`, alarm red `#FF4B3E`.
   - Amber is the heat lamp over the pass (title phrase, balls, pass line, score numbers). Red appears only for lateness and next-up.
   - JetBrains Mono, self-hosted with @fontsource (no CDN).
   - Title copy: "Orders heading to **the pass**".
   - The one bold element is the lane with balls converging on a continuous glowing pass line. Everything else is quiet. No all-caps labels.
2. **Version pins:** MUI **7** (latest is 9; the brief says 7). TypeScript **5.9** rather than the brand-new 7.0, to avoid tooling surprises.
3. The **`motion`** library (formerly Framer Motion): `layout="position"` for FLIP, `AnimatePresence` + `usePresence`/`useAnimate` for the exits, `MotionConfig reducedMotion="user"`.
4. **Exit reasons:** `ready` → ball into the pass; `cancel` → ball fades; `start` while viewing "Received" → plain collapse (the order didn't reach the pass). If an order disappears because of **another client**, the UI guesses `pass` when it was `preparing`, otherwise collapse. A remote cancel of a received order therefore collapses instead of fading.
5. **Filter change remounts the list** (`key={filter}`), so rows that leave because of the filter don't play the pass animation, and the balls fly in again for the new view. A filter change also clears any displayed error.
6. **Reduced motion:** the balls and scores render at their final values immediately (verified: score already 70 at 80 ms), exits remove the row without animation, and the status flash stays only as a static highlight for about 1 s with no movement.
7. **Extra UI not requested:** a "next up" badge (so next-up isn't signalled by colour alone); a score-breakdown tooltip on the score (`title` attribute, read straight from `score_breakdown`); a manual refresh button; type labels under the icon tiles; and the promise label showing both clock time and relative time ("due 21:55, in 20m" / "5m late (21:29)").
8. **Error titles** are a small UI map from code to title (`ERROR_TITLES`). The message and code come straight from the API.
9. **Lateness and relative time** are computed in `presentation.ts` from `promised_at − generated_at`. Under your rule this is a display calculation, not a scoring rule.

## Visual critique and fixes (screenshots compared against the written spec)

| Round | Issue found | Fix |
|---|---|---|
| 1 | Action buttons pushed to the far right, leaving a dead gap after the waiting column | Buttons left-aligned in their column; column narrowed to 200px |
| 1 | Secondary "Cancel" as bright as the primary "Start" | Muted (the MUI `color="inherit"` override needed a more specific selector) |
| 1 | Pass line ran past the last row into the panel padding | The last row's pass segment now ends at its padding |
| 1 | 10px type and waiting labels too small | Raised to 11px |
| 1 | "waiting" column header repeated each row's own label | Header removed |
| 1 | Console 404 for `/favicon.ico` | Inline SVG favicon |
| 2 | During an exit, **two rows** had the next-up glow (exiting Fabio and the new first row, Ana) | Next-up styling requires the row to still be present |
| 2 | Error code chip used the browser's default monospace, not JetBrains Mono | `font-family: inherit` on `<code>` |
| 2 | "Confirm cancel" reused the Cancel button's DOM node (mid colour transition, weaker focus handling) | Separate React key for the confirm button |
| 2 | A stale action error stayed up after switching filters; column header showed over the empty state | Errors clear on filter change; header hidden when the list is empty |
| 3 | The new last-row pass-line rule out-specified the mobile override | Mobile selector extended |

**Known and left as is:** with score / top score, the lowest-scoring balls sit around 35–40% along the lane, so the left third of each lane is usually empty. That's the faithful ratio you specified. While a row collapses, its `overflow: hidden` briefly clips its piece of the continuous pass line.

## Commands run (actual results)

| Command | Result |
|---|---|
| `find` for `*.png/jpg/webp` in the project; list of image names in ~/Downloads | None in the project; Downloads images not opened (personal photos) |
| `npm view <pkg> version` for 10 packages | Found MUI 9 and TS 7 as the latest versions → pinned 7 and 5 |
| `npm install -w web …` / `-D -w web …` / `-D concurrently` | Installed (versions above) |
| Inspected `node_modules/motion` exports and types | Confirmed `motion/react` and the hooks used |
| `npx tsc --noEmit` (web), several times | Clean each time |
| `npm run db:setup` + `npm run dev` + `curl localhost:5173/api/orders/queue` | Proxy works; both servers up (`[api] … :4000`, `[web] … :5173`) |
| `node shoot.cjs … v1` (desktop 1440×900 + mobile 390×844, headless Chrome via playwright-core) | 4 screenshots; 1 console error: favicon 404 |
| Reseed + `node interact.cjs` (start → flash; ready → pass exit; cancel → confirm → fade; another client cancels Gabi via curl, then UI Start → 409 banner; filters; empty states with **browser-side stubbed** empty responses; reduced-motion page) | All flows worked. Alert text: "That action no longer applies \| Cannot start an order that is cancelled \| INVALID_TRANSITION". Three empty-state copies shown. Reduced-motion score at 80 ms = 70 (final). Only console entry: the browser's log of the intentional 409 |
| `npm run build` | Built in 405 ms. **Warning:** chunk larger than 500 kB (MUI + icons + motion, not code-split) |
| Final `shoot.cjs v3` | No console errors or warnings |
| `npm test` (API) | 116 passed (no regressions) |
| `pkill` concurrently / vite / api watcher; `lsof` on 4000/5173 | 0 listeners left |
| `npm run db:setup` | Demo data reseeded fresh |

## Corrections

- See the critique table: three rounds of visual fixes, including a real behaviour bug (two next-up rows during an exit).
- Replaced an `eslint-disable` comment in `QueueRow.tsx` (no ESLint is configured) with a plain comment explaining the effect's dependencies.
- Screenshot naming: the `i1–i4` PNGs in the evidence folder come from the **second** interaction run (after the fixes). The first-run versions were overwritten. `v1-*` are the pre-fix baselines and `v3-*` the final state.

## Needs human review

- [ ] **Provide the reference screenshot** (it didn't come through). Claude can then do a real comparison pass.
- [ ] Review the design choices (item 1), especially the amber "heat lamp" accent and the title copy.
- [ ] Decide whether remote cancellations should fade (needs the API to report *why* an order left; currently guessed, item 4).
- [ ] Bundle-size warning: code-split or ignore it for an internal tool?
- [ ] No frontend tests yet. Vitest component tests are an extra-points item in the brief (§11.2).
- [ ] `playwright-core` was added as a dev dependency of `web` for screenshots, using the system Chrome. Keep it (useful for the §11.3 e2e extra) or remove it.
- [ ] The transcript export from step 02 (`/export`) is still pending.
