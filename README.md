# cyberSOCks

Cyber Security Operations Center — laptop host audit CLI.

Sweeps local sensors, asks an LLM for a SOC briefing, optionally posts a styled update to Telegram.

## Modes

| Flag | Backend | Model |
| --- | --- | --- |
| `--non-tee` (default) | OpenCode Zen | `laguna-s-2.1-free` |
| `--tee` | NEAR AI Cloud | [`deepseek-ai/DeepSeek-V4-Flash`](https://cloud.near.ai/models/deepseek-ai/DeepSeek-V4-Flash) (TEE, fast) |

Node.js ≥ 22. Zero npm dependencies.

## Setup

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `OPENCODE_API_KEY` | non-TEE analyst ([opencode.ai/auth](https://opencode.ai/auth)) |
| `NEAR_AI_API_KEY` | TEE analyst ([cloud.near.ai](https://cloud.near.ai)) |
| `TELEGRAM_BOT_TOKEN` | Bot from @BotFather |
| `TELEGRAM_CHAT_ID` | Destination chat id |
| `CYBERSOCKS_MODE` | Optional default: `non-tee` or `tee` |

## Commands

```bash
node cybersocks.js status
node cybersocks.js audit --non-tee
node cybersocks.js audit --tee
node cybersocks.js audit --non-tee --telegram
node cybersocks.js audit --tee --telegram --quiet
node cybersocks.js audit --dry-run
node cybersocks.js collect --json out.json
node cybersocks.js cron --tee --hour 9
```

`node cch.js …` still works (shim → `cybersocks.js`).

## Layout

| Path | Role |
| --- | --- |
| `cybersocks.js` | CLI entry |
| `data/config.js` | `global.mode`, `global.opencode`, `global.nearai`, `global.telegram` |
| `libs/collect.js` | host sensors → audit data |
| `libs/analyst.js` | OpenCode / NEAR AI analysis |
| `libs/telegram.js` | Telegram send |
| `libs/logs.js` | terminal + Telegram HTML formatting |

## Telegram

Pass `--telegram` after a real audit (not `--dry-run`). Messages use HTML: bold headers, posture icons (🟢🟡🔴), sensor severity strip, mode badges.

## Pitch video (VHS)

```bash
vhs demo/pitch.tape
# → demo/cybersocks-pitch.mp4
# → demo/cybersocks-pitch.gif
```

Slides: SOC → LLM data exposure → TEE / uncensored → NEAR AI → cyberSOCks → live `audit --tee` → [github.com/foxreymann/cyberSOCks](https://github.com/foxreymann/cyberSOCks).
