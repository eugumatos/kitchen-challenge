# Step 05 — README, DECISIONS draft, and AI-log review

**Date:** 2026-10-18
**Tool:** Claude Code (`claude-opus-5-5`)

## Prompt (as received)

> Document the project so a reviewer can run it and understand the implementation without needing extra instructions.
>
> In README.md, include Docker and Node 22 as prerequisites and these four startup commands:
>
> docker compose up -d
>
> npm install
>
> npm run db
>
> npm run dev
>
> Explain the ports and clarify that db resets the configured database.
>
> Include commands for each test suite, an API endpoint table, all error codes with their HTTP statuses, and a "where the rules live" table pointing to the priority, sorting, and transition modules.
>
> Draft sections 1–4 and 6 of DECISIONS.md: Scope, Layers, Priority, Transitions, and Next. Explain the actual choices and trade-offs in this implementation. Leave section 5, AI, for me to write.
>
> Review ai-logs for completeness. It should contain the prompts used, summaries of the assistance provided, relevant decisions, actual validation results, and outstanding human review items.
> Check the assignment's AI disclosure requirements. If it requires full conversation logs, keep those separate from the summary and use the original transcript where available. Clearly identify any missing history that I need to provide.
> Link the AI usage documentation from the README. Don't write claims about my personal review or understanding on my behalf.

## Summary of changes

| File | Change |
|---|---|
| `README.md` (new) | What the project is; prerequisites (Docker, Node 22 / `.nvmrc`); the four startup commands; a warning that `db:setup` resets the configured database (and how to retarget it); ports; a test-suite table (which suites need a DB) and test-DB setup; endpoint table; error-code table with HTTP statuses (including the unmapped `UNKNOWN_ORDER_TYPE` and client-only `NETWORK_ERROR`); "where the rules live" table; project layout; an AI usage section linking `ai-logs/` |
| `DECISIONS.md` (new) | Sections 1–4 and 6 drafted; section 5 left as "_To be written by the author._" A note at the top says sections 1–4 and 6 were drafted with AI assistance |
| Root `package.json` | Added `db` (alias for `db:setup`) and `test:integration` (delegates to the API) |
| `ai-logs/README.md` | Restructured: transcripts vs summaries; a note on prompts recorded as received; step index; a consolidated list of outstanding human-review items |
| `ai-logs/transcripts/README.md` (new) | The assignment's transcript requirement quoted, and a table of missing transcripts the author needs to provide |

## Suggestions & decisions

**User decisions (explicit):** the README contents (prerequisites, four commands, ports, the
reset warning, test commands, endpoint table, error codes, rules table), DECISIONS sections 1–4
and 6 drafted with section 5 left to the author, keeping full transcripts separate from the
summaries, linking the AI docs from the README, and no claims about the author's personal review
or understanding.

**AI choices the user hasn't reviewed:**
1. **`npm run db` vs `db:setup`:** the prompt says `npm run db`; the assignment (§9.4) requires
   "one `db:setup` command". The README documents `npm run db:setup`, and a root `db` alias was
   added so the literal prompt also works.
2. **DECISIONS wording** is impersonal ("this implementation…") and doesn't speak for the
   author. The two "Next" items (status-history table; push instead of polling) are **Claude's
   recommendations** drawn from the implementation, not decisions the user made.
3. DECISIONS §1 says 11.2 was attempted and 11.1 and 11.3 skipped, which matches the code. It
   makes **no claim about time spent**: Claude doesn't know how long the author worked.
4. The README documents `UNKNOWN_ORDER_TYPE` as surfacing as a 500, rather than adding an HTTP
   mapping. It's unreachable while the DB CHECK constraint holds. Change it if you prefer a
   mapping.

## AI-log review: findings

**Assignment requirements (§2):**
- Full conversation history exported into `ai-logs/` → **missing** (see below).
- `DECISIONS.md` §5 naming one AI suggestion kept and one rejected → left for the author.
- **The repository must be clonable** (§12) → the project is not a git repo yet.

**Section check** of the step files 00–04 against the required content (prompt, summary,
user-vs-AI decisions, commands and results, corrections, review items): **all present in every
file** (checked with grep for each section heading).

**Gaps found and fixed:**
- No place for full transcripts → added `transcripts/` with a status table.
- No consolidated list of open review items → added to `ai-logs/README.md`.
- Prompts were labelled "verbatim" without noting that some `:word` tokens appear to have been
  lost before reaching Claude → explained in `ai-logs/README.md`.
- The README didn't link the AI docs → it now has an "AI usage" section.

**Missing history the author needs to provide:**
1. **An export of this Claude Code session (`bd791804…`).** Claude can't produce it: its copy
   attempt in step 02 was blocked by a permission check, and that denial also covers later
   attempts. Use `/export`.
2. **The three earlier local session files** (`5712dd52…`, `b03c0ee2…`, `b777abcc…`), only if
   they belong to this assignment. Claude didn't read them.
3. **Any other AI tool's history**, if other tools were used.

## Commands run (actual results)

| Command | Result |
|---|---|
| Read root/API `package.json` scripts, the error map, and the `errors.js` codes | Facts used in the README; found `UNKNOWN_ORDER_TYPE` without an HTTP mapping |
| Clean copy (rsync without `node_modules`/`ai-logs` into the scratchpad) → `npm install` → `npm test` | Node v22.23.3; added 593 packages; **API 116 passed, web 4 passed**. Copy deleted afterwards |
| `docker compose up -d` | Container started |
| `npm install` (real repo) | Up to date |
| `npm run db` (alias) | Schema migrated, seed migrated |
| `npm run db:setup` | Migrated again (2 "migrated" lines) |
| `npm run dev` + curl | web :5173 → 200; api :4000 → 200; proxy `/api/orders/queue` → 200 |
| `curl -X POST /orders/1/start` (×2) | 409 `INVALID_TRANSITION` "Cannot start an order that is preparing" both times (seed order 1 is already preparing), matching DECISIONS §4 |
| Stopped the dev processes | Done |
| `npm run test:integration` (root alias) | **5 passed** |
| `npm run db` | Demo data reseeded |
| `npm audit` | 21 moderate vulnerabilities (was 19 in step 01; more dev dependencies since) |
| grep of section headings across `ai-logs/0*.md` | All 7 sections present in all 5 files |

## Corrections

None in this step.

## Needs human review

See the consolidated list in [`README.md`](README.md#outstanding-items-for-human-review-current-as-of-step-07).
