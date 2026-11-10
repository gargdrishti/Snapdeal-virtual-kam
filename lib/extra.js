// Call history store (JSON file), seeded demo calls, and live quality checks.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url"; import { randomUUID } from "node:crypto";
import { portfolio } from "./portfolio.js"; import { computeImpact } from "./tools.js"; import { project } from "../public/plan.js";
const F = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "calls.json");
const iso = (d) => new Date(Date.now() - d * 864e5).toISOString();
const A = (t, ref, d) => ({ title: t, ref, detail: d });
const seed = () => [
  { id: "CALL-0283B7", demo: true, when: iso(0), sellerId: "SD-51970", seller: "Meena Kurtis & Ethnic Wear", type: "Riya called", outcome: "Actions agreed", secs: 5, mode: "offline",
    actions: [A("Fix task: Dispatch", "FIX-3110", "Daily pickup slot + packing cut-off at 4pm; target dispatch under 36h"), A("Fix task: Ratings", "FIX-3117", "Fix packaging and product-match complaints; audit returns"), A("Support ticket", "TKT-5113", "Request a fixed daily pickup window to bring dispatch under the 48h SLA"), A("Follow-up call", "FUP-303", "In 48h: progress on slow dispatch")],
    said: "Pickup comes late and my staff is short.", guardrails: ["off-topic request"], transcript: ["Riya: Hello Meena, I'm calling about your sales dip.", "Meena: Pickup comes late and my staff is short.", "Riya: I'll set a fixed pickup slot and a follow-up in 48 hours."] },
  { id: "CALL-DFE53C", demo: true, when: iso(3), sellerId: "SD-51044", seller: "Gupta Mobile Accessories", type: "Riya called", outcome: "Actions agreed", secs: 140, mode: "offline",
    actions: [A("Re-price top SKUs", "FIX-2201", "Move top 5 SKUs to category median"), A("Follow-up call", "FUP-204", "In 48h")], said: "Competitors are cheaper.", guardrails: [], transcript: ["Riya: Your average price is above market.", "Gupta: Competitors are cheaper."] },
  { id: "CALL-881218", demo: true, when: iso(4), sellerId: "SD-52011", seller: "Pooja Beauty & Personal Care", type: "Seller called", outcome: "Actions agreed", secs: 210, mode: "offline",
    actions: [A("Fix task: Packaging", "FIX-2310", "Audit returns"), A("Coupon", "FIX-2311", "Run a 5% coupon"), A("Follow-up call", "FUP-218", "In 48h")], said: "Returns are rising.", guardrails: [], transcript: ["Pooja: Returns are rising."] },
  { id: "CALL-8FC449", demo: true, when: iso(5), sellerId: "SD-52390", seller: "Sharma Kitchen & Cookware", type: "Seller called", outcome: "Escalated to human", secs: 75, mode: "offline",
    actions: [A("Escalated to senior KAM", "ESC-77", "Callback in 30 minutes with full context")], said: "This is useless, I want a human.", guardrails: ["frustration detected"], transcript: ["Sharma: This is useless, I want a human."] },
  { id: "CALL-9ACF99", demo: true, when: iso(9), sellerId: "SD-52833", seller: "Ramesh Stationery & Office", type: "Riya called", outcome: "No action needed", secs: 60, mode: "offline",
    actions: [A("Follow-up call", "FUP-120", "In 7 days")], said: "Just a seasonal dip.", guardrails: [], transcript: ["Ramesh: Just a seasonal dip."] },
];
let calls = null;
const load = () => { if (calls) return calls; try { calls = JSON.parse(fs.readFileSync(F, "utf8")); } catch { calls = seed(); } return calls; };
const save = () => { try { fs.mkdirSync(path.dirname(F), { recursive: true }); fs.writeFileSync(F, JSON.stringify(calls, null, 1)); } catch {} };
export const listCalls = () => [...load()].sort((a, b) => b.when.localeCompare(a.when));
export function addCall({ sellerId, type = "Riya called", outcome, secs = 0, mode = "offline", actions = [], said = "", transcript = [], guardrails = [] }) {
  const s = portfolio().sellers.find((x) => x.id === sellerId);
  const c = { id: "CALL-" + randomUUID().slice(0, 6).toUpperCase(), when: new Date().toISOString(), sellerId, seller: s?.name || sellerId, type,
    outcome: outcome || (actions.length ? "Actions agreed" : "No action needed"), secs, mode, actions, said, guardrails, transcript };
  load().push(c); save(); return c;
}
export function qualityChecks() {
  const P = portfolio(), imp = computeImpact(), groups = { Data: [], Diagnosis: [], Planner: [] };
  P.sellers.forEach((s) => {
    groups.Data.push(Math.abs(s.causes.reduce((a, c) => a + c.rupees, 0) - s.drop) <= 300);
    groups.Data.push(s.drop === 0 || Math.abs(s.sales + s.drop - s.lastSales) <= 1);
  });
  groups.Data.push(new Set(P.sellers.map((s) => s.rank)).size === P.sellers.length);
  groups.Diagnosis.push(Math.abs(imp.causes.reduce((a, c) => a + c.rupees, 0) - imp.totalDropRupees) <= 100, imp.causes.every((c) => c.rupees >= 0));
  P.sellers.filter((s) => s.drop).forEach((s) => groups.Diagnosis.push(s.causes[0].rupees === Math.max(...s.causes.map((c) => c.rupees)), s.recoverable <= s.drop));
  P.sellers.filter((s) => s.drop).forEach((s) => {
    const none = project(s, {}), all = project(s, Object.fromEntries([...s.causes.map((c) => [c.key, 1]), ["sale", true]]));
    groups.Planner.push(none.gain === 0, all.projected >= none.projected, all.gain - s.sales * 0.0625 <= s.drop);
  });
  return Object.entries(groups).map(([name, r]) => ({ name, pass: r.filter(Boolean).length, total: r.length }));
}
