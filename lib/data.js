// ---------- MOCK SELLER DATA (no real Snapdeal data) ----------
// Core numbers come from the assignment brief. Everything marked ASSUMPTION is mine.
export const seller = {
  id: "SD-48213",
  name: "Rakesh",
  business: "Rakesh Electronics & Home",
  category: "Mobile accessories, electronics, home & kitchen",
  last: { sales: 200000, orders: 400, cancellationRate: 8, asp: 500, outOfStock: 5 },
  now:  { sales: 135000, orders: 270, cancellationRate: 14, asp: 500, outOfStock: 18 },
  // ASSUMPTION: visibility metrics (not in brief) - search impressions on Snapdeal listings
  visibility: { last: { impressions: 150000, ctr: 2.0 }, now: { impressions: 98000, ctr: 2.1 } },
  // ASSUMPTION: "orders" are net (delivered / not cancelled); gross = net / (1 - cancellation rate)
  dispatchSlaHours: 48, // ASSUMPTION: platform dispatch SLA
};

// ASSUMPTION: the 13 products that newly went out of stock, with last-month orders and days out of stock this month.
export const newlyOutOfStock = [
  { sku: "EB-210", name: "Wireless Earbuds TWS-210", lastMonthOrders: 22, daysOos: 20 },
  { sku: "PC-3PK", name: "Mobile Phone Case (Pack of 3)", lastMonthOrders: 15, daysOos: 18 },
  { sku: "CH-33W", name: "Fast Charger 33W", lastMonthOrders: 12, daysOos: 14 },
  { sku: "BS-MINI", name: "Bluetooth Speaker Mini", lastMonthOrders: 10, daysOos: 12 },
  { sku: "KT-SET", name: "Men's Cotton Kurta Set", lastMonthOrders: 9, daysOos: 15 },
  { sku: "NS-TAWA", name: "Non-stick Tawa 28cm", lastMonthOrders: 8, daysOos: 10 },
  { sku: "SW-BAND", name: "Smart Watch Band", lastMonthOrders: 7, daysOos: 16 },
  { sku: "LED-DL", name: "LED Desk Lamp", lastMonthOrders: 6, daysOos: 9 },
  { sku: "KS-JAR", name: "Kitchen Storage Jar Set", lastMonthOrders: 5, daysOos: 11 },
  { sku: "USB-2PK", name: "USB Cable 1m (Pack of 2)", lastMonthOrders: 4, daysOos: 20 },
  { sku: "YM-6MM", name: "Yoga Mat 6mm", lastMonthOrders: 3, daysOos: 8 },
  { sku: "SB-W", name: "Women's Sling Bag", lastMonthOrders: 3, daysOos: 6 },
  { sku: "PT-STD", name: "Phone Tripod Stand", lastMonthOrders: 2, daysOos: 7 },
];
export const alreadyOutOfStockCount = 5; // the 5 that were already OOS last month

// ASSUMPTION: cancellation reason split (gross cancelled orders)
export const cancellations = {
  last: { total: 35, reasons: { "Stock unavailable (seller)": 7, "Late dispatch / SLA breach": 8, "Buyer changed mind": 15, "Address / unreachable": 5 } },
  now:  { total: 44, reasons: { "Stock unavailable (seller)": 22, "Late dispatch / SLA breach": 14, "Buyer changed mind": 6, "Address / unreachable": 2 } },
};

// ASSUMPTION: category price benchmark for the top sellers (mock)
export const priceBenchmark = [
  { name: "Wireless Earbuds TWS-210", yours: 799, categoryMedian: 815 },
  { name: "Mobile Phone Case (Pack of 3)", yours: 299, categoryMedian: 310 },
  { name: "Fast Charger 33W", yours: 449, categoryMedian: 440 },
  { name: "Bluetooth Speaker Mini", yours: 699, categoryMedian: 720 },
  { name: "Men's Cotton Kurta Set", yours: 549, categoryMedian: 560 },
];
// ASSUMPTION: upcoming platform event (mock)
export const events = [{ name: "Year-End Sale", startsInDays: 21, expectedLiftPct: 25 }];
// ASSUMPTION: what the account looks like 48 hours after the call, if the agreed actions were taken
export const followup = {
  restockedSkus: ["EB-210", "PC-3PK", "CH-33W"],
  pendingSkus: ["BS-MINI", "KT-SET"],
  cancellationRateLast48h: 10.5,
  ordersPerDay: { before: 9.0, now: 12.4 },
  lateDispatch: { before: "5 of 22", now: "2 of 31" },
};
