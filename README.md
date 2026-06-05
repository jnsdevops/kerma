# Kerma · by Pionexis

> *The best purchase decision for this household, today.*

AI-Powered Household Procurement & Decision Intelligence Platform  
Agent: **Astride** · Built for Orange County, CA · Global-ready

---

## Architecture

```
KERMA MOBILE APP (React Native + Expo)
  │
  ├── engine/
  │   ├── ontology.ts          Core domain objects
  │   ├── costOptimizer.ts     THE decision engine
  │   ├── vehicleCost.ts       EV / gas / bike cost per mile
  │   └── priceDatabase.ts     OC 2025 prices (→ live API later)
  │
  ├── store/
  │   └── useKermaStore.ts     Zustand global state
  │
  ├── components/
  │   ├── KermaLogo.tsx        K Convergence SVG logo
  │   ├── AstrideAgent.tsx     AI agent bubble
  │   └── ScenarioCard.tsx     Plan comparison card
  │
  └── app/(tabs)/
      ├── index.tsx            Shop screen
      ├── dashboard.tsx        Savings dashboard
      ├── stock.tsx            Household stock
      └── profile.tsx          Vehicle + preferences
```

---

## Cost Formula

```
Real Cost = Σ(item prices − coupons)
          + miles × costPerMile(vehicle)   // EV: $0.07/mi | Gas: $0.17/mi
          + minutes × timeValue            // $0.33/min default
          + delivery fee + tip             // online mode
          + $2 × extra stops              // fragmentation
          + weatherPenalty                // rain → prefer delivery
          + carbonCost                    // eco mode
```

**This formula is the competitive moat.**  
Cart integration is an execution problem.  
Decision intelligence is the defensible asset.

---

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Expo Go app on your phone (free)

### Install

```bash
# 1. Install Expo CLI
npm install -g expo

# 2. Navigate to project
cd kerma

# 3. Install dependencies
npm install

# 4. Start development server
npx expo start

# 5. Scan QR code with Expo Go (iPhone) or Camera (Android)
```

### First run
- Open Expo Go on your phone
- Scan the QR code from terminal
- Allow location permission for real OC distances
- Add items → Optimize → See real scenarios

---

## Stores — Orange County

| Store | Location | Distance API |
|---|---|---|
| Walmart Supercenter | Tustin, CA | Google Maps |
| Ralph's | Irvine, CA | Haversine (local) |
| Target | Lake Forest, CA | Haversine (local) |
| Costco Wholesale | Laguna Hills, CA | Haversine (local) |

---

## Vehicle Support

| Type | Cost/mi | Notes |
|---|---|---|
| Gas | ~$0.17 | GAS_PRICE_OC = $4.75/gal |
| Hybrid | ~$0.09 | 50 MPG estimate |
| Electric | ~$0.07 | Edison OC $0.28/kWh ÷ 4 mi/kWh |
| PHEV | ~$0.11 | 60% electric |
| Bike/Walk | ~$0.01 | Near-zero |
| Transit | ~$0.02 | Fixed cost equivalent |

---

## Phase Roadmap

### Phase 1 — MVP (Now)
- ✅ Expo app shell with all screens
- ✅ K Convergence logo + Kerma design system
- ✅ 5-format list input (type, paste, photo, voice, file)
- ✅ Full cost optimizer (vehicle + weather + eco)
- ✅ 4 OC stores with real coordinates
- ✅ Brand comparison (Pampers vs Huggies)
- ✅ Astride explains every recommendation

### Phase 2 — Real Prices (Week 2-3)
- [ ] Kroger API → Ralph's live prices
- [ ] Walmart Affiliate API
- [ ] Redis cache (TTL 15 min)
- [ ] Google Maps Distance Matrix

### Phase 3 — Auth + Persistence (Week 4)
- [ ] Supabase Auth
- [ ] Cloud profile sync
- [ ] Push notifications (stock alerts)

### Phase 4 — Launch (Week 5-6)
- [ ] TestFlight (iOS)
- [ ] Google Play Beta
- [ ] Freemium → Kerma+ $6.99/mo

---

## Business Model

**Freemium → Kerma+ at $6.99/month**

Free: 1 store comparison  
Kerma+: 4 stores + brand comparison + full dashboard + voice/photo input

Average family saves $94/month → ROI = 13x the subscription cost.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo 52 |
| Navigation | Expo Router v4 |
| State | Zustand |
| Storage | AsyncStorage (local) → Supabase (cloud) |
| Fonts | Fraunces (serif) + Inter (sans) |
| GPS | expo-location |
| Camera | expo-camera |
| Voice | expo-speech + Web Speech API |
| Backend (Phase 2) | Node.js + FastAPI |
| Database | Supabase (PostgreSQL) |
| Cache | Redis |
| Prices | Kroger API + Walmart API + Zyte scraping |

---

*Kerma — A Pionexis product*  
*"Where all routes converge to the optimal decision."*
