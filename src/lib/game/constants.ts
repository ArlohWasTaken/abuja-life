export type OriginType = "corper" | "contractor" | "gwarinpa" | "nepo";

export interface OriginConfig {
  id: OriginType;
  title: string;
  startingCash: number;
  startingApartment: string;
  startingLocation: string;
  perkDescription: string;
  cloutBonus: number;
}

export const ORIGINS: Record<OriginType, OriginConfig> = {
  corper: {
    id: "corper",
    title: "The Federal Corper",
    startingCash: 33000,
    startingApartment: "kubwa_bq",
    startingLocation: "secretariat",
    perkDescription: "+20% Energy Recovery, lobbies for absorption",
    cloutBonus: 10,
  },
  contractor: {
    id: "contractor",
    title: "The Hopeful Contractor",
    startingCash: 150000,
    startingApartment: "gwarinpa_flat",
    startingLocation: "secretariat",
    perkDescription: "+15% Clout, carries brown leather tender envelope",
    cloutBonus: 35,
  },
  gwarinpa: {
    id: "gwarinpa",
    title: "The Gwarinpa Landlord",
    startingCash: 80000,
    startingApartment: "gwarinpa_flat",
    startingLocation: "gwarinpa",
    perkDescription: "+25% Fun recovery in Gwarinpa, drives clean C300",
    cloutBonus: 50,
  },
  nepo: {
    id: "nepo",
    title: "The Minister's Nepo / VIP",
    startingCash: 2500000,
    startingApartment: "maitama_mansion",
    startingLocation: "maitama",
    perkDescription: "Rent paid by Daddy, immune to VIO checkpoints, +50% Clout",
    cloutBonus: 200,
  },
};

export interface DistrictConfig {
  id: string;
  name: string;
  description: string;
  emoji: string;
  cameraPosition: [number, number, number];
  bounds: { width: number; depth: number };
}

export const DISTRICTS: Record<string, DistrictConfig> = {
  secretariat: {
    id: "secretariat",
    name: "Federal Secretariat & CBD",
    description: "The engine of government. Carry files, stamp memos, lobby directors.",
    emoji: "🏛️",
    cameraPosition: [18, 18, 18],
    bounds: { width: 14, depth: 14 },
  },
  wuse2: {
    id: "wuse2",
    name: "Wuse 2 & Banex Plaza",
    description: "Shawarma spots, buzzing lounges, and aggressive gadget deals.",
    emoji: "🍾",
    cameraPosition: [16, 16, 16],
    bounds: { width: 16, depth: 14 },
  },
  jabi_lake: {
    id: "jabi_lake",
    name: "Jabi Lake Park & Mall",
    description: "Scenic waterside relaxation, weekend strolls, and boat views.",
    emoji: "⛵",
    cameraPosition: [20, 20, 20],
    bounds: { width: 18, depth: 16 },
  },
  kado: {
    id: "kado",
    name: "Kado Fish Market",
    description: "Point-and-kill fresh grilled catfish with spicy pepper sauce.",
    emoji: "🐟",
    cameraPosition: [16, 16, 16],
    bounds: { width: 12, depth: 12 },
  },
  maitama: {
    id: "maitama",
    name: "Maitama & Guzape Hills",
    description: "Exclusive diplomatic mansions and quiet paved roads.",
    emoji: "🏰",
    cameraPosition: [22, 22, 22],
    bounds: { width: 20, depth: 18 },
  },
  gwarinpa: {
    id: "gwarinpa",
    name: "Gwarinpa Estate",
    description: "The self-contained mini-city. Bustling bukas and local bars.",
    emoji: "🏘️",
    cameraPosition: [16, 16, 16],
    bounds: { width: 14, depth: 14 },
  },
};

export function getRoomConfig(districtId: string): DistrictConfig {
  return DISTRICTS[districtId] || DISTRICTS.secretariat;
}

export interface FoodItem {
  id: string;
  name: string;
  cost: number;
  hungerRestore: number;
  funRestore: number;
  location: string;
}

export const FOOD_ITEMS: Record<string, FoodItem> = {
  mama_put: {
    id: "mama_put",
    name: "Mama Put Pounded Yam & Egusi",
    cost: 2500,
    hungerRestore: 35,
    funRestore: 5,
    location: "secretariat",
  },
  shawarma_wuse2: {
    id: "shawarma_wuse2",
    name: "Al-Basha Beef Shawarma",
    cost: 4500,
    hungerRestore: 40,
    funRestore: 15,
    location: "wuse2",
  },
  kado_catfish: {
    id: "kado_catfish",
    name: "Kado Grilled Catfish & Yam Chips",
    cost: 12000,
    hungerRestore: 80,
    funRestore: 30,
    location: "kado",
  },
  kilishi_area1: {
    id: "kilishi_area1",
    name: "Area 1 Spicy Beef Kilishi",
    cost: 1500,
    hungerRestore: 15,
    funRestore: 10,
    location: "secretariat",
  },
};

export interface HousingOption {
  id: string;
  name: string;
  district: string;
  weeklyRent: number;
  energyBonusPerHour: number;
  cloutBonus: number;
}

export const HOUSING_OPTIONS: Record<string, HousingOption> = {
  kubwa_bq: {
    id: "kubwa_bq",
    name: "Shared BQ in Kubwa",
    district: "kubwa",
    weeklyRent: 30000,
    energyBonusPerHour: 20,
    cloutBonus: 0,
  },
  gwarinpa_flat: {
    id: "gwarinpa_flat",
    name: "1-Bedroom Flat in Gwarinpa",
    district: "gwarinpa",
    weeklyRent: 120000,
    energyBonusPerHour: 50,
    cloutBonus: 30,
  },
  wuse2_serviced: {
    id: "wuse2_serviced",
    name: "Serviced 2-Bed Flat in Wuse 2",
    district: "wuse2",
    weeklyRent: 350000,
    energyBonusPerHour: 80,
    cloutBonus: 100,
  },
  maitama_mansion: {
    id: "maitama_mansion",
    name: "Maitama Hills Luxury Duplex",
    district: "maitama",
    weeklyRent: 1500000,
    energyBonusPerHour: 100,
    cloutBonus: 350,
  },
};

export interface CareerRank {
  rank: number;
  title: string;
  salaryPerShift: number;
  energyCost: number;
}

export const CIVIL_SERVICE_RANKS: CareerRank[] = [
  { rank: 1, title: "Level 08 Admin Officer", salaryPerShift: 35000, energyCost: 25 },
  { rank: 2, title: "Senior Administrative Officer", salaryPerShift: 65000, energyCost: 30 },
  { rank: 3, title: "Assistant Director", salaryPerShift: 140000, energyCost: 35 },
  { rank: 4, title: "Director of Procurement", salaryPerShift: 280000, energyCost: 40 },
  { rank: 5, title: "Permanent Secretary", salaryPerShift: 650000, energyCost: 45 },
];
