// ═══════════════════════════════════════════
// KERMA · Global State (Zustand)
// Simple, fast, no boilerplate
// ═══════════════════════════════════════════

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Household, Scenario, TripRecord, StockItem } from '../engine/ontology';

interface ListItem {
  id: string;
  name: string;
  qty: number;
  emoji: string;
}

interface KermaState {
  // ── HOUSEHOLD ──
  household: Household;
  setHousehold: (h: Partial<Household>) => void;

  // ── LIST ──
  items: ListItem[];
  addItem: (name: string, qty: number, emoji: string) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  setItems: (items: ListItem[]) => void;

  // ── OPTIMIZATION ──
  scenarios: Scenario[];
  setScenarios: (s: Scenario[]) => void;
  chosenScenario: Scenario | null;
  setChosenScenario: (s: Scenario | null) => void;
  isOptimizing: boolean;
  setIsOptimizing: (v: boolean) => void;

  // ── TRIPS ──
  trips: TripRecord[];
  addTrip: (t: TripRecord) => void;

  // ── STOCK ──
  stock: StockItem[];

  // ── GPS ──
  gpsLocked: boolean;
  setGpsLocked: (v: boolean) => void;
  setLocation: (lat: number, lng: number) => void;

  // ── PLAN ──
  isPremium: boolean; // MVP: always true

  // ── PERSIST ──
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const DEFAULT_HOUSEHOLD: Household = {
  id: 'household-1',
  location: { lat: 33.6846, lng: -117.8265, city: 'Irvine', zip: '92618' },
  members: { adults: 2, kids: 2, babyAge: null },
  vehicle: { type: 'gas', mpg: 28 },
  preferences: {
    allergies: [],
    diet: 'none',
    ecoMode: 'none',
    qualityWeight: 'balanced',
  },
  budget: { weekly: 180, currency: 'USD' },
  privacyMode: 'standard',
};

const DEFAULT_STOCK: StockItem[] = [
  { name: 'Milk (1 gal)',    emoji: '🥛', percentRemaining: 5,  status: 'out', daysLeft: 'Out now',      category: 'food' },
  { name: 'Eggs (12ct)',     emoji: '🥚', percentRemaining: 10, status: 'out', daysLeft: 'Out now',      category: 'food' },
  { name: 'Bread',           emoji: '🍞', percentRemaining: 20, status: 'low', daysLeft: '~1 day left',  category: 'food' },
  { name: 'Butter',          emoji: '🧈', percentRemaining: 35, status: 'low', daysLeft: '~2 days left', category: 'food' },
  { name: 'Chicken breast',  emoji: '🐔', percentRemaining: 0,  status: 'out', daysLeft: 'Out now',      category: 'food' },
  { name: 'Cheese',          emoji: '🧀', percentRemaining: 60, status: 'ok',  daysLeft: '~4 days left', category: 'food' },
  { name: 'Coffee',          emoji: '☕', percentRemaining: 72, status: 'ok',  daysLeft: '~1 week',      category: 'food' },
  { name: 'Pasta',           emoji: '🍝', percentRemaining: 80, status: 'ok',  daysLeft: '~10 days',     category: 'food' },
];

export const useKermaStore = create<KermaState>((set, get) => ({
  household: DEFAULT_HOUSEHOLD,
  setHousehold: (updates) =>
    set(state => ({ household: { ...state.household, ...updates } })),

  items: [],
  addItem: (name, qty, emoji) =>
    set(state => ({
      items: [...state.items, {
        id: Date.now().toString(),
        name, qty, emoji,
      }],
    })),
  removeItem: (id) =>
    set(state => ({ items: state.items.filter(i => i.id !== id) })),
  clearItems: () => set({ items: [] }),
  setItems: (items) => set({ items }),

  scenarios: [],
  setScenarios: (scenarios) => set({ scenarios }),
  chosenScenario: null,
  setChosenScenario: (s) => set({ chosenScenario: s }),
  isOptimizing: false,
  setIsOptimizing: (v) => set({ isOptimizing: v }),

  trips: [],
  addTrip: (trip) =>
    set(state => {
      const trips = [trip, ...state.trips].slice(0, 20);
      AsyncStorage.setItem('kerma_trips', JSON.stringify(trips));
      return { trips };
    }),

  stock: DEFAULT_STOCK,

  gpsLocked: false,
  setGpsLocked: (v) => set({ gpsLocked: v }),
  setLocation: (lat, lng) =>
    set(state => ({
      household: {
        ...state.household,
        location: { ...state.household.location, lat, lng },
      },
    })),

  isPremium: true, // MVP phase — all features unlocked

  loadFromStorage: async () => {
    try {
      const [profileStr, tripsStr] = await Promise.all([
        AsyncStorage.getItem('kerma_profile'),
        AsyncStorage.getItem('kerma_trips'),
      ]);
      if (profileStr) {
        const saved = JSON.parse(profileStr);
        set(state => ({ household: { ...state.household, ...saved } }));
      }
      if (tripsStr) {
        set({ trips: JSON.parse(tripsStr) });
      }
    } catch (e) {
      console.log('Storage load error:', e);
    }
  },

  saveToStorage: async () => {
    const { household, trips } = get();
    await Promise.all([
      AsyncStorage.setItem('kerma_profile', JSON.stringify(household)),
      AsyncStorage.setItem('kerma_trips', JSON.stringify(trips)),
    ]);
  },
}));
