// ═══════════════════════════════════════════
// KERMA · Cost Optimizer
// The core decision engine
//
// Central question:
// "Among 50 similar products sold in 10 stores,
//  what is the best decision for THIS household
//  TODAY?"
//
// This engine is the competitive moat.
// Cart integration is an execution problem.
// Decision intelligence is the defensible asset.
// ═══════════════════════════════════════════

import { Household, Scenario, TripCosts, TripContext } from './ontology';
import { costPerMile, carbonCostPerMile, vehicleImpactExplanation, vehicleLabel } from './vehicleCost';
import { PRICES, STORE_CONFIGS, COUPON_RATES, getPriceKey } from './priceDatabase';

const TIME_VALUE_DEFAULT = 0.33; // $/min — user's implicit time cost

// Haversine distance formula
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface ListItem {
  name: string;
  qty: number;
  emoji: string;
}

interface OptimizeParams {
  items: ListItem[];
  household: Household;
  timeValue?: number;
  weatherPenalty?: number;    // $ penalty for bad weather → prefer delivery
  maxStops?: number;
}

function getItemCost(name: string, storeId: string): number {
  const key = getPriceKey(name);
  if (!key) return 4.50; // fallback average
  return (PRICES[key] as any)[storeId] ?? 4.50;
}

function totalItemsCost(items: ListItem[], storeId: string, couponRate: number): number {
  const raw = items.reduce((sum, item) => sum + getItemCost(item.name, storeId) * item.qty, 0);
  return raw * (1 - couponRate);
}

function distanceFromHousehold(household: Household, storeId: string): number {
  const store = STORE_CONFIGS[storeId as keyof typeof STORE_CONFIGS];
  return haversine(
    household.location.lat, household.location.lng,
    store.lat, store.lng
  );
}

function buildContext(household: Household, weatherPenalty: number): TripContext {
  const cpm = costPerMile(household.vehicle);
  return {
    optimizedAt: new Date(),
    weatherCondition: weatherPenalty > 0 ? 'rain' : 'clear',
    vehicleType: household.vehicle.type,
    costPerMile: cpm,
    ecoMode: household.preferences.ecoMode,
    gpsLocked: true,
  };
}

function buildInStoreCosts(
  storeIds: string[],
  household: Household,
  items: ListItem[],
  timeValue: number,
  weatherPenalty: number
): TripCosts {
  const cpm = costPerMile(household.vehicle);

  // Total miles (round trip to all stores)
  const totalMiles = storeIds.reduce((sum, sid) =>
    sum + distanceFromHousehold(household, sid), 0) * 2;

  const gasCost = totalMiles * cpm;
  const travelMinutes = storeIds.length * 8 + 6; // drive time
  const storeMinutes = storeIds.length * 22;      // browse time
  const totalMinutes = travelMinutes + storeMinutes;
  const timeCost = totalMinutes * timeValue;
  const fragmentation = (storeIds.length - 1) * 2; // $2 per extra stop

  // Best price split across stores
  let itemsCost: number;
  if (storeIds.length === 1) {
    const coupon = COUPON_RATES[storeIds[0] as keyof typeof COUPON_RATES] ?? 0;
    itemsCost = totalItemsCost(items, storeIds[0], coupon);
  } else {
    // Multi-store: use best store for each item
    const baseMin = Math.min(...storeIds.map(sid => {
      const c = COUPON_RATES[sid as keyof typeof COUPON_RATES] ?? 0;
      return totalItemsCost(items, sid, c);
    }));
    itemsCost = baseMin * 0.94; // 6% benefit from cherry-picking
  }

  const coupons = storeIds.reduce((sum, sid) => {
    const c = COUPON_RATES[sid as keyof typeof COUPON_RATES] ?? 0;
    return sum + totalItemsCost(items, sid, 0) * c;
  }, 0) / storeIds.length;

  const carbon = carbonCostPerMile(household.vehicle) * totalMiles;

  return {
    items: itemsCost,
    coupons,
    gas: gasCost,
    delivery: 0,
    time: timeCost,
    fragmentation,
    weather: weatherPenalty,
    carbon,
    total: itemsCost + gasCost + timeCost + fragmentation + weatherPenalty + carbon,
    totalMinutes,
    totalMiles,
  };
}

function buildOnlineCosts(
  storeId: string,
  household: Household,
  items: ListItem[],
  timeValue: number
): TripCosts {
  const store = STORE_CONFIGS[storeId as keyof typeof STORE_CONFIGS];
  const coupon = COUPON_RATES[storeId as keyof typeof COUPON_RATES] ?? 0;
  const itemsCost = totalItemsCost(items, storeId, coupon);
  const coupons = totalItemsCost(items, storeId, 0) * coupon;
  const delivery = (store.delivery.fee ?? 0) + (store.delivery.tip ?? 0);
  const cartTime = 12; // minutes to build cart online
  const timeCost = cartTime * timeValue;

  return {
    items: itemsCost,
    coupons,
    gas: 0,
    delivery,
    time: timeCost,
    fragmentation: 0,
    weather: 0,
    carbon: 0,
    total: itemsCost + delivery + timeCost,
    totalMinutes: store.delivery.estimatedMinutes,
    totalMiles: 0,
  };
}

function buildScenarioReasoning(
  storeIds: string[],
  type: 'store' | 'online',
  costs: TripCosts,
  household: Household,
  index: number
): string {
  const vehicle = household.vehicle;
  const cpm = costPerMile(vehicle);

  if (type === 'online') {
    const store = STORE_CONFIGS[storeIds[0] as keyof typeof STORE_CONFIGS];
    if (store.delivery.isFree) {
      return `Zero delivery fee. Ready in ${store.delivery.estimatedMinutes}min. Best for busy days or when weather is bad.`;
    }
    return `Best online option. Delivery fee of $${store.delivery.fee} offset by ${Math.round(costs.coupons / costs.items * 100)}% coupon savings.`;
  }

  if (storeIds.length > 1) {
    if (vehicle.type === 'electric') {
      return `EV advantage: at $${cpm.toFixed(3)}/mi, multi-stop trips cost ${Math.round((0.17 - cpm) / 0.17 * 100)}% less than gas. Best balance of price and travel cost for your vehicle.`;
    }
    return `Best balance: item savings from multi-store split outweigh the extra $${costs.gas.toFixed(2)} in gas. Real total is lower than any single-store option.`;
  }

  if (index === 1) {
    return `Fastest option — single stop, ${costs.totalMinutes}min total. Slightly higher item cost offset by zero fragmentation and minimum travel time.`;
  }

  return `Optimized for your household context: ${vehicleLabel(vehicle)}, ${household.preferences.ecoMode !== 'none' ? household.preferences.ecoMode + ' mode, ' : ''}${storeIds.length} stop${storeIds.length > 1 ? 's' : ''}.`;
}

export function optimize(params: OptimizeParams): Scenario[] {
  const { items, household, timeValue = TIME_VALUE_DEFAULT, weatherPenalty = 0 } = params;

  if (!items.length) return [];

  const storeIds = Object.keys(STORE_CONFIGS);
  const context = buildContext(household, weatherPenalty);

  const scenarios: Scenario[] = [];

  // ── SCENARIO 1: Best multi-stop in-store ──
  const pairs = [['wm', 'rp'], ['wm', 'tg'], ['rp', 'tg'], ['wm', 'co']];
  const bestPair = pairs.reduce<{ ids: string[]; costs: TripCosts } | null>((best, pair) => {
    const costs = buildInStoreCosts(pair, household, items, timeValue, weatherPenalty);
    if (!best || costs.total < best.costs.total) return { ids: pair, costs };
    return best;
  }, null)!;

  // ── SCENARIO 2: Best single-stop in-store ──
  const bestSingle = storeIds.reduce<{ id: string; costs: TripCosts } | null>((best, sid) => {
    const costs = buildInStoreCosts([sid], household, items, timeValue, 0);
    if (!best || costs.total < best.costs.total) return { id: sid, costs };
    return best;
  }, null)!;

  // ── SCENARIO 3: Best online ──
  const bestOnline = storeIds.reduce<{ id: string; costs: TripCosts } | null>((best, sid) => {
    const costs = buildOnlineCosts(sid, household, items, timeValue);
    if (!best || costs.total < best.costs.total) return { id: sid, costs };
    return best;
  }, null)!;

  // ── SCENARIO 4: Target Drive Up (always shown if available) ──
  const driveUpCosts = buildOnlineCosts('tg', household, items, timeValue);

  const rawScenarios = [
    {
      ids: bestPair.ids,
      costs: bestPair.costs,
      type: 'store' as const,
      badge: 'sb-k',
      label: '⭐ Best balance',
      name: 'Optimal multi-stop',
      sub: bestPair.ids.map(id => STORE_CONFIGS[id as keyof typeof STORE_CONFIGS].name).join(' + '),
    },
    {
      ids: [bestSingle.id],
      costs: bestSingle.costs,
      type: 'store' as const,
      badge: 'sb-g',
      label: '⚡ Fastest',
      name: `Single stop · ${STORE_CONFIGS[bestSingle.id as keyof typeof STORE_CONFIGS].name}`,
      sub: `${STORE_CONFIGS[bestSingle.id as keyof typeof STORE_CONFIGS].name} · 1 stop only`,
    },
    {
      ids: [bestOnline.id],
      costs: bestOnline.costs,
      type: 'online' as const,
      badge: 'sb-b',
      label: '🛒 Best online',
      name: `Online · ${STORE_CONFIGS[bestOnline.id as keyof typeof STORE_CONFIGS].name}`,
      sub: `${STORE_CONFIGS[bestOnline.id as keyof typeof STORE_CONFIGS].name} · same-day`,
    },
    {
      ids: ['tg'],
      costs: driveUpCosts,
      type: 'online' as const,
      badge: 'sb-p',
      label: '🎯 Drive Up FREE',
      name: 'Target Drive Up',
      sub: 'target.com · FREE · ready in ~30min',
    },
  ];

  const maxTotal = Math.max(...rawScenarios.map(s => s.costs.total));

  return rawScenarios.map((s, i) => ({
    id: `scenario-${i}`,
    badge: s.badge,
    label: s.label,
    name: s.name,
    sub: s.sub,
    type: s.type,
    trip: {
      id: `trip-${i}`,
      mode: s.type === 'store' ? 'instore' : 'online',
      stores: s.ids,
      items: [],
      costs: s.costs,
      humanApproved: false,  // NEVER true without explicit user action
      context,
    },
    saving: maxTotal - s.costs.total,
    reasoning: buildScenarioReasoning(s.ids, s.type, s.costs, household, i),
    recommended: i === 0,
  }));
}

export function calcOptimizationScore(
  scenario: Scenario,
  saving: number,
  maxTotal: number,
  budget: number,
  isPremium: boolean
): number {
  let score = 0;
  score += Math.min(40, Math.round((saving / maxTotal) * 100) * 0.4);
  score += scenario.trip.costs.total <= budget ? 20 : 0;
  score += Math.min(15, Math.round((1 - (scenario.trip.costs.totalMiles / 20)) * 15));
  score += isPremium ? 15 : 5;
  score += Math.min(10, Math.round((1 - scenario.trip.costs.totalMinutes / 120) * 10));
  return Math.max(0, Math.min(100, Math.round(score)));
}
