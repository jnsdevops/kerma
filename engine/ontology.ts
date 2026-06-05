// ═══════════════════════════════════════════
// KERMA · Ontology
// Core domain objects and their relationships
// "What is the best purchase decision for this
//  household today?" — the central question
// ═══════════════════════════════════════════

// ── HOUSEHOLD ──────────────────────────────
export interface Household {
  id: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    zip: string;
  };
  members: {
    adults: number;
    kids: number;
    babyAge?: 'newborn' | 'infant' | 'toddler' | null;
  };
  vehicle: Vehicle;
  preferences: HouseholdPreferences;
  budget: {
    weekly: number;
    currency: string;
  };
  privacyMode: 'minimal' | 'standard' | 'full';
}

export interface Vehicle {
  type: 'gas' | 'hybrid' | 'electric' | 'phev' | 'bike' | 'transit';
  mpg?: number;           // gas/hybrid
  evEfficiency?: number;  // miles/kWh for EV
  evKwhRate?: number;     // $/kWh local utility rate
}

export interface HouseholdPreferences {
  allergies: string[];
  diet: 'none' | 'gluten-free' | 'dairy-free' | 'vegan' | 'halal' | 'kosher';
  ecoMode: 'none' | 'local' | 'organic' | 'lowcarbon';
  qualityWeight: 'balanced' | 'price-first' | 'quality-first';
}

// ── STORE ──────────────────────────────────
export interface Store {
  id: 'wm' | 'rp' | 'tg' | 'co';
  name: string;
  chain: 'walmart' | 'ralphs' | 'target' | 'costco';
  city: string;
  location: { lat: number; lng: number };
  distanceMiles?: number;  // calculated from household GPS
  hours: { open: string; close: string };
  delivery: DeliveryOption;
  couponRate: number;      // avg discount from loyalty/digital coupons
  apiStatus: 'live' | 'cached' | 'simulated';
}

export interface DeliveryOption {
  available: boolean;
  fee: number;
  tip?: number;
  estimatedMinutes: number;
  isFree?: boolean;        // Target Drive Up
  label?: string;
}

// ── PRODUCT ────────────────────────────────
export interface Product {
  id: string;
  name: string;
  category: string;
  emoji: string;
  prices: Record<string, number>;  // storeId → price
  quantity: number;
  unit?: string;
  brandOptions?: Brand[];          // Pampers vs Huggies etc.
}

export interface Brand {
  name: string;
  priceKey: string;
  stars: number;
  reviewCount: string;
  qualityScore: number;     // 0-100 Kerma score
  promo?: string;
  recommended?: boolean;
  reasoning: string;        // Astride explanation
}

// ── TRIP ───────────────────────────────────
// The core output of the optimization engine
export interface Trip {
  id: string;
  mode: 'instore' | 'online' | 'hybrid';
  stores: string[];          // store IDs
  items: TripItem[];
  costs: TripCosts;
  route?: Store[];           // ordered for TSP
  humanApproved: boolean;    // NEVER true without explicit action
  approvedAt?: Date;
  context: TripContext;      // what conditions at optimization time
}

export interface TripItem {
  product: Product;
  storeId: string;
  price: number;
  qty: number;
  brand?: Brand;
}

export interface TripCosts {
  items: number;             // sum of products
  coupons: number;           // total discount applied
  gas: number;               // miles × costPerMile
  delivery: number;          // online delivery fee + tip
  time: number;              // minutes × timeValue $/min
  fragmentation: number;     // $2 × extra stops
  weather: number;           // penalty if rain
  carbon: number;            // symbolic eco cost
  total: number;             // the real cost
  totalMinutes: number;
  totalMiles: number;
}

export interface TripContext {
  optimizedAt: Date;
  weatherCondition: string;
  vehicleType: string;
  costPerMile: number;
  ecoMode: string;
  gpsLocked: boolean;
}

// ── SCENARIO ───────────────────────────────
// A ranked plan option presented to the user
export interface Scenario {
  id: string;
  badge: string;
  label: string;
  name: string;
  sub: string;
  type: 'store' | 'online';
  trip: Trip;
  saving: number;           // vs most expensive option
  reasoning: string;        // Astride's explanation — always shown
  recommended: boolean;
}

// ── STOCK ITEM ─────────────────────────────
export interface StockItem {
  name: string;
  emoji: string;
  percentRemaining: number;  // 0-100 estimated
  status: 'ok' | 'low' | 'out';
  daysLeft: string;
  category: 'food' | 'baby' | 'medicine' | 'cleaning';
  expiryRisk?: 'low' | 'medium' | 'high';
}

// ── TRIP RECORD ────────────────────────────
// Persisted after user approves a plan
export interface TripRecord {
  id: string;
  date: string;
  name: string;
  sub: string;
  total: number;
  saving: number;
  score: number;
  type: 'store' | 'online';
  itemCount: number;
  miles: number;
  minutes: number;
  budgetRespected: boolean;
  vehicleType: string;
}
