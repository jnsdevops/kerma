// ═══════════════════════════════════════════
// KERMA · Price Database
// OC 2025 representative prices
// Source: scraped from Walmart, Ralph's,
// Target, Costco — Orange County locations
// Replace with live API calls in production
// ═══════════════════════════════════════════

export type StoreId = 'wm' | 'rp' | 'tg' | 'co';

export const STORE_CONFIGS = {
  wm: {
    id: 'wm' as StoreId,
    name: 'Walmart Supercenter',
    chain: 'walmart',
    city: 'Tustin',
    emoji: '🔵',
    bgColor: 'rgba(0,76,145,0.1)',
    lat: 33.7366,
    lng: -117.8228,
    open: '11 PM',
    delivery: { available: true, fee: 7.95, tip: 5, estimatedMinutes: 45 },
    couponRate: 0.03,
  },
  rp: {
    id: 'rp' as StoreId,
    name: "Ralph's",
    chain: 'ralphs',
    city: 'Irvine',
    emoji: '🔴',
    bgColor: 'rgba(220,0,0,0.08)',
    lat: 33.6913,
    lng: -117.7804,
    open: '12 AM',
    delivery: { available: true, fee: 9.95, tip: 5, estimatedMinutes: 60 },
    couponRate: 0.08,
  },
  tg: {
    id: 'tg' as StoreId,
    name: 'Target',
    chain: 'target',
    city: 'Lake Forest',
    emoji: '🎯',
    bgColor: 'rgba(204,0,0,0.08)',
    lat: 33.6387,
    lng: -117.6652,
    open: '10 PM',
    delivery: { available: true, fee: 0, tip: 0, estimatedMinutes: 30, isFree: true, label: 'Drive Up FREE' },
    couponRate: 0.05,
  },
  co: {
    id: 'co' as StoreId,
    name: 'Costco Wholesale',
    chain: 'costco',
    city: 'Laguna Hills',
    emoji: '🏢',
    bgColor: 'rgba(0,36,71,0.1)',
    lat: 33.5927,
    lng: -117.7027,
    open: '8:30 PM',
    delivery: { available: true, fee: 14.99, tip: 5, estimatedMinutes: 90 },
    couponRate: 0.00,
  },
} as const;

// Live prices — OC 2025 (replace with API calls)
export const PRICES: Record<string, Record<StoreId, number>> = {
  milk:    { wm: 2.84, rp: 4.29, tg: 3.79, co: 2.89 },
  eggs:    { wm: 4.98, rp: 8.99, tg: 5.49, co: 3.79 },
  bread:   { wm: 2.78, rp: 3.99, tg: 3.29, co: 2.49 },
  butter:  { wm: 5.48, rp: 6.99, tg: 5.99, co: 4.49 },
  chicken: { wm: 8.97, rp: 11.99, tg: 9.49, co: 7.49 },
  pasta:   { wm: 1.98, rp: 2.79, tg: 2.19, co: 1.49 },
  cheese:  { wm: 4.98, rp: 6.49, tg: 5.49, co: 3.99 },
  coffee:  { wm: 8.97, rp: 11.99, tg: 9.99, co: 7.99 },
  rice:    { wm: 4.98, rp: 6.99, tg: 5.49, co: 3.99 },
  cereal:  { wm: 3.98, rp: 5.49, tg: 4.29, co: 2.99 },
  yogurt:  { wm: 5.48, rp: 6.99, tg: 5.99, co: 4.49 },
  banana:  { wm: 0.58, rp: 0.79, tg: 0.69, co: 0.49 },
  apples:  { wm: 4.98, rp: 6.49, tg: 5.49, co: 3.99 },
  juice:   { wm: 3.48, rp: 4.49, tg: 3.79, co: 2.99 },
  soap:    { wm: 4.48, rp: 5.99, tg: 4.99, co: 3.49 },
  water:   { wm: 4.98, rp: 6.49, tg: 5.49, co: 3.99 },
  bacon:   { wm: 6.98, rp: 8.99, tg: 7.49, co: 5.99 },
  pampers: { wm: 32.97, rp: 39.99, tg: 34.99, co: 28.99 },
  huggies: { wm: 29.97, rp: 36.99, tg: 31.99, co: 26.49 },
  formula: { wm: 24.98, rp: 31.99, tg: 26.99, co: 22.99 },
  tylenol: { wm: 9.97, rp: 12.99, tg: 10.99, co: 8.99 },
  ibuprofen: { wm: 7.98, rp: 10.99, tg: 8.99, co: 7.49 },
};

export const COUPON_RATES: Record<StoreId, number> = {
  wm: 0.03, rp: 0.08, tg: 0.05, co: 0.00,
};

// Price history for trend display (4 months)
export const PRICE_HISTORY = [
  { emoji: '🥚', name: 'Eggs (12ct)',    vals: [4.12, 5.99, 7.40, 8.99], trend: 'up' as const },
  { emoji: '🥛', name: 'Milk (gal)',     vals: [3.20, 3.10, 3.05, 2.84], trend: 'dn' as const },
  { emoji: '🐔', name: 'Chicken (3lb)', vals: [9.20, 8.80, 8.50, 7.49], trend: 'dn' as const },
  { emoji: '🧈', name: 'Butter (1lb)',  vals: [5.20, 5.60, 5.48, 4.49], trend: 'dn' as const },
  { emoji: '☕', name: 'Coffee (12oz)', vals: [9.50, 9.20, 8.97, 7.99], trend: 'dn' as const },
  { emoji: '🍞', name: 'Bread (20oz)',  vals: [2.50, 2.65, 2.78, 2.49], trend: 'flat' as const },
];

// Brand comparison data
export const BRAND_COMPARISONS = {
  diapers: {
    category: 'Diapers',
    items: [
      { name: 'Huggies', priceKey: 'huggies', stars: 4.5, reviews: '98K',
        qualityScore: 91, promo: '-15% this week', recommended: true,
        reasoning: 'Similar quality to Pampers. Active promo makes it best value this week.' },
      { name: 'Pampers', priceKey: 'pampers', stars: 4.6, reviews: '124K',
        qualityScore: 88, promo: null, recommended: false,
        reasoning: 'Top rated for overnight protection. Slightly pricier this week.' },
      { name: 'Kirkland (Costco)', priceKey: 'pampers', stars: 4.3, reviews: '31K',
        qualityScore: 82, promo: null, recommended: false,
        reasoning: 'Best per-unit price for bulk buyers. Costco membership required.' },
    ],
  },
  milk: {
    category: 'Milk',
    items: [
      { name: 'Great Value (Walmart)', priceKey: 'milk', stars: 4.2, reviews: '87K',
        qualityScore: 85, promo: null, recommended: true,
        reasoning: 'No quality difference vs premium brands for daily use. Best price.' },
      { name: 'Horizon Organic', priceKey: 'milk', stars: 4.5, reviews: '41K',
        qualityScore: 88, promo: '-10%', recommended: false,
        reasoning: 'Good organic option with active discount. Worth it if organic is preferred.' },
      { name: 'Organic Valley', priceKey: 'milk', stars: 4.7, reviews: '22K',
        qualityScore: 90, promo: null, recommended: false,
        reasoning: 'Premium organic. Best if dietary preference set to organic.' },
    ],
  },
};

// Item emoji mapping
export const ITEM_EMOJIS: Record<string, string> = {
  milk: '🥛', egg: '🥚', eggs: '🥚', bread: '🍞', butter: '🧈',
  chicken: '🐔', pasta: '🍝', cheese: '🧀', coffee: '☕', rice: '🍚',
  cereal: '🥣', yogurt: '🍦', banana: '🍌', apple: '🍎', apples: '🍎',
  juice: '🥤', soap: '🧼', water: '💧', bacon: '🥓', pampers: '👶',
  huggies: '👶', diaper: '👶', formula: '🍼', tylenol: '💊', ibuprofen: '💊',
  medicine: '💊', tomato: '🍅', potato: '🥔', onion: '🧅', garlic: '🧄',
  broccoli: '🥦', carrot: '🥕', spinach: '🥬', avocado: '🥑',
  salmon: '🐟', tuna: '🐟', shrimp: '🦐', beef: '🥩', pork: '🥩',
  sugar: '🍬', flour: '🌾', oil: '🫙', vinegar: '🫙', salt: '🧂',
  pepper: '🧂', honey: '🍯', jam: '🍓', peanut: '🥜', almond: '🫘',
  chocolate: '🍫', cookie: '🍪', chip: '🥨', ice: '🧊', frozen: '🧊',
  shampoo: '🧴', conditioner: '🧴', toothpaste: '🪥', toilet: '🧻',
  detergent: '🫧', dishwash: '🫧', sponge: '🧽',
};

export function getEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(ITEM_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return '🛍';
}

export function getPriceKey(name: string): string | null {
  const lower = name.toLowerCase();
  return Object.keys(PRICES).find(k => lower.includes(k)) ?? null;
}

export function getBestPrice(name: string): { best: number; worst: number; storeId: StoreId; diff: number } | null {
  const key = getPriceKey(name);
  if (!key) return null;
  const p = PRICES[key];
  const entries = Object.entries(p) as [StoreId, number][];
  const best = entries.reduce((a, b) => a[1] <= b[1] ? a : b);
  const worst = entries.reduce((a, b) => a[1] >= b[1] ? a : b);
  return { best: best[1], worst: worst[1], storeId: best[0], diff: worst[1] - best[1] };
}
