import { seller, newlyOutOfStock, alreadyOutOfStockCount, cancellations, priceBenchmark, events, followup } from "./data.js";

const pct = (a, b) => Math.round(((b - a) / a) * 1000) / 10;

// Neutral tool schemas (adapted to Gemini / Anthropic in llm.js)
export const TOOLS = [
  { name: "get_seller_metrics", description: "Get last-month vs this-month sales, orders, cancellation rate, average selling price and out-of-stock count for the seller. Call this first.", parameters: { type: "object", properties: {} } },
  { name: "get_oos_products", description: "List products that are out of stock this month with their last-month order counts and days out of stock.", parameters: { type: "object", properties: {} } },
  { name: "get_cancellation_breakdown", description: "Get cancellation counts by reason, last month vs this month.", parameters: { type: "object", properties: {} } },
  { name: "get_visibility_metrics", description: "Get search impressions and click-through rate for the seller's listings, last month vs this month.", parameters: { type: "object", properties: {} } },
  { name: "get_price_benchmark", description: "Compare the seller's prices on top products with the category median. Use it to confirm or rule out pricing as a cause.", parameters: { type: "object", properties: {} } },
  { name: "get_upcoming_events", description: "Get upcoming Snapdeal sale events the seller can enrol in, with expected sales lift.", parameters: { type: "object", properties: {} } },
  { name: "get_followup_status", description: "FOLLOW-UP CALL ONLY: get progress 48 hours after the first call: which promised actions were done, restock status, cancellation and order trends.", parameters: { type: "object", properties: {} } },
  { name: "escalate_to_human", description: "Hand the call to a senior human KAM when the seller is frustrated, asks for a human, or the issue is outside your remit. Include a short context summary.", parameters: { type: "object", properties: { reason: { type: "string" }, context: { type: "string" } }, required: ["reason"] } },
  { name: "estimate_impact", description: "Decompose the rupee sales drop into causes: stock-outs, extra cancellations and lower visibility/other. Use this before recommending actions.", parameters: { type: "object", properties: {} } },
  { name: "create_restock_task", description: "Create a restock task for specific out-of-stock SKUs (agent takes ownership). Only call after the seller agrees.", parameters: { type: "object", properties: { skus: { type: "array", items: { type: "string" }, description: "SKU codes to restock, highest impact first" } }, required: ["skus"] } },
  { name: "raise_ticket", description: "Raise a support ticket on the seller's behalf (e.g. dispatch / cancellation issue). Only call after the seller agrees.", parameters: { type: "object", properties: { issue: { type: "string" }, details: { type: "string" } }, required: ["issue"] } },
  { name: "schedule_followup", description: "Schedule a follow-up call with the seller to check progress.", parameters: { type: "object", properties: { hours: { type: "number", description: "Hours from now" }, topic: { type: "string" } }, required: ["hours", "topic"] } },
  { name: "send_summary", description: "Send the seller a WhatsApp/SMS summary of the call and action plan.", parameters: { type: "object", properties: { channel: { type: "string", enum: ["whatsapp", "sms"] }, text: { type: "string" } }, required: ["channel", "text"] } },
];

export function computeImpact(selectedSeller = seller) {
  const L = selectedSeller.last, N = selectedSeller.now;
  if (selectedSeller.id !== seller.id) {
    const portfolioCauses = selectedSeller.portfolio?.causes || [];
    return {
      totalDropRupees: L.sales - N.sales,
      totalDropPercent: Math.abs(pct(L.sales, N.sales)),
      causes: portfolioCauses.map((cause) => ({
        cause: cause.label,
        orders: Math.round(cause.rupees / Math.max(N.asp, 1)),
        rupees: cause.rupees,
      })),
      assumptions: ["Sales and cause estimates are mock portfolio data; product-level detail is not available for this seller."],
    };
  }
  const grossLast = L.orders / (1 - L.cancellationRate / 100);
  const grossNow = N.orders / (1 - N.cancellationRate / 100);
  const totalDropOrders = L.orders - N.orders;
  // Extra cancellations: orders lost because the rate rose from 8% to 14% (on this month's gross demand)
  const extraCancelOrders = Math.round(grossNow * ((N.cancellationRate - L.cancellationRate) / 100));
  // Stock-outs: last-month orders of now-OOS products x share of the month they were unavailable
  const stockoutOrders = Math.round(newlyOutOfStock.reduce((s, p) => s + (p.lastMonthOrders * p.daysOos) / 30, 0));
  const residual = Math.max(0, totalDropOrders - extraCancelOrders - stockoutOrders);
  const asp = N.asp;
  return {
    totalDropRupees: L.sales - N.sales,
    totalDropPercent: Math.abs(pct(L.sales, N.sales)),
    causes: [
      { cause: "Stock-outs (13 products newly out of stock)", orders: stockoutOrders, rupees: stockoutOrders * asp },
      { cause: "Higher cancellations (8% to 14%)", orders: extraCancelOrders, rupees: extraCancelOrders * asp },
      { cause: "Lower visibility / other demand (impressions down ~35%)", orders: residual, rupees: residual * asp },
    ],
    assumptions: [
      "Orders are net of cancellations; gross demand = orders / (1 - cancellation rate)",
      "Stock-out loss = last-month orders of the now-out-of-stock products x share of month unavailable",
      "Visibility/other is the remainder; stock-outs also hurt search rank, so it is partly linked",
      `Gross orders: ${Math.round(grossLast)} last month vs ${Math.round(grossNow)} this month`,
    ],
  };
}

export function runTool(name, args = {}, session) {
  const selectedSeller = session.seller || seller;
  const L = selectedSeller.last, N = selectedSeller.now;
  switch (name) {
    case "get_seller_metrics":
      return {
        seller: selectedSeller.name, business: selectedSeller.business,
        lastMonth: L, thisMonth: N,
        changes: {
          salesPct: pct(L.sales, N.sales), ordersPct: pct(L.orders, N.orders),
          cancellationRatePointsUp: N.cancellationRate - L.cancellationRate,
          aspChangePct: pct(L.asp, N.asp), outOfStockExtra: N.outOfStock - L.outOfStock,
        },
        note: selectedSeller.id === seller.id
          ? "Average selling price is flat, so pricing is NOT the cause. Drop is volume-driven."
          : `Portfolio's main recorded cause: ${selectedSeller.portfolio?.mainCause || "no sales decline"}.`,
      };
    case "get_oos_products": {
      if (selectedSeller.id !== seller.id) {
        return {
          totalOutOfStock: N.outOfStock,
          newlyOutOfStock: Math.max(0, N.outOfStock - L.outOfStock),
          detail: "Product and SKU-level stock data is not available for this mock seller.",
        };
      }
      const top = [...newlyOutOfStock].sort((a, b) => b.lastMonthOrders - a.lastMonthOrders);
      const lost = top.reduce((s, p) => s + p.lastMonthOrders, 0);
      return {
        totalOutOfStock: N.outOfStock, newlyOutOfStock: top.length, alreadyOutOfStockBefore: alreadyOutOfStockCount,
        top5ByLastMonthOrders: top.slice(0, 5),
        share: `These ${top.length} products generated ${lost} of ${L.orders} orders last month (${Math.round((lost / L.orders) * 100)}%).`,
        allNewlyOutOfStock: top,
      };
    }
    case "get_cancellation_breakdown":
      if (selectedSeller.id !== seller.id) {
        return {
          last: { cancellationRate: L.cancellationRate },
          now: { cancellationRate: N.cancellationRate },
          note: "Portfolio-level cancellation rates only; cancellation reasons are not available for this mock seller.",
        };
      }
      return { ...cancellations, topReasonNow: "Stock unavailable (seller)", note: "Seller-side reasons (stock + late dispatch) are 36 of 44 cancellations this month." };
    case "get_visibility_metrics": {
      const v = selectedSeller.visibility;
      return {
        ...v,
        impressionsChangePct: pct(v.last.impressions, v.now.impressions),
        note: selectedSeller.id === seller.id
          ? "CTR is stable, so listings still attract clicks; fewer people are seeing them (stock-outs lower search rank)."
          : "These visibility values are estimated from the mock portfolio sales trend; they are not measured search analytics.",
      };
    }
    case "get_price_benchmark": {
      if (selectedSeller.id !== seller.id) {
        return { items: [], verdict: "SKU-level price benchmark data is not available for this mock seller." };
      }
      const items = priceBenchmark.map((p) => ({ ...p, gapPct: pct(p.categoryMedian, p.yours) }));
      const avg = Math.round((items.reduce((s, i) => s + i.gapPct, 0) / items.length) * 10) / 10;
      return { items, avgGapPct: avg, verdict: Math.abs(avg) <= 3 ? "Prices are in line with the category median, so pricing is not a cause." : "Prices deviate from the market." };
    }
    case "get_upcoming_events":
      return { events, note: "Restocked, well-priced listings qualify for event placement." };
    case "get_followup_status": {
      if (selectedSeller.id !== seller.id) {
        return {
          hoursSinceFirstCall: 48,
          commitments: {
            restockTaskCreated: session.actions.some((a) => a.type === "Restock task"),
            ticketRaised: session.actions.some((a) => a.type === "Support ticket"),
          },
          note: "No measured post-call seller metrics are available yet.",
        };
      }
      const did = (ty) => session.actions.some((a) => a.type === ty);
      const restocked = did("Restock task");
      const f = followup;
      return {
        hoursSinceFirstCall: 48,
        commitments: { restockTaskCreated: restocked, ticketRaised: did("Support ticket") },
        restock: restocked ? { backInStock: f.restockedSkus, stillPending: f.pendingSkus, pendingReason: "waiting on supplier" } : { backInStock: [], stillPending: [...f.restockedSkus, ...f.pendingSkus] },
        cancellationRateLast48h: restocked ? f.cancellationRateLast48h : 14,
        ordersPerDay: restocked ? f.ordersPerDay : { before: f.ordersPerDay.before, now: f.ordersPerDay.before },
        lateDispatch: f.lateDispatch,
        recoveredRupeesPerDay: restocked ? Math.round((f.ordersPerDay.now - f.ordersPerDay.before) * seller.now.asp) : 0,
      };
    }
    case "escalate_to_human": {
      const a = { type: "Handed to human KAM", id: "ESC-" + (700 + session.actions.length * 5 + 3), detail: `${args.reason || "Seller request"}${args.context ? " - " + args.context : ""}. Callback within 30 min` };
      session.actions.push(a);
      return { ok: true, ...a };
    }
    case "estimate_impact":
      return computeImpact(selectedSeller);
    case "create_restock_task": {
      const id = "RST-" + (1000 + session.actions.length * 7 + 13);
      const skus = args.skus && args.skus.length
        ? args.skus
        : selectedSeller.id === seller.id
          ? newlyOutOfStock.slice(0, 5).map((p) => p.sku)
          : [];
      const detail = skus.length
        ? `Restock ${skus.join(", ")} (priority order)`
        : `Review low-stock items for ${selectedSeller.business} and create a restock plan`;
      const a = { type: "Restock task", id, detail };
      session.actions.push(a);
      return { ok: true, ...a };
    }
    case "raise_ticket": {
      const id = "TKT-" + (5000 + session.actions.length * 11 + 29);
      const a = { type: "Support ticket", id, detail: `${args.issue}${args.details ? " - " + args.details : ""}` };
      session.actions.push(a);
      return { ok: true, ...a };
    }
    case "schedule_followup": {
      const id = "FUP-" + (200 + session.actions.length * 3 + 5);
      const a = { type: "Follow-up call", id, detail: `In ${args.hours}h - ${args.topic}` };
      session.actions.push(a);
      return { ok: true, ...a };
    }
    case "send_summary": {
      const a = { type: `Summary via ${args.channel}`, id: "MSG-" + Date.now().toString().slice(-4), detail: String(args.text || "").slice(0, 140) };
      session.actions.push(a);
      return { ok: true, ...a };
    }
    default:
      return { error: "unknown tool " + name };
  }
}
