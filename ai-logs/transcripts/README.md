# Full conversation transcripts

The assignment (§2) asks for the **full conversation history** exported from the AI tool:
"Create a folder called `ai-logs/` at the root and export the full conversation history from the
tool you used (screenshots, markdown exports, or .json files — whatever your tool supports)."

Transcripts belong in this folder, kept separate from the per-step summaries in `ai-logs/`.
The summaries do **not** replace the transcripts.

## Files

These are the raw Claude Code session files (`.jsonl`, one JSON event per line) for every
session run in this project, copied unchanged except that the account e-mail address is replaced
with `[redacted-email]`. They include prompts, assistant replies, tool calls and their results,
and screenshots (as base64 images).

| File | Date | Content |
|---|---|---|
| [`b03c0ee2-4be7-4f54-a164-6c97a6691347.jsonl`](b03c0ee2-4be7-4f54-a164-6c97a6691347.jsonl) | 2026-10-17 | First attempt: structure, business rules, API, tests, start of the frontend. Superseded by `bd791804`. |
| [`b777abcc-5d3f-462c-afd0-7bddaf5d5fee.jsonl`](b777abcc-5d3f-462c-afd0-7bddaf5d5fee.jsonl) | 2026-10-18 | Short session holding only the frontend prompt, followed by `/clear`. |
| [`5712dd52-28d8-4a95-8a8c-82767de6d649.jsonl`](5712dd52-28d8-4a95-8a8c-82767de6d649.jsonl) | 2026-10-18 | The `/clear` command. |
| [`bd791804-6f34-4b9d-b875-6c9fea11bcc6.jsonl`](bd791804-6f34-4b9d-b875-6c9fea11bcc6.jsonl) | 2026-10-18 | **Main session.** Steps 00–08 in `ai-logs/` were written during it. |

To read one, open it in any text editor or run, for example:

```sh
jq -r 'select(.type=="user" or .type=="assistant") | .message.content' bd791804-6f34-4b9d-b875-6c9fea11bcc6.jsonl
```

No other AI tool was used for this assignment.
