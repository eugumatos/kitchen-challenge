# Step 08 — Run the project

**Date:** 2026-10-18
**Tool:** Claude Code (`claude-opus-5-5`)

## Prompt (as received)

> run project

## Summary

Started the app for local use. No code or data changes. The database was **not** reseeded, so
the existing demo data from step 06 was kept.

## Commands run (actual results)

| Command | Result |
|---|---|
| `docker compose up -d` + `pg_isready` | Container already running; accepting connections |
| `lsof` on :4000 / :5173 | Free |
| `npm run dev` (background task `bh55unere`) | API on :4000, web on :5173 |
| `curl localhost:5173/` | 200 |
| `curl localhost:5173/api/orders/queue` | 7 orders: Fabio 85, Ana 70, Carla 65, Diego 60, Elisa 60, Bruno 45, Gabi 35. Scores are higher than at seed time because wait-time points grow as time passes, which is expected |
| `open http://localhost:5173` | Opened in the default browser |

## Needs human review

None. Stop the servers with Ctrl-C in their terminal, or ask Claude to stop background task
`bh55unere`. `npm run db:setup` restores the fresh demo state.
