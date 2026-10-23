# AI usage log

This folder documents how AI was used to build this project. The main tool was Claude Code
(model `claude-opus-5-5`). The main session was `bd791804-6f34-4b9d-b875-6c9fea11bcc6`, and
three earlier sessions are included too.

It has two kinds of records, kept separate:

1. **Full transcripts** in [`transcripts/`](transcripts/). The assignment (§2) requires these.
   They are the raw Claude Code session files for every session in this project; see
   [`transcripts/README.md`](transcripts/README.md).
2. **Per-step summaries** (`NN-*.md`, below), written during the session. They make the
   transcript easier to review but don't replace it.

## What each step summary contains

- **Prompt:** the user's prompt as Claude received it (see the note below)
- **Summary of changes:** files created or changed, and dependencies added
- **Suggestions & decisions:** *explicit user decisions* listed separately from *AI choices not
  yet reviewed by the user*
- **Commands run:** the commands actually executed and their actual results, failures included
- **Corrections:** mistakes found and how they were fixed
- **Needs human review:** open items at the end of that step

**Note on prompts:** they are recorded exactly as received. Some tokens of the form `:word`
appear to have been lost before reaching Claude. "POST /orders//" was presumably
`POST /orders/:id/:action`, and "npm run db" presumably `npm run db:setup`, the name the
assignment requires. Claude went with the assignment's names, and a root `npm run db` alias
also exists. The originally typed prompts can only be confirmed from the author's side.

No earlier interactions, test results or human approvals were invented. Where something wasn't
available to Claude, the logs say so.

## Steps

| Step | File | Description |
|------|------|-------------|
| 00 | [00-setup-ai-logs.md](00-setup-ai-logs.md) | Created the ai-logs folder and logging conventions |
| 01 | [01-structure-and-business-rules.md](01-structure-and-business-rules.md) | Workspaces, compose, pure order modules + tests (type points pending) |
| 02 | [02-persistence-and-http-api.md](02-persistence-and-http-api.md) | Brief found; step-01 fixes; Sequelize schema, seed, repository, service, Express API, curl checks |
| 03 | [03-frontend-kitchen-display.md](03-frontend-kitchen-display.md) | Vite/React/MUI Kitchen Display, motion, screenshot critique loop (reference screenshot not received) |
| 04 | [04-frontend-component-tests.md](04-frontend-component-tests.md) | Vitest + Testing Library contract tests; root `npm test` runs API + web without a DB |
| 05 | [05-docs-and-ai-log-review.md](05-docs-and-ai-log-review.md) | README, DECISIONS (sections 1–4, 6), README validation, ai-logs review |
| 06 | [06-submission-review.md](06-submission-review.md) | Requirement-by-requirement review, clean rebuild, clone simulation, all suites |
| 07 | [07-decisions-section-5.md](07-decisions-section-5.md) | Author's DECISIONS.md section 5 inserted verbatim |
| 08 | [08-run-project.md](08-run-project.md) | Started the app locally (no changes) |

Supporting evidence: [`screenshots/03-frontend/`](screenshots/03-frontend/) holds UI screenshots
and the Playwright scripts that captured them.

## Outstanding items for human review (current as of step 07)

Each step file lists its own items. This is the consolidated, still-open list.

**Needed for the submission**
- [x] **Export the full transcript(s)** into `transcripts/` (assignment §2). Done on
  2026-10-23, with the account e-mail redacted.
- [x] **Put the project under git.**
- [x] Decide whether the three earlier local sessions belong to this assignment. They do and
  are included.

**Open from the step-06 review**
- [ ] Playwright e2e (§11.3) doesn't exist; the step-06 prompt asked to run it. Decide whether
  to add it.
- [ ] Unresolved spec ambiguities: overdue = 25 points, the 30–31 min bucket gap, `promised_at`
  on dine_in, wait time while preparing, "a table" vs the list layout and its density. See
  step 06.

**Inputs Claude never received**
- [ ] The **reference screenshot** for the UI (step 03). The design was built from the written
  description only.
- [ ] Confirmation of the prompt interpretations above (`:id/:action`, `db:setup`).

**AI choices not yet reviewed by the user**
- [ ] Step 01–02: field and status names now come from the assignment. Also review the
  409-on-lost-race behaviour, the extra queue response fields (`score_breakdown`,
  `minutes_waiting`, `total_prep_minutes`), and the overdue tie pair in the seed.
- [ ] Step 03: the visual direction (amber "heat lamp" accent, title copy), exit-animation
  guesses for changes made by other clients, the MUI 7 / TypeScript 5.9 pins.
- [ ] Step 04: tests stub reduced motion, so the animation code paths aren't exercised.
- [ ] Step 05: all of `README.md` and `DECISIONS.md` sections 1–4 and 6 (drafted by Claude). Section 5 is the author's text (step 07).

**Known technical leftovers**
- [ ] `npm audit` reports 21 moderate advisories (dev tooling dependencies). Not addressed.
- [ ] `vite build` warns about a chunk over 500 kB (no code splitting).
- [ ] `playwright-core` is a dev dependency of `web/`, used only for screenshots. Keep it for a
  future e2e test or remove it.
