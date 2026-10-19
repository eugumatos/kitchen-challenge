# Step 07 — Add author's DECISIONS.md section 5

**Date:** 2026-10-18
**Tool:** Claude Code (`claude-opus-5-5`)

## Prompt (as received)

> add this in DECISIONS.md in step 5
>
> ## 5. AI
>
> **Suggestion kept:** "The two tied seed orders are already overdue, so both keep 25 promise points."
>
> I kept this seed strategy because, together with identical placed_at values, it keeps their scores tied as time passes. This makes the promised_at tie-break reliable during the demo.
>
> **Suggestion rewritten:** "ACTIVE_STATUSES is queued, in_progress and ready."
>
> This initial AI proposal was corrected after checking the brief. The implementation now uses received and preparing as the only active statuses and excludes ready. The AI identified the mismatch when it read the specification. This reinforced the importance of checking generated assumptions against the actual requirements.
>
> The conversation history, including these corrections, is included in ai-logs/.

## Summary of changes

- `DECISIONS.md`: replaced the section-5 placeholder with the author's text **verbatim** (no edits).
- `DECISIONS.md`: changed the header note from "Section 5 is left for the author" to "Section 5
  was provided by the author".

## Suggestions & decisions

**User decision (explicit):** the content of section 5.

**Claude's checks of the quoted suggestions against the logs (no changes made):**
- "Suggestion kept" matches step 02, AI choice 1, and the step-03 summary.
- "Suggestion rewritten" matches step 01, AI choice 4 (`ACTIVE_STATUSES` = queued, in_progress,
  ready), corrected in step 02 against the brief.

## Commands run

| Command | Result |
|---|---|
| Python replace of the placeholder and header note (with exact-match assertions) | Succeeded; section 5 printed back and matches the provided text |
| `ls ai-logs/transcripts` | Only `README.md`: **no transcript export present yet** |

## Needs human review

- [ ] The last sentence of section 5 says the conversation history "is included in ai-logs/".
  As of this step, `ai-logs/` holds the per-step summaries, but the **full transcript export is
  still missing**. Add the `/export` output to `ai-logs/transcripts/` before submitting so the
  sentence is accurate.
