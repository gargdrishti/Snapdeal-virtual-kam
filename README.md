# Snapdeal Virtual KAM: Mini AI Voice Agent

A browser-based voice agent ("Riya") that talks to a Snapdeal seller whose sales dropped, diagnoses the cause from data,
recommends actions, **takes the actions itself** (tasks / tickets / follow-up) and summarises the call.

## Run it 
Needs Node 18+ and **Chrome or Edge** (for browser speech recognition).

    npm install
    cp .env.example .env      # optional: add a key (see below)
    npm start                 # open http://localhost:3000

Choose a seller on the Live call page, allow the microphone, then start a seller-to-Riya or Riya-to-seller call.

## Brains (pick any; all optional)
| Key in .env | Brain |
|---|---|
| `GEMINI_API_KEY` | Gemini with function calling (free key from Google AI Studio) |
| `ANTHROPIC_API_KEY` | Claude with tool use |
| none | Offline demo brain: scripted state machine using the same tools. Also the automatic fallback if an LLM call fails mid-demo |

Optional: `ELEVENLABS_API_KEY` and API-eligible voice IDs (`ELEVENLABS_VOICE_ID_FEMALE` and `ELEVENLABS_VOICE_ID_MALE`; `ELEVENLABS_VOICE_ID` can be used as a shared fallback) for ElevenLabs speech. When a seller calls Riya, the demo begins with a seller-side opening in a voice matched to that seller's explicit demo voice-gender setting, followed by Riya's reply; when Riya calls a seller, Riya speaks first. Browser speech keeps the selected voice's natural pitch rather than artificially lowering it, and selects a voice matching the speaker and call language when the browser has one installed. If an ElevenLabs voice is unavailable to the API plan, the app falls back to browser speech synthesis.

## Pages
- `command.html` Command centre: KPIs, call queue (Riya calls / Follow up / Plan), leakage by cause, growing sellers, live quality checks
- `call.html` Live call: choose any seller in the portfolio, then start a two-way voice demo with Riya; seller selection carries through to the call receipt and Call history
- `planner.html` What-if planner: per-seller levers (only causes that seller has) + Year-End Sale; "Put this plan in motion" logs the actions
- `history.html` Call history: every call with actions, seller quote, guardrails, transcript; Open report, Download, Export CSV
- `index.html` (start page) Seller-health dashboard: search/filter queue, seller plan, leakage chart, 6-month trend
- Data: `/api/portfolio`, `/api/calls` (stored in `data/calls.json`), `/api/quality`. Rakesh has detailed demo metrics and product-level tools; other portfolio sellers use clearly identified mock estimates, without invented SKU-level or post-call results.

## Features
- **Fast-forward 48 hours:** after the first call schedules a follow-up, a button jumps to day 3. Riya calls back, reviews each promise against measured progress (restock, cancellations, orders/day), names what is still pending, agrees next steps and sets the next check-in
- **Evidence for every claim:** price benchmark tool rules out pricing; sale-event tool ties the third recommendation to a real event
- **Frustration detection + human handoff:** say "this is useless, I want a human" and Riya empathises, hands over with full context and a 30-minute callback
- **Latency badge and call stats** in the UI
- **Call receipt UI:** a thermal-paper receipt prints line by line as the agent checks data and takes actions, ending with a follow-up stamp. Voice orb reacts to your real mic, plus a call-journey tracker (Greet to Summarise)
- Two-way voice: streaming speech recognition, spoken replies, optional barge-in (interrupt, use headphones), mic toggle, typed fallback
- Two call modes: seller calls in, or the KAM calls the seller proactively
- English and Hindi across the UI and live call (hi-IN)
- Tool-calling agent: `get_seller_metrics`, `get_oos_products`, `get_cancellation_breakdown`, `get_visibility_metrics`, `get_price_benchmark`, `get_upcoming_events`, `estimate_impact`, `get_followup_status`, then actions `create_restock_task`, `raise_ticket`, `schedule_followup`, `send_summary`, `escalate_to_human`
- Rupee impact estimate (stock-outs vs cancellations vs visibility) shown live next to the call
- Live "agent activity" and "actions taken" panels so the reasoning is visible in a screen recording

## Layout
    server.js        Express server, sessions, /api/chat, optional /api/tts
    lib/data.js      mock seller data (+ marked assumptions)
    lib/tools.js     tool schemas and implementations, impact model
    lib/prompt.js    system prompt (persona, voice rules, call playbook)
    lib/llm.js       Gemini / Anthropic tool-calling loops + fallback
    lib/offline.js   offline conversation brain (EN + HI)
    public/          browser voice client (Web Speech API)

See NOTE.md (submission note) and DEMO_SCRIPT.md (1-2 min screen recording).
