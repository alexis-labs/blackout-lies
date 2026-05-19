export type IconName =
  | "map"
  | "lamp"
  | "coin"
  | "book"
  | "key"
  | "feather"
  | "scroll"
  | "potion"
  | "shield"
  | "compass"
  | "gem"
  | "default";

export type ActionIconName =
  | "message"
  | "search"
  | "route"
  | "lamp"
  | "map"
  | "backpack"
  | "sword"
  | "rest"
  | "spark"
  | "flee";

export type PlayerStats = {
  strength: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  dexterity: number;
};

export type PlayerVitals = {
  health: number;
  maxHealth: number;
  sanity: number;
  maxSanity: number;
  vigor: number;
  maxVigor: number;
};

export type InventoryItem = {
  id: string;
  name: string;
  icon: IconName;
  quantity?: number;
  description?: string;
  rarity?: "common" | "uncommon" | "rare" | "quest";
};

export type PlayerState = {
  name: string;
  className: string;
  level: number;
  xp: number;
  xpToNext: number;
  stats: PlayerStats;
  vitals: PlayerVitals;
  inventory: InventoryItem[];
};

export type DangerLevel = "Baixo" | "Médio" | "Alto" | "Mortal";

export type LocationState = {
  id: string;
  name: string;
  subtitle: string;
  imagePrompt: string;
  danger: DangerLevel;
  weather: string;
  timeOfDay: string;
  connections: string[];
};

export type WorldState = {
  currentObjective: string;
  reputationLocal: number;
  unlockedLocationIds: string[];
  journal: string[];
  flags: Record<string, boolean>;
};

export type SuggestedAction = {
  id: string;
  label: string;
  input: string;
  icon: ActionIconName;
  tone?: "default" | "danger" | "magic" | "safe";
};

export type NarrativeEntry = {
  id: string;
  type: "player" | "world" | "system" | "npc";
  text: string;
  input?: string;
  locationId: string;
  createdAt: string;
};

export type PlayerAction = {
  input: string;
  player: PlayerState;
  location: LocationState;
  world: WorldState;
};

export type WorldPatch = {
  currentObjective?: string;
  reputationLocal?: number;
  unlockLocations?: string[];
  flagUpdates?: Record<string, boolean>;
  weather?: string;
  timeOfDay?: string;
  danger?: DangerLevel;
};

export type NarrativeResponse = {
  narration: string;
  suggestedActions: SuggestedAction[];
  statChanges?: Partial<PlayerStats>;
  vitalChanges?: Partial<PlayerVitals>;
  inventoryAdd?: InventoryItem[];
  inventoryRemove?: string[];
  xpGain?: number;
  locationChange?: string;
  journalEntry?: string;
  worldPatch?: WorldPatch;
};

export type GameSnapshot = {
  player: PlayerState;
  locations: Record<string, LocationState>;
  currentLocationId: string;
  world: WorldState;
  narrativeHistory: NarrativeEntry[];
  suggestedActions: SuggestedAction[];
};
