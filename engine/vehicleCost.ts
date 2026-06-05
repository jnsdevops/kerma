// ═══════════════════════════════════════════
// KERMA · Vehicle Cost Engine
// Calculates real cost per mile for any
// vehicle type — gas, EV, hybrid, bike, transit
// ═══════════════════════════════════════════

import { Vehicle } from './ontology';

const GAS_PRICE_OC = 4.75;     // $/gal — OC average 2025
const TRANSIT_COST = 0.02;     // $/mi equivalent
const BIKE_COST = 0.01;        // near-zero, wear/time only

export function costPerMile(vehicle: Vehicle): number {
  switch (vehicle.type) {
    case 'electric': {
      const eff = vehicle.evEfficiency ?? 4;      // miles/kWh
      const rate = vehicle.evKwhRate ?? 0.28;     // Edison OC $/kWh
      return rate / eff;                          // e.g. 0.28/4 = $0.07/mi
    }
    case 'hybrid':
      return GAS_PRICE_OC / (vehicle.mpg ?? 50);  // ~$0.09/mi
    case 'phev':
      return GAS_PRICE_OC / (vehicle.mpg ?? 40) * 0.6; // 60% electric
    case 'bike':
      return BIKE_COST;
    case 'transit':
      return TRANSIT_COST;
    case 'gas':
    default:
      return GAS_PRICE_OC / (vehicle.mpg ?? 28);  // ~$0.17/mi
  }
}

export function vehicleLabel(vehicle: Vehicle): string {
  const cpm = costPerMile(vehicle).toFixed(3);
  const labels: Record<string, string> = {
    gas: `Gas · $${cpm}/mi`,
    hybrid: `Hybrid · $${cpm}/mi`,
    electric: `EV · $${cpm}/mi ⚡`,
    phev: `PHEV · $${cpm}/mi`,
    bike: `Bike · ~free`,
    transit: `Transit · $${cpm}/mi`,
  };
  return labels[vehicle.type] ?? `$${cpm}/mi`;
}

export function vehicleIcon(type: string): string {
  const icons: Record<string, string> = {
    gas: '🚗',
    hybrid: '🚗',
    electric: '⚡',
    phev: '⚡',
    bike: '🚲',
    transit: '🚌',
  };
  return icons[type] ?? '🚗';
}

export function carbonCostPerMile(vehicle: Vehicle): number {
  // Symbolic carbon cost in $ — for eco mode display
  switch (vehicle.type) {
    case 'electric':
    case 'bike':
      return 0;
    case 'hybrid':
    case 'phev':
      return 0.002;
    default:
      return 0.005;
  }
}

export function isZeroEmission(vehicle: Vehicle): boolean {
  return vehicle.type === 'electric' || vehicle.type === 'bike';
}

// Astride's explanation for vehicle impact on this trip
export function vehicleImpactExplanation(vehicle: Vehicle, miles: number): string {
  const cpm = costPerMile(vehicle);
  const tripCost = (miles * cpm * 2).toFixed(2); // round trip

  switch (vehicle.type) {
    case 'electric':
      return `Your EV costs $${cpm.toFixed(3)}/mi — making multi-stop trips ${Math.round((0.17 - cpm) / 0.17 * 100)}% cheaper than a gas car. Multi-store plan becomes more viable for you.`;
    case 'bike':
      return `Zero fuel cost detected. Astride optimized purely on item prices and your time — travel cost is negligible.`;
    case 'transit':
      return `Transit cost applied. Astride favored fewer, closer stops.`;
    case 'hybrid':
      return `Hybrid efficiency reduces travel cost to $${tripCost} for this ${miles.toFixed(1)}-mile round trip.`;
    default:
      return `Gas cost: $${tripCost} for this ${miles.toFixed(1)}-mile round trip at $${cpm.toFixed(3)}/mi.`;
  }
}
