import express from "express";
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { agentTurn, provider, selfTest } from "./lib/llm.js";
import { computeImpact } from "./lib/tools.js";
import { seller } from "./lib/data.js";
import { portfolio, sellerProfile } from "./lib/portfolio.js";
import { listCalls, addCall, qualityChecks } from "./lib/extra.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// tiny .env loader (no extra dependency)
const envPath = path.join(__dirname, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function elevenLabsVoiceId(gender = "female") {
  return gender === "male"
    ? process.env.ELEVENLABS_VOICE_ID_MALE || process.env.ELEVENLABS_VOICE_ID || ""
    : process.env.ELEVENLABS_VOICE_ID_FEMALE || process.env.ELEVENLABS_VOICE_ID || "";
}
const unavailableElevenLabsVoices = new Set();
const hasElevenLabsVoice = (gender = "female") => {
  const voice = elevenLabsVoiceId(gender);
  return !!process.env.ELEVENLABS_API_KEY && !!voice && !unavailableElevenLabsVoices.has(voice);
};

const sessions = new Map();
const getSession = (id) => {
  if (!sessions.has(id)) sessions.set(id, { history: [], actions: [] });
  return sessions.get(id);
};

app.get("/api/config", (req, res) => {
  const sellers = portfolio().sellers.map(({ id, name }) => ({ id, name }));
  const selectedSeller = sellerProfile(req.query.sellerId || seller.id);
  if (!selectedSeller) return res.status(404).json({ error: "seller_not_found" });
  res.json({
    brain: provider(),
    tts: hasElevenLabsVoice("female"),
    ttsMale: hasElevenLabsVoice("male"),
    seller: selectedSeller,
    sellers,
    impact: computeImpact(selectedSeller),
  });
});

// Seller-health dashboard data (11 mock sellers, root causes, recoverable rupees)
app.get("/api/portfolio", (_req, res) => res.json(portfolio()));

app.get("/api/quality", (_req, res) => res.json(qualityChecks()));
app.get("/api/calls", (_req, res) => res.json(listCalls()));
app.post("/api/calls", (req, res) => {
  const b = req.body || {}, sess = sessions.get(b.sessionId);
  const actions = b.actions || (sess?.actions || []).map((a) => ({ title: a.title || a.type || a.name || "Action", ref: a.ref || a.id || "", detail: a.detail || a.summary || "" }));
  res.json(addCall({ ...b, actions }));
});

const START_PROMPTS = {
  seller_call: "[SYSTEM: The seller has just dialled in to the Virtual KAM. Greet them briefly by name as Riya from Snapdeal and ask how you can help. Do not quote data yet.]",
  followup: "[SYSTEM: 48 hours have passed. You are placing the FOLLOW-UP call you promised the seller. Call get_followup_status first, then open by reviewing real progress against your promises and ask how the pending items stand. Keep it to 2-3 sentences.]",
  proactive: "[SYSTEM: You are placing a PROACTIVE outbound call. First call get_seller_metrics, then accurately summarize whether this seller's sales increased, declined, or stayed steady, and ask if they have five minutes to review the account. Do not diagnose yet.]",
};

app.post("/api/chat", async (req, res) => {
  try {
    const { text, start, sellerId } = req.body || {};
    const requestedSessionId = req.body?.sessionId;
    const sessionId = typeof requestedSessionId === "string" && requestedSessionId.trim()
      ? requestedSessionId
      : randomUUID();
    const lang = req.body?.lang === "hi" ? "hi" : "en";
    const session = getSession(sessionId);
    if (sellerId) {
      const selectedSeller = sellerProfile(sellerId);
      if (!selectedSeller) return res.status(400).json({ error: "seller_not_found" });
      if (session.seller && session.seller.id !== selectedSeller.id) return res.status(409).json({ error: "seller_changed" });
      session.seller = selectedSeller;
    }
    if (start && start !== "followup") { session.history = []; session.actions = []; session.brain = null; }
    const userText = start ? START_PROMPTS[start] || START_PROMPTS.seller_call : String(text || "").slice(0, 1000);
    if (!userText) return res.status(400).json({ error: "empty" });
    const out = await agentTurn(session, userText, lang, { start });
    res.json({ sessionId, reply: out.reply, toolCalls: out.toolCalls, actions: session.actions, mode: out.mode, ms: out.ms });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Optional higher-quality voice (ElevenLabs). Browser falls back to built-in speech if unavailable.
app.post("/api/tts", async (req, res) => {
  if (!process.env.ELEVENLABS_API_KEY) return res.status(501).end();
  const voice = elevenLabsVoiceId(req.body?.gender);
  if (!voice || unavailableElevenLabsVoices.has(voice)) return res.status(501).end();
  try {
    const languageCode = req.body?.lang === "hi" ? "hi" : "en";
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text: String(req.body.text || "").slice(0, 800), model_id: "eleven_multilingual_v2", language_code: languageCode, voice_settings: { stability: 0.45, similarity_boost: 0.8 } }),
    });
    if (!r.ok) {
      if (r.status === 402) {
        unavailableElevenLabsVoices.add(voice);
        console.warn("ElevenLabs voice is not available on this API plan; falling back to browser speech. Configure an API-eligible voice ID to enable ElevenLabs.");
      }
      else console.error("ElevenLabs TTS failed:", r.status);
      return res.status(502).end();
    }
    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch { res.status(502).end(); }
});

const port = process.env.PORT || 3000;
app.listen(port, () => { console.log(`Virtual KAM running: http://localhost:${port}  (brain: ${provider()})`); selfTest(); });