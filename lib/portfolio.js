// Portfolio engine: 11 mock sellers, each with a different root cause. Rakesh (the live-call seller) comes from data.js.
import { seller, computeImpact } from "./bridge.js";

export const CAUSES = {
  stockouts:  { label: "Stock-outs", recover: 0.7, fix: "Restock top SKUs by last-month orders; set low-stock alerts" },
  dispatch:   { label: "Slow dispatch / cancellations", recover: 0.6, fix: "Fixed daily pickup slot, packing cut-off, dispatch under 36h" },
  price:      { label: "Prices above market", recover: 0.5, fix: "Re-price top SKUs to category median; run a coupon" },
  ratings:    { label: "Poor ratings & returns", recover: 0.4, fix: "Fix packaging and product-match complaints; audit returns" },
  listings:   { label: "Weak listings", recover: 0.5, fix: "Refresh images and titles; enrol in category promotions" },
  visibility: { label: "Visibility / seasonal", recover: 0.3, fix: "Enrol in Year-End Sale; boost sponsored listings" },
};
// [id, name, city, tier, category, lastSales, dropPct, mix, daysSinceContact, voiceGender]
const RAW = [
  ["SD-51002","Imran Footwear Hub","Agra","Gold","Footwear",400000,27.5,{stockouts:.45,dispatch:.3,visibility:.25},null,"male"],
  ["SD-51044","Gupta Mobile Accessories","Delhi","Silver","Mobile accessories",280000,30,{price:.8,visibility:.2},3,"male"],
  ["SD-51970","Meena Kurtis & Ethnic Wear","Jaipur","Gold","Women's ethnic wear",320000,26.6,{dispatch:.76,ratings:.12,visibility:.12},null,"female"],
  ["SD-52011","Pooja Beauty & Personal Care","Mumbai","Silver","Beauty",240000,28.7,{price:.48,ratings:.32,visibility:.2},4,"female"],
  ["SD-52390","Sharma Kitchen & Cookware","Lucknow","Silver","Home & kitchen",260000,26.9,{ratings:.55,listings:.25,visibility:.2},5,"male"],
  ["SD-52477","Verma Home Decor","Pune","Bronze","Home decor",150000,22,{listings:.6,visibility:.4},9,"male"],
  ["SD-52610","Khan Kids Wear","Hyderabad","Silver","Kids fashion",180000,19,{stockouts:.6,dispatch:.4},12,"male"],
  ["SD-52833","Ramesh Stationery & Office","Chandigarh","Bronze","Stationery",90000,12,{visibility:.7,listings:.3},1,"male"],
  ["SD-53020","Bansal Sports Goods","Ludhiana","Bronze","Sports",110000,15,{price:.5,stockouts:.5},7,"male"],
  ["SD-53144","Joshi Toys & Games","Pune","Gold","Toys",210000,-15,{},2,"male"],
];
function build([id,name,city,tier,cat,last,dropPct,mix,days,voiceGender]) {
  const drop = Math.max(0, Math.round(last * dropPct / 100));
  const causes = Object.entries(mix).map(([k, w]) => ({ key: k, label: CAUSES[k].label, recover: CAUSES[k].recover, fix: CAUSES[k].fix, rupees: Math.round(drop * w / 100) * 100 }))
    .sort((a, b) => b.rupees - a.rupees);
  const recoverable = Math.round(causes.reduce((s, c) => s + c.rupees * CAUSES[c.key].recover, 0) / 100) * 100;
  const sales = Math.round(last * (1 - dropPct / 100));
  // 6-month trend: gentle growth then the slide in the final month
  const trend = [0.86, 0.9, 0.95, 0.98, 1, 1 - dropPct / 100].map((m) => Math.round(last * m));
  return { id, name, city, tier, category: cat, lastSales: last, sales, dropPct, drop, causes, voiceGender,
    mainCause: causes[0]?.label || "None", recoverable, daysSinceContact: days, trend,
    severity: dropPct >= 28 ? "critical" : dropPct >= 20 ? "high" : dropPct > 0 ? "watch" : "growing",
    actions: causes.slice(0, 3).map((c) => ({ cause: c.label, rupees: c.rupees, do: CAUSES[c.key].fix })) };
}
export function portfolio() {
  const sellers = RAW.map(build);
  // Replace one row with the live-call seller so the dashboard and the voice agent agree
  const imp = computeImpact();
  const live = build(["SD-48213", seller.business, "Delhi", "Gold", "Electronics & home", seller.last.sales, imp.totalDropPercent, { stockouts: imp.causes[0].rupees / imp.totalDropRupees, dispatch: imp.causes[1].rupees / imp.totalDropRupees, visibility: imp.causes[2].rupees / imp.totalDropRupees }, null, "male"]);
  live.live = true;
  sellers.push(live);
  sellers.sort((a, b) => b.recoverable - a.recoverable);
  sellers.forEach((s, i) => (s.rank = i + 1));
  const risk = sellers.filter((s) => s.drop > 0);
  const leak = {};
  risk.forEach((s) => s.causes.forEach((c) => (leak[c.label] = (leak[c.label] || 0) + c.rupees)));
  const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
  return {
    sellers, months,
    kpi: { monitored: sellers.length, atRisk: risk.length, critical: sellers.filter((s) => s.severity === "critical").length,
      leaking: risk.reduce((s, x) => s + x.drop, 0), recoverable: risk.reduce((s, x) => s + x.recoverable, 0),
      neverContacted: risk.filter((s) => s.daysSinceContact == null).length, growing: sellers.length - risk.length },
    leakage: Object.entries(leak).map(([label, rupees]) => ({ label, rupees })).sort((a, b) => b.rupees - a.rupees),
    trend: months.map((_, i) => sellers.reduce((s, x) => s + x.trend[i], 0)),
  };
}

export function sellerProfile(id) {
  const selected = portfolio().sellers.find((item) => item.id === id);
  if (!selected) return null;
  const voiceGender = selected.voiceGender;
  if (selected.id === seller.id) return { ...seller, voiceGender };

  const lastOrders = Math.max(1, Math.round(selected.lastSales / 500));
  const dispatchShare = selected.causes.find((cause) => cause.key === "dispatch")?.rupees / (selected.drop || 1) || 0;
  const stockoutShare = selected.causes.find((cause) => cause.key === "stockouts")?.rupees / (selected.drop || 1) || 0;
  const priceShare = selected.causes.find((cause) => cause.key === "price")?.rupees / (selected.drop || 1) || 0;
  const currentAsp = Math.round(500 * (1 + priceShare * 0.2));
  const nowOrders = Math.max(0, Math.round(selected.sales / currentAsp));
  const lastOutOfStock = 5;
  const nowOutOfStock = lastOutOfStock + Math.round(stockoutShare * 13);
  const lastImpressions = 100000;
  const nowImpressions = Math.round(lastImpressions * selected.sales / selected.lastSales);

  return {
    id: selected.id,
    name: selected.name.split(" ")[0],
    business: selected.name,
    category: selected.category,
    last: {
      sales: selected.lastSales,
      orders: lastOrders,
      cancellationRate: 8,
      asp: 500,
      outOfStock: lastOutOfStock,
    },
    now: {
      sales: selected.sales,
      orders: nowOrders,
      cancellationRate: 8 + Math.round(dispatchShare * 6),
      asp: currentAsp,
      outOfStock: nowOutOfStock,
    },
    visibility: {
      last: { impressions: lastImpressions, ctr: 2 },
      now: { impressions: nowImpressions, ctr: 2 },
    },
    dispatchSlaHours: 48,
    voiceGender,
    portfolio: selected,
  };
}
