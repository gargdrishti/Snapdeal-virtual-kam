// // Offline "brain": a guided state machine that uses the SAME tools as the LLM agents.
// // Used when no API key is set, or as a safety net if the LLM call fails during a demo.
// import { runTool, computeImpact } from "./tools.js";
// import { seller, newlyOutOfStock } from "./data.js";

// const rs = (n, lang) => {
//   if (n >= 100000) return `₹${(n / 100000).toFixed(2).replace(/\.?0+$/, "")} ${lang === "hi" ? "लाख" : "lakh"}`;
//   return `₹${Math.round(n / 1000)} ${lang === "hi" ? "हज़ार" : "thousand"}`;
// };

// const YES = /\b(yes|yeah|yep|yup|sure|ok|okay|go ahead|do it|please do|haan|han|ha|theek|thik|kar do|kardo|kar dijiye|sounds good|perfect)\b|हाँ|हां|ठीक|कर दो|करो|कर दीजिए|जी/i;
// const NO = /\b(no|nope|nahi|nahin|not now|later|dont|don't)\b|नहीं|नही/i;
// const BYE = /\b(bye|goodbye|thank|thanks|thank you|dhanyavaad|shukriya|that's all|thats all|nothing else)\b|धन्यवाद|शुक्रिया|बस/i;

// function call(session, calls, name, args = {}) {
//   const result = runTool(name, args, session);
//   calls.push({ name, args, result });
//   return result;
// }

// export function offlineTurn(session, text, lang, meta = {}) {
//   const s = (session.brain ||= { stage: "start", notes: {} });
//   const calls = [];
//   const t = (text || "").toLowerCase();
//   const hi = lang === "hi";
//   const L = seller.last, N = seller.now;
//   const drop = rs(L.sales - N.sales, lang);
//   const top = [...newlyOutOfStock].sort((a, b) => b.lastMonthOrders - a.lastMonthOrders);
//   const top3 = top.slice(0, 3).map((p) => p.name).join(", ");

//   // ---- opening ----
//   if (meta.start) {
//     if (meta.start === "followup") {
//       const f = call(session, calls, "get_followup_status");
//       s.stage = "fu1";
//       const n = f.restock.backInStock.length, tot = n + f.restock.stillPending.length;
//       const pend = f.restock.stillPending.length;
//       return { toolCalls: calls, reply: hi
//         ? `नमस्ते ${seller.name} जी, रिया बोल रही हूँ, जैसा वादा किया था, अड़तालीस घंटे बाद। आपके ${tot} में से ${n} प्राथमिक प्रोडक्ट वापस स्टॉक में हैं, और रोज़ के ऑर्डर ${f.ordersPerDay.before} से बढ़कर करीब ${f.ordersPerDay.now} हो गए हैं। कैंसलेशन भी घटकर लगभग साढ़े दस प्रतिशत है। ${pend ? `${pend} प्रोडक्ट अभी सप्लायर के इंतज़ार में हैं। उनका क्या अपडेट है?` : "सब ठीक चल रहा है।"}`
//         : `Hi ${seller.name}, Riya again, as promised, forty-eight hours later. ${n} of your ${tot} priority products are back in stock, and orders per day are up from about nine to about twelve. Cancellations have eased to roughly ten and a half percent. ${pend ? `${pend} products are still waiting on your supplier. How is that going?` : "Everything looks on track."}` };
//     }
//     if (meta.start === "proactive") {
//       call(session, calls, "get_seller_metrics");
//       s.stage = "opened";
//       return { toolCalls: calls, reply: hi
//         ? `नमस्ते ${seller.name} जी, मैं रिया बोल रही हूँ, स्नैपडील की वर्चुअल अकाउंट मैनेजर। मैंने देखा कि इस महीने आपकी सेल्स ${rs(L.sales, lang)} से घटकर ${rs(N.sales, lang)} हो गई है। क्या आपके पास पाँच मिनट हैं, मैं इसे साथ में देख लूँ?`
//         : `Hi ${seller.name}, this is Riya, your Snapdeal virtual account manager. I noticed your sales slipped from ${rs(L.sales, lang)} to ${rs(N.sales, lang)} this month. Do you have five minutes so we can fix this together?` };
//     }
//     s.stage = "opened";
//     return { toolCalls: calls, reply: hi
//       ? `नमस्ते ${seller.name} जी, मैं रिया हूँ, स्नैपडील की वर्चुअल अकाउंट मैनेजर। बताइए, मैं आपकी क्या मदद कर सकती हूँ?`
//       : `Hello ${seller.name}, this is Riya, your Snapdeal virtual account manager. How can I help you today?` };
//   }

//   // quick side answers
//   const asksPrice = /price|pricing|rate|cheap|expensive|दाम|कीमत|रेट|भाव/.test(t) && !/estimate|impact/.test(t);
//   const priceLine = asksPrice
//     ? (hi ? `आपकी औसत सेलिंग प्राइस ₹500 पर स्थिर है, इसलिए प्राइसिंग मुख्य कारण नहीं है। ` : `Your average selling price is steady at ₹500, so pricing isn't what pulled sales down. `)
//     : "";

//   if (/\b(human|manager|supervisor|real person|complain|complaint|fed up|useless|waste of time|nonsense|bakwas|angry)\b|इंसान|शिकायत|बेकार|गुस्सा|बकवास|मैनेजर/i.test(text || "") && s.stage !== "escalated") {
//     call(session, calls, "escalate_to_human", { reason: "Seller frustrated / asked for a human", context: "Sales down 32%, 18 SKUs out of stock, cancellations 8% to 14%. Agent had diagnosed stock-outs and proposed restock plan." });
//     s.stage = "escalated";
//     return { toolCalls: calls, reply: hi
//       ? "मैं समझ सकती हूँ, यह परेशान करने वाली बात है। मैंने अपनी सीनियर टीम को पूरा संदर्भ भेज दिया है, ताकि आपको कुछ दोबारा न बताना पड़े। एक सीनियर KAM तीस मिनट के भीतर आपको कॉल करेंगे।"
//       : "I understand, that's frustrating, and I'm sorry. I've handed this to a senior account manager with the full context, so you won't have to repeat anything. They'll call you within thirty minutes." };
//   }
//   if (s.stage === "escalated") {
//     return { toolCalls: calls, reply: hi ? "सीनियर KAM जल्द ही आपको कॉल करेंगे। तब तक मैं यहीं हूँ।" : "Your senior account manager will call you shortly. I'm here until then." };
//   }

//   switch (s.stage) {
//     case "start":
//     case "opened": {
//       call(session, calls, "get_seller_metrics");
//       call(session, calls, "get_price_benchmark");
//       call(session, calls, "get_oos_products");
//       s.stage = "asked_stock";
//       return { toolCalls: calls, reply: priceLine + (hi
//         ? `आपकी कीमतें बाज़ार से करीब दो प्रतिशत के अंदर हैं, इसलिए प्राइसिंग समस्या नहीं है। मैंने आपका डेटा देखा। ऑर्डर ${L.orders} से घटकर ${N.orders} हो गए, यानी लगभग बत्तीस प्रतिशत की गिरावट, और आउट-ऑफ-स्टॉक प्रोडक्ट पाँच से बढ़कर अठारह हो गए हैं। इनमें ${top3} जैसे आपके टॉप सेलर भी हैं। क्या आपको पता है ये स्टॉक में क्यों नहीं हैं?`
//         : `Your prices are within two percent of the market, so pricing isn't the issue. I checked your account. Orders fell from ${L.orders} to ${N.orders}, about thirty-two percent, and out-of-stock products jumped from five to eighteen, including top sellers like ${top3}. Do you know why those ran out?`) };
//     }
//     case "asked_stock": {
//       if (/supplier|vendor|factory|manufactur|सप्लायर|माल/.test(t)) s.notes.cause = "supplier";
//       else if (/money|cash|fund|paisa|invest|पैसे|पैसा|फंड/.test(t)) s.notes.cause = "cash";
//       else if (/didn't|dont|don't know|not aware|pata nahi|पता नहीं|नहीं पता/.test(t)) s.notes.cause = "unaware";
//       call(session, calls, "get_cancellation_breakdown");
//       s.stage = "asked_dispatch";
//       const ack = s.notes.cause === "supplier"
//         ? (hi ? "समझ गई, सप्लायर की देरी असली समस्या है, हम उसे प्राथमिकता देंगे। " : "Got it, supplier delays are a real pain; we'll prioritise the fastest-selling ones. ")
//         : s.notes.cause === "cash"
//         ? (hi ? "समझ गई, पैसे की दिक्कत में टॉप सेलर को पहले रीस्टॉक करना सबसे अच्छा रहता है। " : "Understood, when cash is tight the smart move is restocking only the top sellers first. ")
//         : s.notes.cause === "unaware"
//         ? (hi ? "कोई बात नहीं, यही तो मैं पकड़ने के लिए हूँ। " : "No worries, that's exactly what I'm here to catch. ")
//         : (hi ? "ठीक है। " : "Okay. ");
//       return { toolCalls: calls, reply: priceLine + ack + (hi
//         ? `दूसरी बात, कैंसलेशन आठ प्रतिशत से बढ़कर चौदह प्रतिशत हो गए, और चवालीस में से बाईस सिर्फ़ स्टॉक न होने की वजह से हैं। आम तौर पर आप ऑर्डर आने के कितने समय में डिस्पैच करते हैं?`
//         : `Second thing: cancellations rose from eight to fourteen percent, and twenty-two of forty-four were because stock wasn't available. Roughly how long do you take to dispatch an order after it comes in?`) };
//     }
//     case "asked_dispatch": {
//       // speech recognition often returns number words ("three days"), so normalise them to digits first
//       const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, ten: 10, twelve: 12, twenty: 20, thirty: 30, forty: 40, "forty eight": 48, "forty-eight": 48, a: 1, ek: 1, do: 2, teen: 3, char: 4, paanch: 5, एक: 1, दो: 2, तीन: 3, चार: 4, पाँच: 5, पांच: 5 };
//       const tn = t.replace(/\b(forty[- ]eight|one|two|three|four|five|six|seven|ten|twelve|twenty|thirty|forty|ek|do|teen|char|paanch)\b|(एक|दो|तीन|चार|पाँच|पांच)/g, (m) => String(NUM[m] ?? m));
//       const days = tn.match(/(\d+)\s*(day|din|दिन)/);
//       const hours = tn.match(/(\d+)\s*(hour|hr|ghant|घंटे|घंटा)/);
//       const late = /late|slow|delay|week|hafta|हफ्ते|देर|लेट/.test(t) || (days && +days[1] >= 2) || (hours && +hours[1] > seller.dispatchSlaHours);
//       s.notes.late = !!late;
//       call(session, calls, "get_visibility_metrics");
//       s.stage = "asked_changes";
//       const ack = late
//         ? (hi ? "तो डिस्पैच में देरी भी कैंसलेशन बढ़ा रही है, यह ठीक किया जा सकता है। " : "So slow dispatch is adding to cancellations too, which we can fix. ")
//         : (hi ? "अच्छा, तो डिस्पैच उतनी बड़ी समस्या नहीं लगती। " : "Good, so dispatch looks like a smaller issue. ");
//       return { toolCalls: calls, reply: priceLine + ack + (hi
//         ? `एक आख़िरी बात: आपके लिस्टिंग की इम्प्रेशन करीब पैंतीस प्रतिशत गिरी हैं, जबकि क्लिक रेट वही है। क्या इस महीने आपने कुछ बदला, जैसे फोटो, टाइटल या विज्ञापन?`
//         : `One last thing: your listing impressions are down about thirty-five percent while click-through is steady. Did you change anything this month, like photos, titles or ads?`) };
//     }
//     case "asked_changes": {
//       s.notes.changes = t;
//       call(session, calls, "get_upcoming_events");
//       const imp = call(session, calls, "estimate_impact");
//       const [so, ca, vis] = imp.causes;
//       s.stage = "proposed";
//       return { toolCalls: calls, reply: hi
//         ? `धन्यवाद। मेरे अनुमान से ${drop} की गिरावट में स्टॉक-आउट से लगभग ${rs(so.rupees, lang)}, कैंसलेशन से ${rs(ca.rupees, lang)} और कम विज़िबिलिटी से बाकी का नुकसान हुआ है। मेरे तीन सुझाव: पहले टॉप पाँच प्रोडक्ट रीस्टॉक करें, दूसरा डिस्पैच तेज़ करें और स्टॉक खत्म होने पर लिस्टिंग रोकें, तीसरा, तीन हफ़्ते बाद शुरू हो रही यीयर-एंड सेल में रीस्टॉक किए प्रोडक्ट डालें। क्या मैं इन्हें आपके लिए सेट कर दूँ?`
//         : `Thanks. By my estimate, of the ${drop} drop, roughly ${rs(so.rupees, lang)} is from stock-outs, ${rs(ca.rupees, lang)} from extra cancellations, and the rest from lower visibility. I'd do three things: first, restock your top five sellers; second, speed up dispatch and pause listings when stock hits zero; third, get the restocked products into the Year-End Sale starting in three weeks. Shall I set these up for you now?` };
//     }
//     case "proposed": {
//       if (YES.test(text) && !NO.test(text)) {
//         const skus = top.slice(0, 5).map((p) => p.sku);
//         call(session, calls, "create_restock_task", { skus });
//         call(session, calls, "raise_ticket", { issue: "Reduce cancellations: dispatch SLA + auto-pause out-of-stock listings", details: `Cancellation rate 8% to 14%; 22 of 44 due to stock unavailable` });
//         call(session, calls, "schedule_followup", { hours: 48, topic: "Check restock progress and cancellation rate" });
//         const imp = computeImpact();
//         call(session, calls, "send_summary", { channel: "whatsapp", text: `Snapdeal KAM summary: restock top 5 SKUs, fix dispatch/cancellations, promo after restock. Follow-up in 48h.` });
//         s.stage = "done";
//         const rec = rs(imp.causes[0].rupees + imp.causes[1].rupees, lang);
//         return { toolCalls: calls, reply: hi
//           ? `हो गया। मैंने रीस्टॉक टास्क बना दिया, कैंसलेशन के लिए टिकट डाल दिया और व्हाट्सऐप पर सारांश भेज दिया है। मुख्य समस्या स्टॉक-आउट और कैंसलेशन थी, इन्हें ठीक करने से लगभग ${rec} महीने में वापस आ सकते हैं। मैं अड़तालीस घंटे में आपको दोबारा कॉल करूँगी। कुछ और पूछना है?`
//           : `Done. I've created the restock task, raised a ticket for the cancellations, and sent you a WhatsApp summary. The main problems were stock-outs and cancellations, and fixing them could bring back roughly ${rec} a month. I'll call you again in forty-eight hours to check progress. Anything else?` };
//       }
//       if (NO.test(text)) {
//         return { toolCalls: calls, reply: hi ? "ठीक है, आप बताइए किसमें बदलाव चाहिए, मैं योजना उसी हिसाब से बदल दूँगी।" : "No problem. Tell me what you'd like to change and I'll adjust the plan." };
//       }
//       return { toolCalls: calls, reply: priceLine + (hi ? "बस हाँ बोल दीजिए तो मैं सब सेट कर दूँगी, या बताइए क्या बदलना है।" : "Just say yes and I'll set it all up, or tell me what you'd like to change.") };
//     }
//     case "fu1": {
//       const ev = call(session, calls, "get_upcoming_events");
//       s.stage = "fu2";
//       return { toolCalls: calls, reply: hi
//         ? `समझ गई। मेरा सुझाव है: बाकी दो प्रोडक्ट के लिए सप्लायर से तारीख़ पक्की करवाएँ, जो तीन प्रोडक्ट वापस आए हैं उन्हें तीन हफ़्ते बाद की यीयर-एंड सेल में डालें, और डिस्पैच अड़तालीस घंटे के अंदर रखें। इससे सेल में करीब पच्चीस प्रतिशत उछाल मिल सकता है। क्या मैं यह सेट कर दूँ?`
//         : `Understood. Here's what I'd do next: lock a supplier date for the two pending products, enrol the three restocked ones in the Year-End Sale in three weeks, and keep dispatch under forty-eight hours. That sale can lift sales by around twenty-five percent. Shall I set that up?` };
//     }
//     case "fu2": {
//       if (YES.test(text) && !NO.test(text)) {
//         const f = runTool("get_followup_status", {}, session);
//         call(session, calls, "create_restock_task", { skus: f.restock.stillPending });
//         call(session, calls, "schedule_followup", { hours: 168, topic: "Review recovery and Year-End Sale readiness" });
//         call(session, calls, "send_summary", { channel: "whatsapp", text: "Follow-up summary: 3 SKUs restocked, orders/day up 38%, cancellations 10.5%. Next: chase 2 pending SKUs, enrol in Year-End Sale. Check-in in 7 days." });
//         s.stage = "done";
//         return { toolCalls: calls, reply: hi
//           ? `हो गया। बाकी दो प्रोडक्ट का रीस्टॉक टास्क बना दिया और सारांश व्हाट्सऐप पर भेज दिया है। आप अभी रोज़ करीब ${f.recoveredRupeesPerDay} रुपये वापस कमा रहे हैं। मैं सात दिन में फिर बात करूँगी।`
//           : `Done. I've created the restock task for the two pending products and sent the summary on WhatsApp. You're already earning back about ${f.recoveredRupeesPerDay.toLocaleString("en-IN")} rupees a day. I'll check in again in seven days.` };
//       }
//       if (NO.test(text)) return { toolCalls: calls, reply: hi ? "ठीक है, बताइए क्या बदलना है।" : "No problem. Tell me what you'd like to change." };
//       return { toolCalls: calls, reply: hi ? "बस हाँ बोल दीजिए तो मैं सेट कर दूँगी।" : "Just say yes and I'll set it up, or tell me what to change." };
//     }
//     case "done":
//     default: {
//       if (BYE.test(text) || NO.test(text)) {
//         return { toolCalls: calls, reply: hi ? "धन्यवाद, आपका दिन शुभ हो। अड़तालीस घंटे में बात करते हैं।" : "Thank you, have a great day. Talk in forty-eight hours." };
//       }
//       return { toolCalls: calls, reply: hi ? "ज़रूर, बताइए। वैसे आपका सारांश व्हाट्सऐप पर भेज दिया है।" : "Sure, go ahead. Your summary is already on WhatsApp." };
//     }
//   }
// }
// Offline "brain": a guided state machine that uses the SAME tools as the LLM agents.
// Used when no API key is set, or as a safety net if the LLM call fails during a demo.
import { runTool, computeImpact } from "./tools.js";
import { seller, newlyOutOfStock } from "./data.js";

const rs = (n, lang) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2).replace(/\.?0+$/, "")} ${lang === "hi" ? "लाख" : "lakh"}`;
  return `₹${Math.round(n / 1000)} ${lang === "hi" ? "हज़ार" : "thousand"}`;
};

const YES = /\b(yes|yeah|yep|yup|sure|ok|okay|go ahead|do it|please do|haan|han|ha|theek|thik|kar do|kardo|kar dijiye|sounds good|perfect)\b|हाँ|हां|ठीक|कर दो|करो|कर दीजिए|जी/i;
const NO = /\b(no|nope|nahi|nahin|not now|later|dont|don't)\b|नहीं|नही/i;
const BYE = /\b(bye|goodbye|thank|thanks|thank you|dhanyavaad|shukriya|that's all|thats all|nothing else)\b|धन्यवाद|शुक्रिया|बस/i;

function call(session, calls, name, args = {}) {
  const result = runTool(name, args, session);
  calls.push({ name, args, result });
  return result;
}

function portfolioOfflineTurn(session, text, lang, meta) {
  const selected = session.seller;
  const hi = lang === "hi";
  const L = selected.last, N = selected.now;
  const delta = N.sales - L.sales;
  const change = rs(Math.abs(delta), lang);
  const calls = [];
  const state = (session.portfolioBrain ||= { stage: "start" });
  const say = (en, hindi) => hi ? hindi : en;

  if (meta.start === "followup") {
    const status = call(session, calls, "get_followup_status");
    const unavailable = status.note || "";
    return {
      toolCalls: calls,
      reply: say(
        `Hi ${selected.name}, this is Riya following up. ${unavailable} What has changed since we last spoke?`,
        `नमस्ते ${selected.name} जी, मैं रिया फ़ॉलो-अप के लिए कॉल कर रही हूँ। ${unavailable ? "अभी कॉल के बाद के मापे गए आँकड़े उपलब्ध नहीं हैं।" : ""} पिछली बातचीत के बाद क्या बदला है?`,
      ),
    };
  }

  if (meta.start === "proactive") {
    call(session, calls, "get_seller_metrics");
    state.stage = "opened";
    const trend = delta > 0
      ? say(`sales are up by ${change}`, `बिक्री ${change} बढ़ी है`)
      : delta < 0
        ? say(`sales are down by ${change}`, `बिक्री ${change} कम हुई है`)
        : say("sales are unchanged", "बिक्री में बदलाव नहीं हुआ है");
    return {
      toolCalls: calls,
      reply: say(
        `Hi ${selected.name}, this is Riya from Snapdeal. I noticed your ${trend}. Do you have a few minutes to review your account together?`,
        `नमस्ते ${selected.name} जी, मैं स्नैपडील से रिया बोल रही हूँ। मैंने देखा कि आपकी ${trend}। क्या आपके पास अकाउंट साथ में देखने के लिए कुछ मिनट हैं?`,
      ),
    };
  }

  if (meta.start) {
    state.stage = "opened";
    return {
      toolCalls: calls,
      reply: say(
        `Hello ${selected.name}, this is Riya from Snapdeal. How can I help you today?`,
        `नमस्ते ${selected.name} जी, मैं स्नैपडील से रिया बोल रही हूँ। आज मैं आपकी क्या मदद कर सकती हूँ?`,
      ),
    };
  }

  const message = String(text || "");
  if (state.stage === "recommendation" && YES.test(message)) {
    call(session, calls, "schedule_followup", { hours: 48, topic: "Review seller account progress" });
    return {
      toolCalls: calls,
      reply: say(
        `I have scheduled a follow-up in forty-eight hours to review progress for ${selected.business}.`,
        `${selected.business} की प्रगति देखने के लिए मैंने अड़तालीस घंटे बाद फ़ॉलो-अप तय कर दिया है।`,
      ),
    };
  }

  const mainCause = selected.portfolio?.mainCause;
  const trend = delta > 0
    ? say(`sales are up by ${change}`, `बिक्री ${change} बढ़ी है`)
    : delta < 0
      ? say(`sales are down by ${change}`, `बिक्री ${change} कम हुई है`)
      : say("sales are steady", "बिक्री स्थिर है");
  if (state.stage === "opened") {
    call(session, calls, "get_seller_metrics");
    call(session, calls, "estimate_impact");
    state.stage = "diagnosed";
    return {
      toolCalls: calls,
      reply: say(
        `I reviewed the portfolio figures: ${trend}.${mainCause && delta < 0 ? ` The recorded main area to check is ${mainCause}.` : ""} What do you think is driving the change?`,
        `मैंने पोर्टफोलियो के आँकड़े देखे हैं: ${trend}.${mainCause && delta < 0 ? ` जाँचने के लिए दर्ज मुख्य क्षेत्र ${mainCause} है।` : ""} आपके हिसाब से इस बदलाव का क्या कारण है?`,
      ),
    };
  }
  state.stage = "recommendation";
  return {
    toolCalls: calls,
    reply: say(
      `Thanks for sharing that. Based on the portfolio estimate, ${trend}.${mainCause && delta < 0 ? ` I suggest we start with ${mainCause.toLowerCase()}.` : ""} Shall I schedule a follow-up to review progress?`,
      `यह बताने के लिए धन्यवाद। पोर्टफोलियो के अनुमान के अनुसार ${trend}.${mainCause && delta < 0 ? ` शुरुआत ${mainCause} पर काम करने से की जा सकती है।` : ""} क्या मैं प्रगति देखने के लिए फ़ॉलो-अप तय कर दूँ?`,
    ),
  };
}

export function offlineTurn(session, text, lang, meta = {}) {
  if (session.seller && session.seller.id !== seller.id) return portfolioOfflineTurn(session, text, lang, meta);
  const s = (session.brain ||= { stage: "start", notes: {} });
  const calls = [];
  const t = (text || "").toLowerCase();
  const hi = lang === "hi";
  const L = seller.last, N = seller.now;
  const drop = rs(L.sales - N.sales, lang);
  const top = [...newlyOutOfStock].sort((a, b) => b.lastMonthOrders - a.lastMonthOrders);
  const top3 = top.slice(0, 3).map((p) => p.name).join(", ");

  // ---- opening ----
  if (meta.start) {
    if (meta.start === "followup") {
      const f = call(session, calls, "get_followup_status");
      s.stage = "fu1";
      const n = f.restock.backInStock.length, tot = n + f.restock.stillPending.length;
      const pend = f.restock.stillPending.length;
      return { toolCalls: calls, reply: hi
        ? `नमस्ते ${seller.name} जी, रिया बोल रही हूँ, जैसा वादा किया था, अड़तालीस घंटे बाद। आपके ${tot} में से ${n} प्राथमिक प्रोडक्ट वापस स्टॉक में हैं, और रोज़ के ऑर्डर ${f.ordersPerDay.before} से बढ़कर करीब ${f.ordersPerDay.now} हो गए हैं। कैंसलेशन भी घटकर लगभग साढ़े दस प्रतिशत है। ${pend ? `${pend} प्रोडक्ट अभी सप्लायर के इंतज़ार में हैं। उनका क्या अपडेट है?` : "सब ठीक चल रहा है।"}`
        : `Hi ${seller.name}, Riya again, as promised, forty-eight hours later. ${n} of your ${tot} priority products are back in stock, and orders per day are up from about nine to about twelve. Cancellations have eased to roughly ten and a half percent. ${pend ? `${pend} products are still waiting on your supplier. How is that going?` : "Everything looks on track."}` };
    }
    if (meta.start === "proactive") {
      call(session, calls, "get_seller_metrics");
      s.stage = "opened";
      return { toolCalls: calls, reply: hi
        ? `नमस्ते ${seller.name} जी, मैं रिया बोल रही हूँ, स्नैपडील की वर्चुअल अकाउंट मैनेजर। मैंने देखा कि इस महीने आपकी सेल्स ${rs(L.sales, lang)} से घटकर ${rs(N.sales, lang)} हो गई है। क्या आपके पास पाँच मिनट हैं, मैं इसे साथ में देख लूँ?`
        : `Hi ${seller.name}, this is Riya, your Snapdeal virtual account manager. I noticed your sales slipped from ${rs(L.sales, lang)} to ${rs(N.sales, lang)} this month. Do you have five minutes so we can fix this together?` };
    }
    s.stage = "opened";
    return { toolCalls: calls, reply: hi
      ? `नमस्ते ${seller.name} जी, मैं रिया हूँ, स्नैपडील की वर्चुअल अकाउंट मैनेजर। बताइए, मैं आपकी क्या मदद कर सकती हूँ?`
      : `Hello ${seller.name}, this is Riya, your Snapdeal virtual account manager. How can I help you today?` };
  }

  // quick side answers
  const asksPrice = /price|pricing|rate|cheap|expensive|दाम|कीमत|रेट|भाव/.test(t) && !/estimate|impact/.test(t);
  const priceLine = asksPrice
    ? (hi ? `आपकी औसत सेलिंग प्राइस ₹500 पर स्थिर है, इसलिए प्राइसिंग मुख्य कारण नहीं है। ` : `Your average selling price is steady at ₹500, so pricing isn't what pulled sales down. `)
    : "";

  if (/\b(human|manager|supervisor|real person|complain|complaint|fed up|useless|waste of time|nonsense|bakwas|angry)\b|इंसान|शिकायत|बेकार|गुस्सा|बकवास|मैनेजर/i.test(text || "") && s.stage !== "escalated") {
    call(session, calls, "escalate_to_human", { reason: "Seller frustrated / asked for a human", context: "Sales down 32%, 18 SKUs out of stock, cancellations 8% to 14%. Agent had diagnosed stock-outs and proposed restock plan." });
    s.stage = "escalated";
    return { toolCalls: calls, reply: hi
      ? "मैं समझ सकती हूँ, यह परेशान करने वाली बात है। मैंने अपनी सीनियर टीम को पूरा संदर्भ भेज दिया है, ताकि आपको कुछ दोबारा न बताना पड़े। एक सीनियर KAM तीस मिनट के भीतर आपको कॉल करेंगे।"
      : "I understand, that's frustrating, and I'm sorry. I've handed this to a senior account manager with the full context, so you won't have to repeat anything. They'll call you within thirty minutes." };
  }
  if (s.stage === "escalated") {
    return { toolCalls: calls, reply: hi ? "सीनियर KAM जल्द ही आपको कॉल करेंगे। तब तक मैं यहीं हूँ।" : "Your senior account manager will call you shortly. I'm here until then." };
  }

  switch (s.stage) {
    case "start":
    case "opened": {
      call(session, calls, "get_seller_metrics");
      call(session, calls, "get_price_benchmark");
      call(session, calls, "get_oos_products");
      s.stage = "asked_stock";
      return { toolCalls: calls, reply: priceLine + (hi
        ? `आपकी कीमतें बाज़ार से करीब दो प्रतिशत के अंदर हैं, इसलिए प्राइसिंग समस्या नहीं है। मैंने आपका डेटा देखा। ऑर्डर ${L.orders} से घटकर ${N.orders} हो गए, यानी लगभग बत्तीस प्रतिशत की गिरावट, और आउट-ऑफ-स्टॉक प्रोडक्ट पाँच से बढ़कर अठारह हो गए हैं। इनमें ${top3} जैसे आपके टॉप सेलर भी हैं। क्या आपको पता है ये स्टॉक में क्यों नहीं हैं?`
        : `Your prices are within two percent of the market, so pricing isn't the issue. I checked your account. Orders fell from ${L.orders} to ${N.orders}, about thirty-two percent, and out-of-stock products jumped from five to eighteen, including top sellers like ${top3}. Do you know why those ran out?`) };
    }
    case "asked_stock": {
      if (/supplier|vendor|factory|manufactur|सप्लायर|माल/.test(t)) s.notes.cause = "supplier";
      else if (/money|cash|fund|paisa|invest|पैसे|पैसा|फंड/.test(t)) s.notes.cause = "cash";
      else if (/didn't|dont|don't know|not aware|pata nahi|पता नहीं|नहीं पता/.test(t)) s.notes.cause = "unaware";
      call(session, calls, "get_cancellation_breakdown");
      s.stage = "asked_dispatch";
      const ack = s.notes.cause === "supplier"
        ? (hi ? "समझ गई, सप्लायर की देरी असली समस्या है, हम उसे प्राथमिकता देंगे। " : "Got it, supplier delays are a real pain; we'll prioritise the fastest-selling ones. ")
        : s.notes.cause === "cash"
        ? (hi ? "समझ गई, पैसे की दिक्कत में टॉप सेलर को पहले रीस्टॉक करना सबसे अच्छा रहता है। " : "Understood, when cash is tight the smart move is restocking only the top sellers first. ")
        : s.notes.cause === "unaware"
        ? (hi ? "कोई बात नहीं, यही तो मैं पकड़ने के लिए हूँ। " : "No worries, that's exactly what I'm here to catch. ")
        : (hi ? "ठीक है। " : "Okay. ");
      return { toolCalls: calls, reply: priceLine + ack + (hi
        ? `दूसरी बात, कैंसलेशन आठ प्रतिशत से बढ़कर चौदह प्रतिशत हो गए, और चवालीस में से बाईस सिर्फ़ स्टॉक न होने की वजह से हैं। आम तौर पर आप ऑर्डर आने के कितने समय में डिस्पैच करते हैं?`
        : `Second thing: cancellations rose from eight to fourteen percent, and twenty-two of forty-four were because stock wasn't available. Roughly how long do you take to dispatch an order after it comes in?`) };
    }
    case "asked_dispatch": {
      // speech recognition often returns number words ("three days"), so normalise them to digits first
      const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, ten: 10, twelve: 12, twenty: 20, thirty: 30, forty: 40, "forty eight": 48, "forty-eight": 48, a: 1, ek: 1, do: 2, teen: 3, char: 4, paanch: 5, एक: 1, दो: 2, तीन: 3, चार: 4, पाँच: 5, पांच: 5 };
      const tn = t.replace(/\b(forty[- ]eight|one|two|three|four|five|six|seven|ten|twelve|twenty|thirty|forty|ek|do|teen|char|paanch)\b|(एक|दो|तीन|चार|पाँच|पांच)/g, (m) => String(NUM[m] ?? m));
      const days = tn.match(/(\d+)\s*(day|din|दिन)/);
      const hours = tn.match(/(\d+)\s*(hour|hr|ghant|घंटे|घंटा)/);
      const late = /late|slow|delay|week|hafta|हफ्ते|देर|लेट/.test(t) || (days && +days[1] >= 2) || (hours && +hours[1] > seller.dispatchSlaHours);
      s.notes.late = !!late;
      call(session, calls, "get_visibility_metrics");
      s.stage = "asked_changes";
      const ack = late
        ? (hi ? "तो डिस्पैच में देरी भी कैंसलेशन बढ़ा रही है, यह ठीक किया जा सकता है। " : "So slow dispatch is adding to cancellations too, which we can fix. ")
        : (hi ? "अच्छा, तो डिस्पैच उतनी बड़ी समस्या नहीं लगती। " : "Good, so dispatch looks like a smaller issue. ");
      return { toolCalls: calls, reply: priceLine + ack + (hi
        ? `एक आख़िरी बात: आपके लिस्टिंग की इम्प्रेशन करीब पैंतीस प्रतिशत गिरी हैं, जबकि क्लिक रेट वही है। क्या इस महीने आपने कुछ बदला, जैसे फोटो, टाइटल या विज्ञापन?`
        : `One last thing: your listing impressions are down about thirty-five percent while click-through is steady. Did you change anything this month, like photos, titles or ads?`) };
    }
    case "asked_changes": {
      s.notes.changes = t;
      call(session, calls, "get_upcoming_events");
      const imp = call(session, calls, "estimate_impact");
      const [so, ca, vis] = imp.causes;
      s.stage = "proposed";
      return { toolCalls: calls, reply: hi
        ? `धन्यवाद। मेरे अनुमान से ${drop} की गिरावट में स्टॉक-आउट से लगभग ${rs(so.rupees, lang)}, कैंसलेशन से ${rs(ca.rupees, lang)} और कम विज़िबिलिटी से बाकी का नुकसान हुआ है। मेरे तीन सुझाव: पहले टॉप पाँच प्रोडक्ट रीस्टॉक करें, दूसरा डिस्पैच तेज़ करें और स्टॉक खत्म होने पर लिस्टिंग रोकें, तीसरा, तीन हफ़्ते बाद शुरू हो रही यीयर-एंड सेल में रीस्टॉक किए प्रोडक्ट डालें। क्या मैं इन्हें आपके लिए सेट कर दूँ?`
        : `Thanks. By my estimate, of the ${drop} drop, roughly ${rs(so.rupees, lang)} is from stock-outs, ${rs(ca.rupees, lang)} from extra cancellations, and the rest from lower visibility. I'd do three things: first, restock your top five sellers; second, speed up dispatch and pause listings when stock hits zero; third, get the restocked products into the Year-End Sale starting in three weeks. Shall I set these up for you now?` };
    }
    case "proposed": {
      if (YES.test(text) && !NO.test(text)) {
        const skus = top.slice(0, 5).map((p) => p.sku);
        call(session, calls, "create_restock_task", { skus });
        call(session, calls, "raise_ticket", { issue: "Reduce cancellations: dispatch SLA + auto-pause out-of-stock listings", details: `Cancellation rate 8% to 14%; 22 of 44 due to stock unavailable` });
        call(session, calls, "schedule_followup", { hours: 48, topic: "Check restock progress and cancellation rate" });
        const imp = computeImpact();
        call(session, calls, "send_summary", { channel: "whatsapp", text: `Snapdeal KAM summary: restock top 5 SKUs, fix dispatch/cancellations, promo after restock. Follow-up in 48h.` });
        s.stage = "done";
        const rec = rs(imp.causes[0].rupees + imp.causes[1].rupees, lang);
        return { toolCalls: calls, reply: hi
          ? `हो गया। मैंने रीस्टॉक टास्क बना दिया, कैंसलेशन के लिए टिकट डाल दिया और व्हाट्सऐप पर सारांश भेज दिया है। मुख्य समस्या स्टॉक-आउट और कैंसलेशन थी, इन्हें ठीक करने से लगभग ${rec} महीने में वापस आ सकते हैं। मैं अड़तालीस घंटे में आपको दोबारा कॉल करूँगी। कुछ और पूछना है?`
          : `Done. I've created the restock task, raised a ticket for the cancellations, and sent you a WhatsApp summary. The main problems were stock-outs and cancellations, and fixing them could bring back roughly ${rec} a month. I'll call you again in forty-eight hours to check progress. Anything else?` };
      }
      if (NO.test(text)) {
        return { toolCalls: calls, reply: hi ? "ठीक है, आप बताइए किसमें बदलाव चाहिए, मैं योजना उसी हिसाब से बदल दूँगी।" : "No problem. Tell me what you'd like to change and I'll adjust the plan." };
      }
      return { toolCalls: calls, reply: priceLine + (hi ? "बस हाँ बोल दीजिए तो मैं सब सेट कर दूँगी, या बताइए क्या बदलना है।" : "Just say yes and I'll set it all up, or tell me what you'd like to change.") };
    }
    case "fu1": {
      const ev = call(session, calls, "get_upcoming_events");
      s.stage = "fu2";
      return { toolCalls: calls, reply: hi
        ? `समझ गई। मेरा सुझाव है: बाकी दो प्रोडक्ट के लिए सप्लायर से तारीख़ पक्की करवाएँ, जो तीन प्रोडक्ट वापस आए हैं उन्हें तीन हफ़्ते बाद की यीयर-एंड सेल में डालें, और डिस्पैच अड़तालीस घंटे के अंदर रखें। इससे सेल में करीब पच्चीस प्रतिशत उछाल मिल सकता है। क्या मैं यह सेट कर दूँ?`
        : `Understood. Here's what I'd do next: lock a supplier date for the two pending products, enrol the three restocked ones in the Year-End Sale in three weeks, and keep dispatch under forty-eight hours. That sale can lift sales by around twenty-five percent. Shall I set that up?` };
    }
    case "fu2": {
      if (YES.test(text) && !NO.test(text)) {
        const f = runTool("get_followup_status", {}, session);
        call(session, calls, "create_restock_task", { skus: f.restock.stillPending });
        call(session, calls, "schedule_followup", { hours: 168, topic: "Review recovery and Year-End Sale readiness" });
        call(session, calls, "send_summary", { channel: "whatsapp", text: "Follow-up summary: 3 SKUs restocked, orders/day up 38%, cancellations 10.5%. Next: chase 2 pending SKUs, enrol in Year-End Sale. Check-in in 7 days." });
        s.stage = "done";
        return { toolCalls: calls, reply: hi
          ? `हो गया। बाकी दो प्रोडक्ट का रीस्टॉक टास्क बना दिया और सारांश व्हाट्सऐप पर भेज दिया है। आप अभी रोज़ करीब ${f.recoveredRupeesPerDay} रुपये वापस कमा रहे हैं। मैं सात दिन में फिर बात करूँगी।`
          : `Done. I've created the restock task for the two pending products and sent the summary on WhatsApp. You're already earning back about ${f.recoveredRupeesPerDay.toLocaleString("en-IN")} rupees a day. I'll check in again in seven days.` };
      }
      if (NO.test(text)) return { toolCalls: calls, reply: hi ? "ठीक है, बताइए क्या बदलना है।" : "No problem. Tell me what you'd like to change." };
      return { toolCalls: calls, reply: hi ? "बस हाँ बोल दीजिए तो मैं सेट कर दूँगी।" : "Just say yes and I'll set it up, or tell me what to change." };
    }
    case "done":
    default: {
      if (BYE.test(text) || NO.test(text)) {
        return { toolCalls: calls, reply: hi ? "धन्यवाद, आपका दिन शुभ हो। अड़तालीस घंटे में बात करते हैं।" : "Thank you, have a great day. Talk in forty-eight hours." };
      }
      return { toolCalls: calls, reply: hi ? "ज़रूर, बताइए। वैसे आपका सारांश व्हाट्सऐप पर भेज दिया है।" : "Sure, go ahead. Your summary is already on WhatsApp." };
    }
  }
}