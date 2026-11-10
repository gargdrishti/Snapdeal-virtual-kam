import { TOOLS, runTool } from "./tools.js";
import { systemPrompt } from "./prompt.js";
import { offlineTurn } from "./offline.js";

const MAX_STEPS = 6;
let workingModel = null;

function isReplyInLanguage(reply, lang) {
  const devanagari = (reply.match(/[\u0900-\u097f]/g) || []).length;
  if (lang !== "hi") return devanagari === 0;
  const letters = (reply.match(/\p{L}/gu) || []).length;
  return devanagari > 0 && devanagari / Math.max(letters, 1) >= 0.35;
}

async function repairReply(reply, userText, lang) {
  const rule = lang === "hi"
    ? "Rewrite the draft as natural, concise spoken Hindi written in Devanagari. Keep only common business terms in English. Do not use English sentences."
    : "Rewrite the draft as natural, concise spoken English. Do not use Hindi or Devanagari.";
  const prompt = `Seller message: ${userText}\nDraft response: ${reply}\n\n${rule} Preserve the draft's facts and intent. Return only the corrected response.`;
  if (provider() === "gemini") {
    const candidates = [...new Set([workingModel, process.env.GEMINI_MODEL, "gemini-flash-latest"].filter(Boolean))];
    for (const model of candidates) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: `Follow this language rule exactly: ${rule}` }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
        }),
      });
      if (!res.ok) throw new Error(`Gemini language correction failed: ${res.status}`);
      const data = await res.json();
      const corrected = (data.candidates?.[0]?.content?.parts || []).map((part) => part.text || "").join(" ").trim();
      if (isReplyInLanguage(corrected, lang)) return corrected;
    }
  } else if (provider() === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
        max_tokens: 400,
        system: `Follow this language rule exactly: ${rule}`,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic language correction failed: ${res.status}`);
    const data = await res.json();
    const corrected = data.content.filter((part) => part.type === "text").map((part) => part.text).join(" ").trim();
    if (isReplyInLanguage(corrected, lang)) return corrected;
  }
  throw new Error(`Could not produce a reply in the selected ${lang === "hi" ? "Hindi" : "English"} language`);
}

export function provider() {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "offline";
}

// ---- Gemini (function calling via REST) ----
async function geminiTurn(session, lang) {
  // Try the configured model first; if Google says it is gone/unknown, fall back to the "latest flash" alias.
  const candidates = [...new Set([workingModel, process.env.GEMINI_MODEL, "gemini-3.8-flash", "gemini-flash-latest", "gemini-flash-lite-latest"].filter(Boolean))];
  let model = candidates[0];
  const urlFor = (m) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;
  const contents = session.history.map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.text }] }));
  const toolCalls = [];
  for (let i = 0; i < MAX_STEPS; i++) {
    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt(lang, session.seller) }] },
      contents,
      tools: [{ functionDeclarations: TOOLS.map((t) => (Object.keys(t.parameters.properties).length ? t : { name: t.name, description: t.description })) }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
    });
    // 404 = model gone, 429 = rate limit, 500/503 = Google overloaded. Try the next model, then retry the list once after a short pause.
    let res;
    outer: for (let round = 0; round < 2; round++) {
      for (const m of candidates) {
        model = m;
        res = await fetch(urlFor(m), { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY }, body: payload });
        if (res.ok || ![404, 429, 500, 503].includes(res.status)) break outer;
        console.warn(`Gemini model "${m}" returned ${res.status}, trying next...`);
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
    if (!res.ok) throw new Error(`Gemini ${res.status} (model ${model}): ${(await res.text()).slice(0, 200)}`);
    workingModel = model;
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const calls = parts.filter((p) => p.functionCall);
    if (!calls.length) return { reply: parts.map((p) => p.text || "").join(" ").trim(), toolCalls };
    contents.push({ role: "model", parts });
    const responses = calls.map((c) => {
      const result = runTool(c.functionCall.name, c.functionCall.args || {}, session);
      toolCalls.push({ name: c.functionCall.name, args: c.functionCall.args || {}, result });
      return { functionResponse: { name: c.functionCall.name, response: { result } } };
    });
    contents.push({ role: "user", parts: responses });
  }
  return { reply: "Sorry, could you say that once more?", toolCalls };
}

// ---- Anthropic (tool use via REST) ----
async function anthropicTurn(session, lang) {
  const messages = session.history.map((h) => ({ role: h.role, content: h.text }));
  const toolCalls = [];
  for (let i = 0; i < MAX_STEPS; i++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
        max_tokens: 400,
        system: systemPrompt(lang, session.seller),
        messages,
        tools: TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters })),
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const uses = data.content.filter((b) => b.type === "tool_use");
    if (!uses.length) return { reply: data.content.filter((b) => b.type === "text").map((b) => b.text).join(" ").trim(), toolCalls };
    messages.push({ role: "assistant", content: data.content });
    messages.push({
      role: "user",
      content: uses.map((u) => {
        const result = runTool(u.name, u.input || {}, session);
        toolCalls.push({ name: u.name, args: u.input || {}, result });
        return { type: "tool_result", tool_use_id: u.id, content: JSON.stringify(result) };
      }),
    });
  }
  return { reply: "Sorry, could you say that once more?", toolCalls };
}

// Runs one agent turn. Falls back to the offline brain if the LLM call fails, so the demo never dies.
export async function agentTurn(session, userText, lang, meta = {}) {
  session.history.push({ role: "user", text: userText });
  const started = Date.now();
  const p = provider();
  let out, mode = p;
  try {
    if (p === "gemini") out = await geminiTurn(session, lang);
    else if (p === "anthropic") out = await anthropicTurn(session, lang);
    else out = offlineTurn(session, userText, lang, meta);
  } catch (e) {
    console.error("LLM error, using offline brain:", e.message);
    out = offlineTurn(session, userText, lang, meta);
    mode = "offline-fallback";
  }
  
  if (!isReplyInLanguage(out.reply, lang)) {
  console.warn(`Reply did not match selected language (${lang}); requesting a correction.`);

  try {
    const corrected = await repairReply(out.reply, userText, lang);

    if (corrected) {
      out.reply = corrected;
    }
  } catch (error) {
    console.warn("Language correction failed; retaining original reply:", error.message);
  }
}
  session.history.push({ role: "assistant", text: out.reply });
  return { ...out, mode, ms: Date.now() - started };
}


// Startup self-test: prints a plain-English diagnosis so problems are obvious in the terminal.
export async function selfTest() {
  const p = provider();
  if (p === "offline") return console.log("[check] No LLM key set: running in offline demo mode.");
  if (p !== "gemini") return console.log(`[check] Brain: ${p}`);
  const t = { history: [{ role: "user", text: "Reply with the single word OK." }], actions: [] };
  try {
    const out = await geminiTurn(t, "en");
    console.log(`[check] Gemini OK (model: ${workingModel}). Reply: ${out.reply.slice(0, 40)}`);
  } catch (e) {
    const m = String(e.message);
    let why = "Unknown. Read the message above.";
    if (/fetch failed|ENOTFOUND|ETIMEDOUT|ECONNRESET|EAI_AGAIN/i.test(m + (e.cause?.code || ""))) why = "This computer cannot reach Google. Check internet / VPN / proxy / firewall, or try a phone hotspot.";
    else if (!/503|UNAVAILABLE/i.test(m) && /API key|400|403|PERMISSION|UNAUTHENTICATED/i.test(m)) why = "The API key looks invalid. Create a new one at aistudio.google.com/apikey, paste it in .env with no spaces or quotes, restart.";
    else if (/429|quota|RESOURCE_EXHAUSTED/i.test(m)) why = "Free quota used up. Wait a minute and retry.";
    else if (/503|UNAVAILABLE|high demand/i.test(m)) why = "Google is overloaded right now (temporary). Wait a minute and restart; the app already retries other models.";
    else if (/404/.test(m)) why = "No Gemini model available. Set GEMINI_MODEL to a current Flash model from ai.google.dev/gemini-api/docs/models.";
    console.error(`[check] Gemini FAILED: ${m.slice(0, 220)}\n[check] Likely cause: ${why}`);
  }
}