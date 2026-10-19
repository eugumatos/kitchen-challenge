# Step 00 — Set up AI logs

**Date:** 2026-10-18
**Tool:** Claude Code (`claude-opus-5-5`)

## Prompt (verbatim)

> Throughout this task, maintain an ai-logs folder documenting how AI was used.
>
> For each step, record the prompt, a brief summary of the changes, the main suggestions and decisions, and the commands actually run with their results. Include failures, corrections, and anything that still needs my review. Distinguish your recommendations from decisions I explicitly made.
>
> Keep the log factual and easy to review. Do not invent earlier interactions, test results, or human approvals. If earlier conversation history is unavailable, mark it as unavailable and leave a place for me to add the original transcript.
>
> If the assignment specifies a different format or filename for AI logs, follow that requirement. A summary should not replace the original prompts and responses if a full transcript is required.

## Summary of changes

- Created `ai-logs/README.md` (conventions, transcript placeholder, step index).
- Created `ai-logs/00-setup-ai-logs.md` (this file).

## Suggestions & decisions

**User decisions (explicit):**
- Maintain an `ai-logs` folder with the contents listed in the prompt.
- Assignment-specified log format, if any, overrides this one.

**AI recommendations (not yet approved by the user):**
- One Markdown file per step, numbered `NN-title.md`, plus an index in `README.md`.

## Commands run

| Command | Result |
|---------|--------|
| `ls -la` / `find . -maxdepth 3` in project root | Directory was empty; not a git repository. |
| `mkdir -p ai-logs` + heredocs writing the two files | Succeeded. |

## Corrections

None.

## Needs human review

- No assignment/challenge brief was found in the project directory. The actual task, and whether it prescribes its own AI-log format, is still unknown.
- Confirm the per-step file layout is acceptable.
- Earlier history: unavailable — add the transcript to `README.md` if one is required.
