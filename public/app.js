// const $ = (id) => document.getElementById(id);
// const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
// const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
// const LANGS = { en: "en-IN", hi: "hi-IN" };
// let cfg = null, lang = localStorage.getItem("kamLang") || "en", sessionId = null;
// let inCall = false, busy = false, speaking = false, micOn = true, rec = null, recActive = false;
// let timerId = null, t0 = 0, curAudio = null, speakId = 0, orbState = "idle";
// let seen = new Set(), callMode = "seller_call", followupReady = false, turns = 0, toolCount = 0;

// const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// /* =============== dossier =============== */
// function countUp(el, to, fmt, ms = 1100) {
//   if (REDUCED) { el.textContent = fmt(to); return; }
//   const s = performance.now();
//   const f = (t) => { const p = Math.min(1, (t - s) / ms), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(f); };
//   requestAnimationFrame(f);
// }
// function renderDossier() {
//   const { last: L, now: N } = cfg.seller;
//   $("sellerId").textContent = cfg.seller.id;
//   $("sellerBiz").textContent = cfg.seller.business;
//   $("sellerCat").textContent = cfg.seller.category;
//   $("rcMeta").textContent = `${cfg.seller.business} · ${cfg.seller.id}`;
//   countUp($("bigSales"), N.sales, inr);
//   $("bigDelta").textContent = `${inr(L.sales - N.sales)} lower than last month (${Math.round(((N.sales - L.sales) / L.sales) * 100)}%)`;
//   const rows = [
//     ["Orders", L.orders, N.orders, String, "lower"],
//     ["Cancellation rate", L.cancellationRate, N.cancellationRate, (v) => v + "%", "higher"],
//     ["Average selling price", L.asp, N.asp, inr, "flat"],
//     ["Products out of stock", L.outOfStock, N.outOfStock, String, "higher"],
//   ];
//   $("metrics").innerHTML = rows.map(([label, a, b, fmt, kind]) => {
//     const ch = Math.round(((b - a) / a) * 100), max = Math.max(a, b);
//     const flat = kind === "flat";
//     return `<li><div class="m-row"><span class="m-label">${label}</span><span class="m-delta ${flat ? "flat" : "bad"}">${flat ? "No change" : (ch > 0 ? "+" : "") + ch + "%"}</span></div>
//       <div class="m-vals"><span class="now">${fmt(b)}</span><span class="was">${fmt(a)}</span></div>
//       <div class="m-bars"><i class="a" style="width:0" data-w="${(a / max) * 100}"></i><i class="b ${flat ? "ok" : ""}" style="width:0" data-w="${(b / max) * 100}"></i></div></li>`;
//   }).join("");
//   setTimeout(() => document.querySelectorAll(".m-bars i").forEach((i) => (i.style.width = i.dataset.w + "%")), 150);
// }

// /* =============== hero copy =============== */
// function renderHero() {
//   const d = cfg.seller.last.sales - cfg.seller.now.sales;
//   document.querySelector(".hero h1").textContent = `${cfg.seller.name}’s sales are down ${inr(d)} this month.`;
//   document.querySelector(".fine").textContent = "Mock data for this assignment. Visibility figures, cancellation reasons and the product list are my assumptions.";
// }

// /* =============== orb (voice visual) =============== */
// const cv = $("orb"), ctx = cv.getContext("2d");
// let audioCtx = null, analyser = null, freq = null, micStream = null;
// const N_BARS = 96, amps = new Float32Array(N_BARS);
// function sizeCanvas() { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); cv.width = r.width * d; cv.height = r.height * d; }
// addEventListener("resize", sizeCanvas);
// const COLORS = { idle: [159, 161, 204], listening: [255, 181, 71], thinking: [159, 161, 204], speaking: [228, 0, 70] };
// function drawOrb(ts) {
//   requestAnimationFrame(drawOrb);
//   if (!cv.width) sizeCanvas();
//   const w = cv.width, cx = w / 2, base = w * 0.265, k = REDUCED ? 0.3 : 1;
//   ctx.clearRect(0, 0, w, w);
//   if (orbState === "listening" && analyser) analyser.getByteFrequencyData(freq);
//   const [r, g, b] = COLORS[orbState];
//   const spin = (ts / 2200) % (Math.PI * 2);
//   for (let i = 0; i < N_BARS; i++) {
//     const m = i < N_BARS / 2 ? i : N_BARS - i; let target;
//     if (orbState === "speaking") target = (0.18 + 0.82 * Math.abs(Math.sin(ts / 170 + m * 0.42) * Math.sin(ts / 430 + m * 0.13))) * (0.65 + 0.35 * Math.sin(ts / 260));
//     else if (orbState === "listening") target = analyser ? Math.pow(freq[Math.floor(m * 1.1) + 2] / 255, 1.3) * 1.15 : 0.1 + 0.08 * Math.sin(ts / 300 + m * 0.5);
//     else if (orbState === "thinking") { const a = (i / N_BARS) * Math.PI * 2, d = Math.cos(a - spin * 2.2); target = 0.06 + (d > 0.85 ? (d - 0.85) * 5 : 0); }
//     else target = 0.07 + 0.05 * Math.sin(ts / 900 + m * 0.25);
//     amps[i] += (target * k - amps[i]) * 0.28;
//     const a = (i / N_BARS) * Math.PI * 2 - Math.PI / 2, len = w * 0.03 + amps[i] * w * 0.2;
//     ctx.strokeStyle = `rgba(${r},${g},${b},${0.45 + Math.min(.55, amps[i])})`;
//     ctx.lineWidth = w * 0.0105; ctx.lineCap = "round";
//     ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * base * 1.12, cx + Math.sin(a) * base * 1.12); ctx.lineTo(cx + Math.cos(a) * (base * 1.12 + len), cx + Math.sin(a) * (base * 1.12 + len)); ctx.stroke();
//   }
//   const grad = ctx.createRadialGradient(cx * 0.9, cx * 0.85, base * 0.1, cx, cx, base * 1.05);
//   grad.addColorStop(0, `rgba(${r},${g},${b},.95)`); grad.addColorStop(1, `rgba(${r * .45 | 0},${g * .45 | 0},${b * .45 | 0},.95)`);
//   ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cx, base * (1 + (orbState === "idle" ? 0.012 * Math.sin(ts / 700) : 0)), 0, 7); ctx.fill();
// }
// requestAnimationFrame(drawOrb);

// const STATE_TEXT = { idle: "", listening: "Listening. Speak when you’re ready.", thinking: "Checking your account…", speaking: "Riya is speaking" };
// function setOrb(state, text) {
//   orbState = state; $("stateText").textContent = text || STATE_TEXT[state];
//   $("orbWord").textContent = state === "listening" ? "You" : state === "thinking" ? "…" : "Riya";
// }
// async function initMic() {
//   if (analyser) return;
//   try {
//     micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
//     audioCtx = new (window.AudioContext || window.webkitAudioContext)();
//     analyser = audioCtx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.7;
//     audioCtx.createMediaStreamSource(micStream).connect(analyser); freq = new Uint8Array(analyser.frequencyBinCount);
//   } catch { analyser = null; }
// }

// /* =============== caption + transcript =============== */
// let capTimers = [];
// function showCaption(text, ms) {
//   capTimers.forEach(clearTimeout); capTimers = [];
//   const words = text.split(/\s+/);
//   $("caption").innerHTML = words.map((w) => `<span class="w">${w.replace(/</g, "&lt;")}</span>`).join(" ");
//   const spans = [...$("caption").children], step = ms / words.length;
//   spans.forEach((s, i) => capTimers.push(setTimeout(() => s.classList.add("on"), REDUCED ? 0 : i * step)));
// }
// function finishCaption() { capTimers.forEach(clearTimeout); document.querySelectorAll("#caption .w").forEach((s) => s.classList.add("on")); }
// function logLine(cls, text) { const p = document.createElement("p"); p.className = cls; p.textContent = (cls === "b" ? "Riya: " : "You: ") + text; $("transcript").append(p); $("transcript").scrollTop = 1e9; }

// /* =============== journey =============== */
// const STEPS_MAIN = ["Greet", "Diagnose", "Investigate", "Quantify", "Recommend", "Act", "Summarise"];
// const STEPS_FU = ["Reconnect", "Review progress", "Find gaps", "Agree next steps", "Close the loop"];
// let STEPS = STEPS_MAIN, reached = -1;
// function renderJourney() { $("journey").innerHTML = STEPS.map((s, i) => `<li class="${i < reached ? "done" : i === reached ? "now" : ""}">${s}</li>`).join(""); }
// function reach(i) { if (i > reached) { reached = i; renderJourney(); } }
// const STEP_OF_FU = { get_followup_status: 1, get_upcoming_events: 2, create_restock_task: 3, schedule_followup: 3, send_summary: 4 };
// const STEP_OF_MAIN = { get_price_benchmark: 1, get_seller_metrics: 1, get_oos_products: 2, get_cancellation_breakdown: 2, get_visibility_metrics: 2, get_upcoming_events: 3, estimate_impact: 4, create_restock_task: 5, raise_ticket: 5, schedule_followup: 5, escalate_to_human: 5, send_summary: 6 };

// /* =============== receipt =============== */
// const FRIENDLY = { get_price_benchmark: "Compared your prices with the market", get_upcoming_events: "Checked upcoming sale events", get_followup_status: "Checked progress since the last call", get_seller_metrics: "Checked sales and orders", get_oos_products: "Checked stock levels", get_cancellation_breakdown: "Checked cancellations", get_visibility_metrics: "Checked search visibility", estimate_impact: "Worked out what each cause cost you" };
// function show(id) { $(id).classList.remove("hidden"); $("rcEmpty").classList.add("hidden"); }
// function line(into, secId, html, cls = "") { show(secId); const d = document.createElement("div"); d.className = "ln " + cls; d.innerHTML = html; $(into).append(d); const col = document.querySelector(".receipt-col"); col.scrollTo({ top: col.scrollHeight, behavior: REDUCED ? "auto" : "smooth" }); }
// const row = (t, v, cls = "") => `<span class="t">${t}</span><span class="dots"></span><span class="v">${v}</span>`;

// function setStamp(a, b) { const s = $("stamp"); s.innerHTML = `<span>${a}</span><b>${b}</b>`; s.classList.remove("hidden"); s.style.animation = "none"; void s.offsetWidth; s.style.animation = ""; }
// function chip(text, act) { const li = document.createElement("li"); li.textContent = text; if (act) li.className = "act"; $("checks").prepend(li); while ($("checks").children.length > 4) $("checks").lastChild.remove(); }

// function onTool(c) {
//   toolCount++;
//   reach(((callMode === "followup" ? STEP_OF_FU : STEP_OF_MAIN)[c.name]) ?? reached);
//   if (c.name === "estimate_impact") reach(4);
//   const key = callMode + c.name + (c.result?.id || "");
//   if (seen.has(key)) return; seen.add(key);
//   const r = c.result || {};
//   switch (c.name) {
//     case "get_seller_metrics":
//       line("linesFound", "secFound", row("Sales", `${inr(r.lastMonth.sales)} → ${inr(r.thisMonth.sales)}`), "bad");
//       line("linesFound", "secFound", row("Avg price", "flat " + inr(r.thisMonth.asp)), "ok");
//       line("linesFound", "secFound", "Price is not the problem", "sub"); break;
//     case "get_price_benchmark":
//       line("linesFound", "secFound", row("Your prices vs market", `${r.avgGapPct}%`), "ok");
//       line("linesFound", "secFound", "In line with category median", "sub"); break;
//     case "get_upcoming_events":
//       if (callMode === "followup") break;
//       line("linesFound", "secFound", row("Next sale event", `${r.events[0].name}, ${r.events[0].startsInDays}d`), "ok"); break;
//     case "get_followup_status":
//       line("linesFollow", "secFollow", row("Back in stock", `${r.restock.backInStock.length} of ${r.restock.backInStock.length + r.restock.stillPending.length} SKUs`), "ok");
//       line("linesFollow", "secFollow", row("Cancellations", `14% → ${r.cancellationRateLast48h}%`), "ok");
//       line("linesFollow", "secFollow", row("Orders per day", `${r.ordersPerDay.before} → ${r.ordersPerDay.now}`), "ok");
//       line("linesFollow", "secFollow", row("Earning back", `${inr(r.recoveredRupeesPerDay)}/day`), "total");
//       if (r.restock.stillPending.length) line("linesFollow", "secFollow", `${r.restock.stillPending.length} SKUs still waiting on supplier`, "sub");
//       $("bigDelta").textContent = `Recovering: ${inr(r.recoveredRupeesPerDay)} a day back`; $("bigDelta").style.color = "var(--mint)"; break;
//     case "get_oos_products":
//       line("linesFound", "secFound", row("Out of stock", `${r.totalOutOfStock - r.newlyOutOfStock} → ${r.totalOutOfStock}`), "bad");
//       line("linesFound", "secFound", r.share || "", "sub"); break;
//     case "get_cancellation_breakdown":
//       line("linesFound", "secFound", row("Cancellations", `${r.last.total} → ${r.now.total}`), "bad");
//       line("linesFound", "secFound", `${r.now.reasons["Stock unavailable (seller)"]} of ${r.now.total} were because stock was not available`, "sub"); break;
//     case "get_visibility_metrics":
//       line("linesFound", "secFound", row("Search impressions", `${r.impressionsChangePct}%`), "bad");
//       line("linesFound", "secFound", "Clicks per view are steady, fewer people see you", "sub"); break;
//     case "estimate_impact": {
//       r.causes.forEach((x) => line("linesImpact", "secImpact", row(x.cause.replace(/ \(.*?\)/, ""), inr(x.rupees)), "bad"));
//       line("linesImpact", "secImpact", row("Total drop", inr(r.totalDropRupees)), "total"); break;
//     }
//     case "create_restock_task": case "raise_ticket": case "schedule_followup": case "send_summary": case "escalate_to_human":
//       line(callMode === "followup" ? "linesFollow" : "linesDone", callMode === "followup" ? "secFollow" : "secDone", `<b>${r.type}</b> <span class="id">${r.id}</span><small>${r.detail}</small>`, "act");
//       if (c.name === "schedule_followup") {
//         setStamp(callMode === "followup" ? "Next check" : "Follow-up set", callMode === "followup" ? "7 days" : "48 hours");
//         if (callMode !== "followup") { followupReady = true; $("btnFFdock").classList.remove("hidden"); }
//       }
//       if (c.name === "escalate_to_human") setStamp("Handed to human", "30 min");
//       if (c.name === "send_summary") { show("rcFoot"); $("rcFoot").classList.remove("hidden"); }
//       break;
//   }
//   chip(FRIENDLY[c.name] || r.type || c.name, !FRIENDLY[c.name]);
// }

// /* =============== speech output =============== */
// function stopSpeaking() { speechSynthesis.cancel(); if (curAudio) { curAudio.pause(); curAudio = null; } }
// async function speak(text) {
//   const my = ++speakId; speaking = true; setOrb("speaking");
//   const est = Math.max(2500, text.split(/\s+/).length * 330);
//   showCaption(text, est);
//   if (!$("barge").checked) stopListening();
//   try {
//     if (cfg.tts) {
//       try {
//         const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
//         if (r.ok) { const url = URL.createObjectURL(await r.blob()); await new Promise((res) => { curAudio = new Audio(url); curAudio.onended = curAudio.onerror = res; curAudio.play().catch(res); }); return; }
//       } catch {}
//     }
//     await new Promise((resolve) => {
//       const l = LANGS[lang], voices = speechSynthesis.getVoices();
//       const voice = voices.find((v) => v.lang === l) || voices.find((v) => v.lang.startsWith(l.slice(0, 2)));
//       const parts = text.match(/[^.!?।]+[.!?।]?/g) || [text]; let i = 0;
//       setTimeout(resolve, text.length * 110 + 4000); // watchdog: some browsers never fire onend
//       const next = () => {
//         if (my !== speakId || i >= parts.length) return resolve();
//         const u = new SpeechSynthesisUtterance(parts[i++].trim()); u.lang = l; if (voice) u.voice = voice; u.rate = 1.03; u.onend = next; u.onerror = () => resolve();
//         speechSynthesis.speak(u);
//       };
//       next();
//     });
//   } finally {
//     if (my === speakId) { speaking = false; finishCaption(); if (inCall) afterBot(); }
//   }
// }
// function afterBot() { if (!busy) { setOrb("listening", micOn ? undefined : "Mic is off. Type your reply."); startListening(); } }

// /* =============== speech input =============== */
// function startListening() {
//   if (!SR || !inCall || !micOn || recActive || busy || (speaking && !$("barge").checked)) return;
//   rec = new SR(); rec.lang = LANGS[lang]; rec.interimResults = true; rec.continuous = false;
//   let finalText = "";
//   rec.onstart = () => { recActive = true; };
//   rec.onresult = (e) => {
//     if (speaking && $("barge").checked) { speakId++; stopSpeaking(); speaking = false; finishCaption(); setOrb("listening"); }
//     let interim = "";
//     for (let i = e.resultIndex; i < e.results.length; i++) { const x = e.results[i]; if (x.isFinal) finalText += x[0].transcript; else interim += x[0].transcript; }
//     if (interim) { $("heard").className = "heard interim"; $("heard").textContent = interim; }
//   };
//   rec.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { micOn = false; setMic(); setOrb("idle", "Microphone blocked. Type your reply instead."); $("typer").classList.remove("hidden"); } };
//   rec.onend = () => { recActive = false; if (finalText.trim()) handleUser(finalText.trim()); else if (inCall && !busy && !speaking && micOn) setTimeout(startListening, 200); };
//   try { rec.start(); } catch {}
// }
// function stopListening() { if (rec && recActive) { rec.onend = null; try { rec.abort(); } catch {} recActive = false; } }
// function setMic() { $("btnMic").setAttribute("aria-pressed", micOn); $("micTxt").textContent = micOn ? "Mic on" : "Mic off"; }

// /* =============== conversation =============== */
// async function callApi(body) {
//   const t = performance.now();
//   const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, lang, ...body }) });
//   if (!r.ok) throw new Error("server " + r.status);
//   const d = await r.json(); sessionId = d.sessionId; turns++;
//   $("latency").textContent = `Reply in ${((performance.now() - t) / 1000).toFixed(1)}s · AI ${(d.ms / 1000).toFixed(1)}s`; $("latency").classList.remove("hidden"); try { localStorage.setItem("kamLatency", $("latency").textContent); } catch {}
//   return d;
// }
// async function applyReply(d) {
//   $("brainPill").textContent = brainLabel(d.mode); try { localStorage.setItem("kamBrain", $("brainPill").textContent); } catch {}
//   (d.toolCalls || []).forEach(onTool);
//   logLine("b", d.reply); busy = false; await speak(d.reply);
// }
// async function handleUser(text) {
//   if (!inCall || busy) return;
//   speakId++; stopSpeaking(); speaking = false; stopListening(); finishCaption();
//   $("heard").className = "heard"; $("heard").textContent = text; logLine("y", text);
//   busy = true; setOrb("thinking");
//   try { await applyReply(await callApi({ text })); }
//   catch { busy = false; setOrb("idle", "Connection problem. Say that again."); afterBot(); }
// }
// async function startCall(mode) {
//   if (inCall) return;
//   inCall = true; busy = true; micOn = true; setMic(); callMode = mode; reached = 0; turns = 0; toolCount = 0;
//   STEPS = mode === "followup" ? STEPS_FU : STEPS_MAIN; renderJourney();
//   $("timeJump").classList.toggle("hidden", mode !== "followup"); $("stats").classList.add("hidden"); $("btnFF").classList.add("hidden");
//   if (mode !== "followup") {
//     seen = new Set(); followupReady = false; $("btnFFdock").classList.add("hidden");
//     ["linesFound", "linesImpact", "linesDone", "linesFollow"].forEach((id) => ($(id).innerHTML = ""));
//     ["secFound", "secImpact", "secDone", "secFollow", "stamp", "rcFoot"].forEach((id) => $(id).classList.add("hidden")); $("rcEmpty").classList.remove("hidden");
//     $("bigDelta").style.color = ""; renderDossier();
//   } else { $("btnFFdock").classList.add("hidden"); }
//   $("transcript").innerHTML = ""; $("checks").innerHTML = ""; $("caption").textContent = ""; $("heard").textContent = "";
//   $("hero").classList.add("hidden"); ["live", "dock", "livePill"].forEach((id) => $(id).classList.remove("hidden"));
//   sizeCanvas(); t0 = Date.now(); tick(); timerId = setInterval(tick, 1000);
//   setOrb("thinking", mode === "proactive" ? "Riya is calling Rakesh…" : "Connecting to Riya…");
//   speechSynthesis.getVoices(); await initMic();
//   try { await applyReply(await callApi({ start: mode })); }
//   catch { busy = false; endCall(); alert("Could not reach the server. Is `npm start` running?"); }
// }
// function endCall() {
//   inCall = false; busy = false; speaking = false; speakId++; stopSpeaking(); stopListening(); clearInterval(timerId); finishCaption();
//   const secs = Math.floor((Date.now() - t0) / 1000);
//   $("stats").textContent = `Last call: ${Math.floor(secs / 60)}m ${secs % 60}s · ${turns} turns · ${toolCount} tool calls`; $("stats").classList.remove("hidden");
//   if (followupReady && callMode !== "followup") $("btnFF").classList.remove("hidden");
//   if (turns > 1) fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, sellerId: cfg?.seller?.id, type: callMode === "seller_call" ? "Seller called" : "Riya called", secs, mode: cfg?.brain || "offline", transcript: [...document.querySelectorAll("#transcript p")].map((p) => p.textContent), said: ([...document.querySelectorAll("#transcript p")].find((p) => p.className !== "b") || {}).textContent?.replace(/^You: /, "") || "" }) }).catch(() => {});
//   setOrb("idle", "Call ended"); $("dock").classList.add("hidden"); $("typer").classList.add("hidden"); $("livePill").classList.add("hidden");
//   $("hero").classList.remove("hidden"); $("live").classList.add("hidden");
//   document.querySelector(".hero .lede").textContent = "That call is saved on the receipt. Start another to run it again.";
// }
// function tick() { const s = Math.floor((Date.now() - t0) / 1000); $("timer").textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
// const brainLabel = (m) => ({ gemini: "Gemini + tools", anthropic: "Claude + tools", offline: "Offline demo brain", "offline-fallback": "Offline (LLM unreachable)" }[m] || m) + (cfg?.tts ? " · ElevenLabs voice" : " · browser voice");

// /* =============== wiring =============== */
// $("btnProactive").onclick = () => startCall("proactive");
// $("btnCall").onclick = () => startCall("seller_call");
// $("btnEnd").onclick = endCall;
// const startFollowup = () => { if (inCall) endCall(); startCall("followup"); };
// $("btnFF").onclick = startFollowup; $("btnFFdock").onclick = startFollowup;
// $("btnMic").onclick = () => { micOn = !micOn; setMic(); if (micOn) afterBot(); else stopListening(); };
// $("btnKeys").onclick = () => { const o = $("typer").classList.toggle("hidden"); $("btnKeys").setAttribute("aria-expanded", !o); if (!o) $("typeInput").focus(); };
// $("typeForm").onsubmit = (e) => { e.preventDefault(); const v = $("typeInput").value.trim(); if (v && inCall) { $("typeInput").value = ""; handleUser(v); } };
// $("try").onclick = (e) => { const t = e.target.dataset?.t; if (t && inCall) handleUser(t); };
// for (const [id, l] of [["langEn", "en"], ["langHi", "hi"]]) $(id).onclick = () => { lang = l; try { localStorage.setItem("kamLang", l); } catch {} $("langEn").setAttribute("aria-pressed", l === "en"); $("langHi").setAttribute("aria-pressed", l === "hi"); document.documentElement.lang = l; stopListening(); if (inCall && !busy && !speaking) startListening(); };
// renderJourney();
// $("langEn").setAttribute("aria-pressed", lang === "en"); $("langHi").setAttribute("aria-pressed", lang === "hi");
// fetch("/api/config").then((r) => r.json()).then((c) => { cfg = c; $("brainPill").textContent = brainLabel(c.brain); renderDossier(); renderHero(); });
const $ = (id) => document.getElementById(id);
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const LANGS = { en: "en-IN", hi: "hi-IN" };
let cfg = null, lang = localStorage.getItem("kamLang") === "hi" ? "hi" : "en", sessionId = null;
let inCall = false, busy = false, speaking = false, micOn = true, rec = null, recActive = false;
let timerId = null, t0 = 0, curAudio = null, speakId = 0, orbState = "idle";
let seen = new Set(), callMode = "seller_call", followupReady = false, turns = 0, toolCount = 0;

const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

/* =============== Hindi UI (whole call page) =============== */
const HI = {
  "Virtual KAM": "वर्चुअल खाता प्रबंधक", "English": "अंग्रेज़ी", "Hindi": "हिन्दी", "Choose a seller": "विक्रेता चुनें", "Loading sellers…": "विक्रेता लोड हो रहे हैं…", "Fast-forward 48 hours": "48 घंटे आगे बढ़ाएँ",
  "Rakesh": "राकेश",
  "Hi Riya, my sales have dropped this month. Can you help me figure out why?": "नमस्ते रिया, इस महीने मेरी बिक्री कम हुई है। क्या आप वजह पता करने में मेरी मदद करेंगी?",
  "Riya, the Virtual KAM, works out why, fixes what she can, and calls back. Choose who starts the call.": "वर्चुअल खाता प्रबंधक रिया वजह ढूँढती है, जो हो सके ठीक करती है और वापस कॉल करती है। चुनें कि कॉल कौन शुरू करे।",
  "That call is saved on the receipt. Start another to run it again.": "वह कॉल रसीद में सहेज ली गई है। दोबारा चलाने के लिए नई कॉल शुरू करें।",
  "Sales this month": "इस महीने की बिक्री", "48 hours later": "48 घंटे बाद", "Mic on": "माइक चालू", "Mic off": "माइक बंद", "Skip to day 3": "तीसरे दिन पर जाएँ",
  "Type instead": "टाइप करें", "Let me interrupt": "बीच में बोलने दें", "End call": "कॉल खत्म करें", "Send": "भेजें", "Full transcript": "पूरा ट्रांसक्रिप्ट",
  "Say it with your keyboard…": "कीबोर्ड से लिखिए…",
  "Call receipt": "कॉल रसीद", "Nothing printed yet. The receipt fills in as Riya checks your numbers.": "अभी कुछ छपा नहीं है। रिया जैसे-जैसे आँकड़े देखती है, रसीद भरती जाती है।",
  "What I found": "मुझे क्या मिला", "Where the ₹65,000 went": "₹65,000 कहाँ गए", "What I did for you": "मैंने आपके लिए क्या किया", "Thank you for selling on Snapdeal": "स्नैपडील पर बेचने के लिए धन्यवाद",
  "Follow-up set": "फ़ॉलो-अप तय", "48 hours": "48 घंटे", "Next check": "अगली जाँच", "7 days": "7 दिन", "Handed to human": "वरिष्ठ टीम को सौंपा", "30 min": "30 मिनट",
  "Sales dropped": "बिक्री गिर गई", "Supplier delay": "सप्लायर की देरी", "Dispatch in 3 days": "3 दिन में डिस्पैच", "Nothing changed": "कुछ नहीं बदला", "Yes, set it up": "हाँ, कर दीजिए",
  "My sales have dropped significantly this month. I don't understand why. Can you help me?": "मेरी बिक्री इस महीने काफ़ी गिर गई है। मुझे समझ नहीं आ रहा कि क्यों। क्या आप मेरी मदद कर सकती हैं?",
  "My supplier has delayed the goods.": "मेरे सप्लायर ने माल देने में देरी की है।", "I usually dispatch in about 3 days.": "मैं आमतौर पर करीब 3 दिन में डिस्पैच करता हूँ।",
  "No, I haven't changed anything.": "नहीं, मैंने कुछ नहीं बदला।", "Yes, please go ahead and set that up.": "हाँ, कृपया यह सब सेट कर दीजिए।",
  "Rakesh Electronics & Home": "राकेश इलेक्ट्रॉनिक्स एंड होम", "Mobile accessories, electronics, home & kitchen": "मोबाइल एक्सेसरीज़, इलेक्ट्रॉनिक्स, होम और किचन",
  "Mock data for this assignment. Visibility figures, cancellation reasons and the product list are my assumptions.": "इस असाइनमेंट के लिए मॉक डेटा। विज़िबिलिटी के आँकड़े, कैंसलेशन के कारण और प्रोडक्ट सूची मेरी मान्यताएँ हैं।",
  "Orders": "ऑर्डर", "Cancellation rate": "कैंसलेशन दर", "Average selling price": "औसत बिक्री मूल्य", "Products out of stock": "स्टॉक खत्म प्रोडक्ट", "No change": "कोई बदलाव नहीं",
  "Connecting": "जोड़ रहे हैं", "Listening. Speak when you’re ready.": "सुन रही हूँ। तैयार हों तो बोलिए।", "Checking your account…": "आपका अकाउंट देख रही हूँ…", "Riya is speaking": "रिया बोल रही है",
  "Riya is calling Rakesh…": "रिया राकेश को कॉल कर रही है…", "Connecting to Riya…": "रिया से जोड़ रहे हैं…", "Connection problem. Say that again.": "कनेक्शन में दिक्कत। कृपया दोबारा बोलिए।", "Call ended": "कॉल खत्म हुई",
  "Mic is off. Type your reply.": "माइक बंद है। अपना जवाब टाइप करें।", "Microphone blocked. Type your reply instead.": "माइक्रोफ़ोन बंद है। अपना जवाब टाइप करें।",
  "Microphone blocked. Click the lock icon in the address bar, allow Microphone, then reload.": "माइक्रोफ़ोन बंद है। एड्रेस बार में लॉक आइकन दबाकर माइक्रोफ़ोन की अनुमति दें और पेज रीलोड करें।",
  "No microphone found. Plug one in or pick it in Windows/Mac sound settings. You can type instead.": "माइक्रोफ़ोन नहीं मिला। माइक लगाएँ या साउंड सेटिंग में चुनें। आप टाइप भी कर सकते हैं।",
  "Speech recognition needs internet (Chrome sends audio to Google). Check your connection, or type instead.": "आवाज़ पहचानने के लिए इंटरनेट चाहिए (Chrome आवाज़ Google को भेजता है)। कनेक्शन जाँचें या टाइप करें।",
  "I can't hear any sound. Check your microphone input in Windows sound settings, or type instead.": "कोई आवाज़ नहीं आ रही। साउंड सेटिंग में माइक इनपुट जाँचें या टाइप करें।",
  "Hearing you…": "सुन रही हूँ…", "You": "आप", "Riya": "रिया", "Rakesh is speaking": "राकेश बोल रहे हैं",
  "Greet": "अभिवादन", "Diagnose": "निदान", "Investigate": "जाँच", "Quantify": "नुकसान आँकना", "Recommend": "सुझाव", "Act": "कार्रवाई", "Summarise": "सारांश",
  "Reconnect": "दोबारा जुड़ना", "Review progress": "प्रगति देखना", "Find gaps": "कमियाँ ढूँढना", "Agree next steps": "अगले कदम तय करना", "Close the loop": "काम पूरा करना",
  "Compared your prices with the market": "आपकी कीमतों की बाज़ार से तुलना की", "Checked upcoming sale events": "आने वाले सेल इवेंट देखे", "Checked progress since the last call": "पिछली कॉल के बाद की प्रगति देखी",
  "Checked sales and orders": "बिक्री और ऑर्डर देखे", "Checked stock levels": "स्टॉक की स्थिति देखी", "Checked cancellations": "कैंसलेशन देखे", "Checked search visibility": "सर्च विज़िबिलिटी देखी", "Worked out what each cause cost you": "हर कारण से कितना नुकसान हुआ, आँका",
  "Sales": "बिक्री", "Avg price": "औसत कीमत", "flat": "स्थिर", "Price is not the problem": "कीमत समस्या नहीं है", "Your prices vs market": "आपकी कीमतें बनाम बाज़ार", "In line with category median": "श्रेणी के औसत के अनुरूप",
  "Next sale event": "अगला सेल इवेंट", "Back in stock": "स्टॉक में वापस", "Cancellations": "कैंसलेशन", "Orders per day": "प्रति दिन ऑर्डर", "Earning back": "वापस कमाई", "Out of stock": "स्टॉक खत्म",
  "Search impressions": "सर्च इम्प्रेशन", "Clicks per view are steady, fewer people see you": "क्लिक दर स्थिर है, पर कम लोग आपको देख रहे हैं", "Total drop": "कुल गिरावट",
  "Stock-outs": "स्टॉक खत्म होना", "Higher cancellations": "ज़्यादा कैंसलेशन", "Lower visibility / other demand": "कम विज़िबिलिटी / अन्य माँग",
  "Restock task": "स्टॉक भरने का काम", "Support ticket": "सहायता अनुरोध", "Follow-up call": "फ़ॉलो-अप कॉल", "Handed to human KAM": "वरिष्ठ खाता प्रबंधक को सौंपा", "Summary via whatsapp": "व्हाट्सऐप पर सारांश", "Summary via sms": "एसएमएस पर सारांश", "Summary via email": "ईमेल पर सारांश",
  "Reply in": "जवाब में", "Offline demo brain": "ऑफ़लाइन डेमो ब्रेन", "Offline (LLM unreachable)": "ऑफ़लाइन (AI से संपर्क नहीं)", "browser voice": "ब्राउज़र आवाज़", "ElevenLabs voice": "ElevenLabs आवाज़",
};
const L = (en, hi) => (lang === "hi" ? hi : en);
const tr = (s) => {
  if (lang !== "hi") return s;
  return HI[s] !== undefined ? HI[s] : window.translateHindi?.(s) || s;
};
// Translate the static page (call.html) in place; safe to run repeatedly and on language toggle.
function applyStatic() {
  const set = (sel, attr) => document.querySelectorAll(sel).forEach((el) => {
    if (attr) { el.dataset.enPh = el.dataset.enPh || el.getAttribute(attr); el.setAttribute(attr, tr(el.dataset.enPh)); return; }
    el.dataset.en = el.dataset.en || el.textContent.trim(); el.textContent = tr(el.dataset.en);
  });
  ["#btnProactive", "#btnCall", "#btnFF", "#btnFFdock", "#btnKeys", "#btnEnd", ".brand .role", ".hero .lede", ".big-label", "#timeJump", ".typer .btn", ".log-details summary", ".barge-txt",
   ".p-title", "#rcEmpty", "#secFound h4", "#secImpact h4", "#secDone h4", "#secFollow h4", "#rcFootTxt", ".ctl.toggle span"].forEach((sel) => set(sel));
  set("#typeInput", "placeholder");
  for (const [selector, value] of [[".seg", "Call language"], [".dossier", "Seller account"], [".stage", "Call"], [".journey", "Call progress"], [".receipt-col", "Call receipt"]]) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute("aria-label", tr(value));
  }
  $("langEn").textContent = tr("English");
  $("langHi").textContent = tr("Hindi");
  document.querySelector(".seller-picker span").textContent = tr("Choose a seller");
  document.title = lang === "hi" ? "रिया – स्नैपडील वर्चुअल अकाउंट मैनेजर" : "Riya – Snapdeal Virtual KAM";
  document.querySelectorAll("#try button").forEach((b) => { b.dataset.en = b.dataset.en || b.textContent.trim(); b.dataset.enT = b.dataset.enT || b.dataset.t; b.textContent = tr(b.dataset.en); b.dataset.t = tr(b.dataset.enT); });
  setMic(); document.documentElement.lang = lang === "hi" ? "hi" : "en";
  if (cfg) { renderDossier(); renderHero(); }
  renderJourney();
  if (!inCall) { $("stateText").textContent = ""; $("orbWord").textContent = tr("Riya"); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* =============== dossier =============== */
function countUp(el, to, fmt, ms = 1100) {
  if (REDUCED) { el.textContent = fmt(to); return; }
  const s = performance.now();
  const f = (t) => { const p = Math.min(1, (t - s) / ms), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
function renderDossier() {
  const { last: L_, now: N } = cfg.seller;
  $("sellerId").textContent = cfg.seller.id;
  $("sellerBiz").textContent = tr(cfg.seller.business);
  $("sellerCat").textContent = tr(cfg.seller.category);
  $("rcMeta").textContent = `${tr(cfg.seller.business)} · ${cfg.seller.id}`;
  countUp($("bigSales"), N.sales, inr);
  const salesChange = N.sales - L_.sales;
  const changePct = Math.abs(Math.round((salesChange / L_.sales) * 100));
  $("bigDelta").textContent = salesChange < 0
    ? L(`${inr(Math.abs(salesChange))} lower than last month (-${changePct}%)`, `पिछले महीने से ${inr(Math.abs(salesChange))} कम (-${changePct}%)`)
    : salesChange > 0
      ? L(`${inr(salesChange)} higher than last month (+${changePct}%)`, `पिछले महीने से ${inr(salesChange)} अधिक (+${changePct}%)`)
      : L("No change from last month", "पिछले महीने से कोई बदलाव नहीं");
  $("bigDelta").style.color = salesChange > 0 ? "var(--mint)" : "";
  const rows = [
    [tr("Orders"), L_.orders, N.orders, String, "lower"],
    [tr("Cancellation rate"), L_.cancellationRate, N.cancellationRate, (v) => v + "%", "higher"],
    [tr("Average selling price"), L_.asp, N.asp, inr, "flat"],
    [tr("Products out of stock"), L_.outOfStock, N.outOfStock, String, "higher"],
  ];
  $("metrics").innerHTML = rows.map(([label, a, b, fmt, kind]) => {
    const ch = Math.round(((b - a) / a) * 100), max = Math.max(a, b);
    const flat = kind === "flat";
    return `<li><div class="m-row"><span class="m-label">${label}</span><span class="m-delta ${flat ? "flat" : "bad"}">${flat ? tr("No change") : (ch > 0 ? "+" : "") + ch + "%"}</span></div>
      <div class="m-vals"><span class="now">${fmt(b)}</span><span class="was">${fmt(a)}</span></div>
      <div class="m-bars"><i class="a" style="width:0" data-w="${(a / max) * 100}"></i><i class="b ${flat ? "ok" : ""}" style="width:0" data-w="${(b / max) * 100}"></i></div></li>`;
  }).join("");
  setTimeout(() => document.querySelectorAll(".m-bars i").forEach((i) => (i.style.width = i.dataset.w + "%")), 150);
}

/* =============== hero copy =============== */
function renderHero() {
  const { name } = cfg.seller;
  const change = cfg.seller.last.sales - cfg.seller.now.sales;
  const amount = new Intl.NumberFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(change));
  const sellerName = tr(name);
  const headline = change > 0
    ? L(`${name}’s sales are down ${amount} this month.`, `${sellerName} की बिक्री इस महीने ${amount} कम हुई है।`)
    : change < 0
      ? L(`${name}’s sales are up ${amount} this month.`, `${sellerName} की बिक्री इस महीने ${amount} बढ़ी है।`)
      : L(`${name}’s sales are unchanged this month.`, `${sellerName} की बिक्री इस महीने में नहीं बदली है।`);
  document.querySelector(".hero h1").textContent = headline;
  $("btnProactive").textContent = lang === "hi" ? `रिया ${sellerName} को कॉल करती है` : `Riya calls ${name}`;
  $("btnCall").textContent = lang === "hi" ? `${sellerName} रिया को कॉल करते हैं` : `${name} calls Riya`;
  const selector = $("sellerSelect");
  if (selector) {
    const selectedId = new URLSearchParams(location.search).get("seller") || cfg.seller.id;
    selector.replaceChildren(...cfg.sellers.map((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.name;
      return option;
    }));
    selector.value = selectedId;
    selector.disabled = false;
  }
  document.querySelector(".fine").textContent = tr("Mock data for this assignment. Visibility figures, cancellation reasons and the product list are my assumptions.");
}

/* =============== orb (voice visual) =============== */
const cv = $("orb"), ctx = cv.getContext("2d");
let audioCtx = null, analyser = null, freq = null, micStream = null;
const N_BARS = 96, amps = new Float32Array(N_BARS);
function sizeCanvas() { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); cv.width = r.width * d; cv.height = r.height * d; }
addEventListener("resize", sizeCanvas);
const COLORS = { idle: [159, 161, 204], listening: [255, 181, 71], thinking: [159, 161, 204], speaking: [228, 0, 70] };
function drawOrb(ts) {
  requestAnimationFrame(drawOrb);
  if (!cv.width) sizeCanvas();
  const w = cv.width, cx = w / 2, base = w * 0.265, k = REDUCED ? 0.3 : 1;
  ctx.clearRect(0, 0, w, w);
  if (orbState === "listening" && analyser) analyser.getByteFrequencyData(freq);
  const [r, g, b] = COLORS[orbState];
  const spin = (ts / 2200) % (Math.PI * 2);
  for (let i = 0; i < N_BARS; i++) {
    const m = i < N_BARS / 2 ? i : N_BARS - i; let target;
    if (orbState === "speaking") target = (0.18 + 0.82 * Math.abs(Math.sin(ts / 170 + m * 0.42) * Math.sin(ts / 430 + m * 0.13))) * (0.65 + 0.35 * Math.sin(ts / 260));
    else if (orbState === "listening") target = analyser ? Math.pow(freq[Math.floor(m * 1.1) + 2] / 255, 1.3) * 1.15 : 0.1 + 0.08 * Math.sin(ts / 300 + m * 0.5);
    else if (orbState === "thinking") { const a = (i / N_BARS) * Math.PI * 2, d = Math.cos(a - spin * 2.2); target = 0.06 + (d > 0.85 ? (d - 0.85) * 5 : 0); }
    else target = 0.07 + 0.05 * Math.sin(ts / 900 + m * 0.25);
    amps[i] += (target * k - amps[i]) * 0.28;
    const a = (i / N_BARS) * Math.PI * 2 - Math.PI / 2, len = w * 0.03 + amps[i] * w * 0.2;
    ctx.strokeStyle = `rgba(${r},${g},${b},${0.45 + Math.min(.55, amps[i])})`;
    ctx.lineWidth = w * 0.0105; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * base * 1.12, cx + Math.sin(a) * base * 1.12); ctx.lineTo(cx + Math.cos(a) * (base * 1.12 + len), cx + Math.sin(a) * (base * 1.12 + len)); ctx.stroke();
  }
  const grad = ctx.createRadialGradient(cx * 0.9, cx * 0.85, base * 0.1, cx, cx, base * 1.05);
  grad.addColorStop(0, `rgba(${r},${g},${b},.95)`); grad.addColorStop(1, `rgba(${r * .45 | 0},${g * .45 | 0},${b * .45 | 0},.95)`);
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cx, base * (1 + (orbState === "idle" ? 0.012 * Math.sin(ts / 700) : 0)), 0, 7); ctx.fill();
}
requestAnimationFrame(drawOrb);

const STATE_TEXT = { idle: "", listening: "Listening. Speak when you’re ready.", thinking: "Checking your account…", speaking: "Riya is speaking" };
let activeSpeaker = "Riya";
function setOrb(state, text) {
  orbState = state; $("stateText").textContent = tr(text || (state === "speaking" ? `${activeSpeaker} is speaking` : STATE_TEXT[state]));
  $("orbWord").textContent = state === "listening" ? tr(cfg?.seller?.name || "Rakesh") : state === "thinking" ? "…" : tr(activeSpeaker);
}
async function initMic() {
  if (analyser) return;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.7;
    audioCtx.createMediaStreamSource(micStream).connect(analyser); freq = new Uint8Array(analyser.frequencyBinCount);
  } catch { analyser = null; }
}

/* =============== caption + transcript =============== */
let capTimers = [];
function showCaption(text, ms) {
  capTimers.forEach(clearTimeout); capTimers = [];
  const words = text.split(/\s+/);
  $("caption").innerHTML = words.map((w) => `<span class="w">${w.replace(/</g, "&lt;")}</span>`).join(" ");
  const spans = [...$("caption").children], step = ms / words.length;
  spans.forEach((s, i) => capTimers.push(setTimeout(() => s.classList.add("on"), REDUCED ? 0 : i * step)));
}
function finishCaption() { capTimers.forEach(clearTimeout); document.querySelectorAll("#caption .w").forEach((s) => s.classList.add("on")); }
function logLine(cls, text) { const p = document.createElement("p"); p.className = cls; p.textContent = (cls === "b" ? "Riya: " : `${cfg?.seller?.name || "Seller"}: `) + text; $("transcript").append(p); $("transcript").scrollTop = 1e9; }

/* =============== journey =============== */
const STEPS_MAIN = ["Greet", "Diagnose", "Investigate", "Quantify", "Recommend", "Act", "Summarise"];
const STEPS_FU = ["Reconnect", "Review progress", "Find gaps", "Agree next steps", "Close the loop"];
let STEPS = STEPS_MAIN, reached = -1;
function renderJourney() { $("journey").innerHTML = STEPS.map((s, i) => `<li class="${i < reached ? "done" : i === reached ? "now" : ""}">${tr(s)}</li>`).join(""); }
function reach(i) { if (i > reached) { reached = i; renderJourney(); } }
const STEP_OF_FU = { get_followup_status: 1, get_upcoming_events: 2, create_restock_task: 3, schedule_followup: 3, send_summary: 4 };
const STEP_OF_MAIN = { get_price_benchmark: 1, get_seller_metrics: 1, get_oos_products: 2, get_cancellation_breakdown: 2, get_visibility_metrics: 2, get_upcoming_events: 3, estimate_impact: 4, create_restock_task: 5, raise_ticket: 5, schedule_followup: 5, escalate_to_human: 5, send_summary: 6 };

/* =============== receipt =============== */
const FRIENDLY = { get_price_benchmark: "Compared your prices with the market", get_upcoming_events: "Checked upcoming sale events", get_followup_status: "Checked progress since the last call", get_seller_metrics: "Checked sales and orders", get_oos_products: "Checked stock levels", get_cancellation_breakdown: "Checked cancellations", get_visibility_metrics: "Checked search visibility", estimate_impact: "Worked out what each cause cost you" };
function show(id) { $(id).classList.remove("hidden"); $("rcEmpty").classList.add("hidden"); }
function line(into, secId, html, cls = "") { show(secId); const d = document.createElement("div"); d.className = "ln " + cls; d.innerHTML = tr(html); $(into).append(d); const col = document.querySelector(".receipt-col"); col.scrollTo({ top: col.scrollHeight, behavior: REDUCED ? "auto" : "smooth" }); }
const row = (t, v, cls = "") => `<span class="t">${tr(t)}</span><span class="dots"></span><span class="v">${v}</span>`;

function setStamp(a, b) { const s = $("stamp"); s.innerHTML = `<span>${a}</span><b>${b}</b>`; s.classList.remove("hidden"); s.style.animation = "none"; void s.offsetWidth; s.style.animation = ""; }
function chip(text, act) { const li = document.createElement("li"); li.textContent = text; if (act) li.className = "act"; $("checks").prepend(li); while ($("checks").children.length > 4) $("checks").lastChild.remove(); }

function onTool(c) {
  toolCount++;
  reach(((callMode === "followup" ? STEP_OF_FU : STEP_OF_MAIN)[c.name]) ?? reached);
  if (c.name === "estimate_impact") reach(4);
  const key = callMode + c.name + (c.result?.id || "");
  if (seen.has(key)) return; seen.add(key);
  const r = c.result || {};
  switch (c.name) {
    case "get_seller_metrics":
      line("linesFound", "secFound", row("Sales", `${inr(r.lastMonth.sales)} → ${inr(r.thisMonth.sales)}`), "bad");
      line("linesFound", "secFound", row("Avg price", tr("flat") + " " + inr(r.thisMonth.asp)), "ok");
      line("linesFound", "secFound", "Price is not the problem", "sub"); break;
    case "get_price_benchmark":
      line("linesFound", "secFound", row("Your prices vs market", `${r.avgGapPct}%`), "ok");
      line("linesFound", "secFound", "In line with category median", "sub"); break;
    case "get_upcoming_events":
      if (callMode === "followup") break;
      line("linesFound", "secFound", row("Next sale event", L(`${r.events[0].name}, ${r.events[0].startsInDays}d`, `${r.events[0].name === "Year-End Sale" ? "ईयर-एंड सेल" : r.events[0].name}, ${r.events[0].startsInDays} दिन`)), "ok"); break;
    case "get_followup_status":
      line("linesFollow", "secFollow", row("Back in stock", L(`${r.restock.backInStock.length} of ${r.restock.backInStock.length + r.restock.stillPending.length} SKUs`, `${r.restock.backInStock.length} / ${r.restock.backInStock.length + r.restock.stillPending.length} SKU`)), "ok");
      line("linesFollow", "secFollow", row("Cancellations", `14% → ${r.cancellationRateLast48h}%`), "ok");
      line("linesFollow", "secFollow", row("Orders per day", `${r.ordersPerDay.before} → ${r.ordersPerDay.now}`), "ok");
      line("linesFollow", "secFollow", row("Earning back", L(`${inr(r.recoveredRupeesPerDay)}/day`, `${inr(r.recoveredRupeesPerDay)}/दिन`)), "total");
      if (r.restock.stillPending.length) line("linesFollow", "secFollow", L(`${r.restock.stillPending.length} SKUs still waiting on supplier`, `${r.restock.stillPending.length} SKU अब भी सप्लायर के इंतज़ार में`), "sub");
      $("bigDelta").textContent = L(`Recovering: ${inr(r.recoveredRupeesPerDay)} a day back`, `वापसी: रोज़ ${inr(r.recoveredRupeesPerDay)}`); $("bigDelta").style.color = "var(--mint)"; break;
    case "get_oos_products":
      line("linesFound", "secFound", row("Out of stock", `${r.totalOutOfStock - r.newlyOutOfStock} → ${r.totalOutOfStock}`), "bad");
      line("linesFound", "secFound", (lang === "hi" && /^These (\d+) products generated (\d+) of (\d+) orders last month \((\d+)%\)/.test(r.share || "")) ? r.share.replace(/^These (\d+) products generated (\d+) of (\d+) orders last month \((\d+)%\)\.?/, "इन $1 प्रोडक्ट से पिछले महीने $3 में से $2 ऑर्डर आए थे ($4%)।") : (r.share || ""), "sub"); break;
    case "get_cancellation_breakdown":
      line("linesFound", "secFound", row("Cancellations", `${r.last.total} → ${r.now.total}`), "bad");
      line("linesFound", "secFound", L(`${r.now.reasons["Stock unavailable (seller)"]} of ${r.now.total} were because stock was not available`, `${r.now.total} में से ${r.now.reasons["Stock unavailable (seller)"]} स्टॉक न होने की वजह से हुए`), "sub"); break;
    case "get_visibility_metrics":
      line("linesFound", "secFound", row("Search impressions", `${r.impressionsChangePct}%`), "bad");
      line("linesFound", "secFound", "Clicks per view are steady, fewer people see you", "sub"); break;
    case "estimate_impact": {
      r.causes.forEach((x) => line("linesImpact", "secImpact", row(x.cause.replace(/ \(.*?\)/, ""), inr(x.rupees)), "bad"));
      line("linesImpact", "secImpact", row("Total drop", inr(r.totalDropRupees)), "total"); break;
    }
    case "create_restock_task": case "raise_ticket": case "schedule_followup": case "send_summary": case "escalate_to_human":
      line(callMode === "followup" ? "linesFollow" : "linesDone", callMode === "followup" ? "secFollow" : "secDone", `<b>${tr(r.type)}</b> <span class="id">${r.id}</span><small>${r.detail}</small>`, "act");
      if (c.name === "schedule_followup") {
        setStamp(tr(callMode === "followup" ? "Next check" : "Follow-up set"), tr(callMode === "followup" ? "7 days" : "48 hours"));
        if (callMode !== "followup") { followupReady = true; $("btnFFdock").classList.remove("hidden"); }
      }
      if (c.name === "escalate_to_human") setStamp(tr("Handed to human"), tr("30 min"));
      if (c.name === "send_summary") { show("rcFoot"); $("rcFoot").classList.remove("hidden"); }
      break;
  }
  chip(tr(FRIENDLY[c.name] || r.type || c.name), !FRIENDLY[c.name]);
}


/* =============== voice gender: Riya is a woman, so she always gets a female voice =============== */
const VOICE_GENDER = "female"; // change to "male" only if you also rename the persona
const FEMALE_RX = /female|woman|zira|heera|swara|neerja|priya|kalpana|aditi|raveena|veena|hazel|susan|samantha|karen|tessa|moira|fiona|google\s*(हिन्दी|hindi)|google uk english female|google us english/i;
const MALE_RX = /\bmale\b|david|mark|ravi|hemant|prabhat|madhur|rishi|george|james|daniel|alex|fred|google uk english male/i;
function pickVoice(l, all, gender = VOICE_GENDER) {
  const locale = l.toLowerCase().replace("_", "-");
  const pool = all.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(locale.split("-")[0]));
  const exact = pool.filter((v) => v.lang.toLowerCase().replace("_", "-") === locale);
  const want = gender === "female" ? FEMALE_RX : MALE_RX, avoid = gender === "female" ? MALE_RX : FEMALE_RX;
  return exact.find((v) => want.test(v.name)) || pool.find((v) => want.test(v.name)) ||
    exact.find((v) => !avoid.test(v.name)) || pool.find((v) => !avoid.test(v.name));
}
function loadVoices() {
  const voices = speechSynthesis.getVoices();
  if (voices.length) return Promise.resolve(voices);
  return new Promise((resolve) => {
    const finish = () => { clearTimeout(timer); resolve(speechSynthesis.getVoices()); };
    const timer = setTimeout(finish, 1200);
    speechSynthesis.addEventListener("voiceschanged", finish, { once: true });
  });
}
/* =============== speech output =============== */
function stopSpeaking() { speechSynthesis.cancel(); if (curAudio) { curAudio.pause(); curAudio = null; } }
async function speak(text, speaker = "Riya") {
  const gender = speaker === "Riya" ? "female" : (cfg?.seller?.voiceGender || "male");
  activeSpeaker = speaker;
  const my = ++speakId; speaking = true; syncLanguageControls(); setOrb("speaking");
  const est = Math.max(2500, text.split(/\s+/).length * 330);
  showCaption(text, est);
  if (!$("barge").checked) stopListening();
  try {
    if (gender === "female" ? cfg.tts : cfg.ttsMale) {
      try {
        const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, gender, lang }) });
        if (r.ok) {
          const url = URL.createObjectURL(await r.blob());
          await new Promise((res) => { curAudio = new Audio(url); curAudio.onended = curAudio.onerror = res; curAudio.play().catch(res); });
          URL.revokeObjectURL(url);
          return;
        }
        if (r.status === 402 || r.status === 501) {
          if (gender === "female") cfg.tts = false;
          else cfg.ttsMale = false;
        }
      } catch {}
    }
    const l = LANGS[lang], voice = pickVoice(l, await loadVoices(), gender);
    await new Promise((resolve) => {
      const parts = text.match(/[^.!?।]+[.!?।]?/g) || [text]; let i = 0;
      setTimeout(resolve, text.length * 110 + 4000); // watchdog: some browsers never fire onend
      const next = () => {
        if (my !== speakId || i >= parts.length) return resolve();
        const u = new SpeechSynthesisUtterance(parts[i++].trim()); u.lang = l; if (voice) u.voice = voice; u.rate = 0.96; u.pitch = 1; u.onend = next; u.onerror = () => resolve();
        speechSynthesis.speak(u);
      };
      next();
    });
  } finally {
    if (my === speakId) { speaking = false; syncLanguageControls(); finishCaption(); if (inCall) afterBot(); }
  }
}
function afterBot() { if (!busy) { setOrb("listening", micOn ? undefined : "Mic is off. Type your reply."); startListening(); } }

/* =============== speech input =============== */
function startListening() {
  if (!SR || !inCall || !micOn || recActive || busy || (speaking && !$("barge").checked)) return;
  rec = new SR(); rec.lang = LANGS[lang]; rec.interimResults = true; rec.continuous = false;
  let finalText = "";
  rec.onstart = () => { recActive = true; console.log("[mic] recognition started"); };
  rec.onaudiostart = () => console.log("[mic] audio capture started");
  rec.onspeechstart = () => { console.log("[mic] speech detected"); if (!speaking) $("stateText").textContent = "Hearing you…"; };
  rec.onspeechend = () => console.log("[mic] speech ended");
  rec.onresult = (e) => {
    window.__noSpeech = 0;
    if (speaking && $("barge").checked) { speakId++; stopSpeaking(); speaking = false; finishCaption(); setOrb("listening"); }
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) { const x = e.results[i]; if (x.isFinal) finalText += x[0].transcript; else interim += x[0].transcript; }
    if (interim) { $("heard").className = "heard interim"; $("heard").textContent = interim; }
  };
  rec.onerror = (e) => {
    const msg = { "not-allowed": "Microphone blocked. Click the lock icon in the address bar, allow Microphone, then reload.", "service-not-allowed": "Microphone blocked. Click the lock icon in the address bar, allow Microphone, then reload.", "audio-capture": "No microphone found. Plug one in or pick it in Windows/Mac sound settings. You can type instead.", "network": "Speech recognition needs internet (Chrome sends audio to Google). Check your connection, or type instead." }[e.error];
    console.warn("Speech recognition error:", e.error);
    if (e.error === "no-speech") { window.__noSpeech = (window.__noSpeech || 0) + 1; if (window.__noSpeech >= 3) { setOrb("listening", "I can't hear any sound. Check your microphone input in Windows sound settings, or type instead."); $("typer").classList.remove("hidden"); } } else window.__noSpeech = 0;
    if (msg) { micOn = false; setMic(); setOrb("idle", msg); $("typer").classList.remove("hidden"); }
  };
  rec.onend = () => { recActive = false; if (finalText.trim()) handleUser(finalText.trim()); else if (inCall && !busy && !speaking && micOn) setTimeout(startListening, 200); };
  try { rec.start(); } catch {}
}
function stopListening() { if (rec && recActive) { rec.onend = null; try { rec.abort(); } catch {} recActive = false; } }
function setMic() { $("btnMic").setAttribute("aria-pressed", micOn); $("micTxt").textContent = tr(micOn ? "Mic on" : "Mic off"); }
function syncLanguageControls() {
  $("langEn").disabled = busy || speaking;
  $("langHi").disabled = busy || speaking;
}

/* =============== conversation =============== */
async function callApi(body) {
  const t = performance.now();
  const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, lang, sellerId: cfg.seller.id, ...body }) });
  if (!r.ok) throw new Error("server " + r.status);
  const d = await r.json(); sessionId = d.sessionId; turns++;
  $("latency").textContent = L(`Reply in ${((performance.now() - t) / 1000).toFixed(1)}s · AI ${(d.ms / 1000).toFixed(1)}s`, `जवाब ${((performance.now() - t) / 1000).toFixed(1)} से · AI ${(d.ms / 1000).toFixed(1)} से`); $("latency").classList.remove("hidden"); try { localStorage.setItem("kamLatency", $("latency").textContent); } catch {}
  return d;
}
async function applyReply(d) {
  (d.toolCalls || []).forEach(onTool);
  logLine("b", d.reply); busy = false; await speak(d.reply);
}
async function handleUser(text) {
  if (!inCall || busy) return;
  speakId++; stopSpeaking(); speaking = false; stopListening(); finishCaption();
  $("heard").className = "heard"; $("heard").textContent = text; logLine("y", text);
  busy = true; syncLanguageControls(); setOrb("thinking");
  try { await applyReply(await callApi({ text })); }
  catch { busy = false; syncLanguageControls(); setOrb("idle", L("Connection problem. Say that again.", "कनेक्शन में दिक्कत। दोबारा बोलिए।")); afterBot(); }
}
async function startCall(mode) {
  if (inCall) return;
  inCall = true; busy = true; syncLanguageControls(); micOn = true; setMic(); callMode = mode; reached = 0; turns = 0; toolCount = 0;
  STEPS = mode === "followup" ? STEPS_FU : STEPS_MAIN; renderJourney();
  $("timeJump").classList.toggle("hidden", mode !== "followup"); $("stats").classList.add("hidden"); $("btnFF").classList.add("hidden");
  if (mode !== "followup") {
    seen = new Set(); followupReady = false; $("btnFFdock").classList.add("hidden");
    ["linesFound", "linesImpact", "linesDone", "linesFollow"].forEach((id) => ($(id).innerHTML = ""));
    ["secFound", "secImpact", "secDone", "secFollow", "stamp", "rcFoot"].forEach((id) => $(id).classList.add("hidden")); $("rcEmpty").classList.remove("hidden");
    $("bigDelta").style.color = ""; renderDossier();
  } else { $("btnFFdock").classList.add("hidden"); }
  $("transcript").innerHTML = ""; $("checks").innerHTML = ""; $("caption").textContent = ""; $("heard").textContent = "";
  $("hero").classList.add("hidden"); ["live", "dock", "livePill"].forEach((id) => $(id).classList.remove("hidden"));
  sizeCanvas(); t0 = Date.now(); tick(); timerId = setInterval(tick, 1000);
  activeSpeaker = mode === "seller_call" ? cfg.seller.name : "Riya";
  setOrb("thinking", mode === "proactive"
    ? L(`Riya is calling ${cfg.seller.name}…`, `रिया ${tr(cfg.seller.name)} को कॉल कर रही है…`)
    : L("Connecting to Riya…", "रिया से जोड़ रहे हैं…"));
  speechSynthesis.getVoices(); await initMic();
  try {
    if (mode === "seller_call") {
      const HindiCallerForm = cfg.seller.voiceGender === "female" ? "बोल रही हूँ" : "बोल रहा हूँ";
      const opener = L(`Hi Riya, this is ${cfg.seller.name}. Can you help me review my account?`, `नमस्ते रिया, मैं ${tr(cfg.seller.name)} ${HindiCallerForm}। क्या आप मेरा अकाउंट देखने में मदद करेंगी?`);
      logLine("y", opener);
      await speak(opener, cfg.seller.name);
    }
    activeSpeaker = "Riya";
    await applyReply(await callApi({ start: mode }));
  }
  catch { busy = false; endCall(); alert(L("Could not reach the server. Is `npm start` running?", "सर्वर से संपर्क नहीं हो पाया। क्या `npm start` चल रहा है?")); }
}
function endCall() {
  inCall = false; busy = false; speaking = false; syncLanguageControls(); speakId++; stopSpeaking(); stopListening(); clearInterval(timerId); finishCaption();
  const secs = Math.floor((Date.now() - t0) / 1000);
  $("stats").textContent = L(`Last call: ${Math.floor(secs / 60)}m ${secs % 60}s · ${turns} turns · ${toolCount} tool calls`, `पिछली कॉल: ${Math.floor(secs / 60)} मिनट ${secs % 60} सेकंड · ${turns} बारी · ${toolCount} टूल कॉल`); $("stats").classList.remove("hidden");
  if (followupReady && callMode !== "followup") $("btnFF").classList.remove("hidden");
  if (turns > 0) fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, sellerId: cfg?.seller?.id, type: callMode === "seller_call" ? "Seller called" : "Riya called", secs, mode: cfg?.brain || "offline", transcript: [...document.querySelectorAll("#transcript p")].map((p) => p.textContent), said: [...document.querySelectorAll("#transcript p")].find((p) => p.className !== "b")?.textContent?.replace(/^[^:]+:\s*/, "") || "" }) }).catch((error) => console.error("Could not save call history:", error));
  setOrb("idle", "Call ended"); $("dock").classList.add("hidden"); $("typer").classList.add("hidden"); $("livePill").classList.add("hidden");
  $("hero").classList.remove("hidden"); $("live").classList.add("hidden");
  document.querySelector(".hero .lede").textContent = tr("That call is saved on the receipt. Start another to run it again.");
}
function tick() { const s = Math.floor((Date.now() - t0) / 1000); $("timer").textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
/* =============== wiring =============== */
$("btnProactive").onclick = () => startCall("proactive");
$("btnCall").onclick = () => startCall("seller_call");
$("sellerSelect").onchange = (event) => {
  const selectedId = event.target.value;
  location.href = `${location.pathname}?seller=${encodeURIComponent(selectedId)}`;
};
$("btnEnd").onclick = endCall;
const startFollowup = () => { if (inCall) endCall(); startCall("followup"); };
$("btnFF").onclick = startFollowup; $("btnFFdock").onclick = startFollowup;
$("btnMic").onclick = () => { micOn = !micOn; setMic(); if (micOn) afterBot(); else stopListening(); };
$("btnKeys").onclick = () => { const o = $("typer").classList.toggle("hidden"); $("btnKeys").setAttribute("aria-expanded", !o); if (!o) $("typeInput").focus(); };
$("typeForm").onsubmit = (e) => { e.preventDefault(); const v = $("typeInput").value.trim(); if (v && inCall) { $("typeInput").value = ""; handleUser(v); } };
$("try").onclick = (e) => { const t = e.target.dataset?.t; if (t && inCall) handleUser(t); };
for (const [id, l] of [["langEn", "en"], ["langHi", "hi"]]) $(id).onclick = () => { lang = l; try { localStorage.setItem("kamLang", l); } catch {} $("langEn").setAttribute("aria-pressed", l === "en"); $("langHi").setAttribute("aria-pressed", l === "hi"); document.documentElement.lang = l; window.dispatchEvent(new CustomEvent("kam-language-change", { detail: { lang } })); applyStatic(); stopListening(); if (inCall && !busy && !speaking) startListening(); };
renderJourney();
$("langEn").setAttribute("aria-pressed", lang === "en"); $("langHi").setAttribute("aria-pressed", lang === "hi");
const initialSellerId = new URLSearchParams(location.search).get("seller");
const configUrl = initialSellerId ? `/api/config?sellerId=${encodeURIComponent(initialSellerId)}` : "/api/config";
fetch(configUrl).then((r) => {
  if (!r.ok) throw new Error(`Could not load seller profile (${r.status})`);
  return r.json();
}).then((c) => { cfg = c; renderDossier(); renderHero(); applyStatic(); }).catch((error) => {
  console.error(error);
  $("hero").textContent = L("Could not load this seller. Choose a seller from the dashboard and try again.", "इस विक्रेता का विवरण लोड नहीं हो सका। डैशबोर्ड से विक्रेता चुनकर फिर कोशिश करें।");
});
applyStatic();