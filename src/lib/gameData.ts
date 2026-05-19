import type {
  GameSnapshot,
  LocationState,
  NarrativeEntry,
  PlayerState,
  SuggestedAction,
  WorldState,
} from "@/lib/gameTypes";

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data)) as T;

export const initialPlayer: PlayerState = {
  name: "Arion",
  className: "Viajante",
  level: 1,
  xp: 120,
  xpToNext: 300,
  stats: {
    strength: 10,
    intelligence: 12,
    wisdom: 14,
    charisma: 11,
    dexterity: 13,
  },
  vitals: {
    health: 20,
    maxHealth: 20,
    sanity: 12,
    maxSanity: 12,
    vigor: 18,
    maxVigor: 18,
  },
  inventory: [
    {
      id: "old-map",
      name: "Mapa Antigo",
      icon: "map",
      description: "Mostra caminhos que não aparecem sob luz comum.",
      rarity: "quest",
    },
    {
      id: "lantern",
      name: "Lanterna",
      icon: "lamp",
      description: "A chama inclina-se sempre na direção de segredos.",
    },
    {
      id: "copper-coin",
      name: "Moeda de Cobre",
      icon: "coin",
      quantity: 12,
      description: "Marcadas com o rosto gasto de um rei esquecido.",
    },
    {
      id: "blank-journal",
      name: "Caderno em Branco",
      icon: "book",
      description: "As primeiras páginas cheiram a chuva e poeira.",
    },
  ],
};

export const locations: Record<string, LocationState> = {
  "hill-road": {
    id: "hill-road",
    name: "Estrada da Colina",
    subtitle:
      "Uma trilha de terra serpenteia entre colinas verdes sob um céu nublado.",
    imagePrompt: "dark fantasy hill road, ruined tower, raven, moody sky",
    danger: "Baixo",
    weather: "Nublado",
    timeOfDay: "Fim de tarde",
    connections: ["hollow-wood", "broken-tower"],
  },
  "hollow-wood": {
    id: "hollow-wood",
    name: "Bosque Oco",
    subtitle: "Troncos negros curvam-se como sentinelas à volta da estrada.",
    imagePrompt: "haunted medieval forest path, cold lantern mist",
    danger: "Médio",
    weather: "Nevoeiro baixo",
    timeOfDay: "Crepúsculo",
    connections: ["hill-road", "old-chapel"],
  },
  "broken-tower": {
    id: "broken-tower",
    name: "Torre sem Coroa",
    subtitle: "Pedras antigas sobem para um céu onde nenhum sino responde.",
    imagePrompt: "ruined dark fantasy tower, ravens, gold dusk edge light",
    danger: "Alto",
    weather: "Vento frio",
    timeOfDay: "Última luz",
    connections: ["hill-road", "old-chapel"],
  },
  "old-chapel": {
    id: "old-chapel",
    name: "Capela do Rei Vazio",
    subtitle: "Velas apagadas guardam nomes riscados de uma linhagem caída.",
    imagePrompt: "abandoned medieval chapel, hollow crown altar, candle smoke",
    danger: "Mortal",
    weather: "Silêncio pesado",
    timeOfDay: "Noite",
    connections: ["hollow-wood", "broken-tower"],
  },
};

export const initialWorld: WorldState = {
  currentObjective: "Investiga a torre em ruínas no topo da colina.",
  reputationLocal: 0,
  unlockedLocationIds: ["hill-road"],
  journal: [
    "Cheguei à Estrada da Colina. A torre ao norte parece observar a paisagem.",
  ],
  flags: {},
};

export const initialNarration =
  "O vento sopra suave, carregando o cheiro de terra húmida e pinho. Ao norte, vês as ruínas de uma torre sem telhado erguendo-se no topo de uma colina. Um corvo pousa numa pedra ao lado da trilha, observando-te.\n\nO que fazes?";

export const initialSuggestedActions: SuggestedAction[] = [
  {
    id: "ask-tower",
    label: "Perguntar sobre a torre",
    input: "Perguntar sobre a torre",
    icon: "message",
    tone: "magic",
  },
  {
    id: "examine-raven",
    label: "Examinar o corvo",
    input: "Examinar o corvo",
    icon: "search",
  },
  {
    id: "follow-trail",
    label: "Seguir pela trilha",
    input: "Seguir pela trilha",
    icon: "route",
    tone: "safe",
  },
  {
    id: "use-lantern",
    label: "Usar lanterna",
    input: "Usar lanterna",
    icon: "lamp",
  },
  {
    id: "open-inventory",
    label: "Abrir inventário",
    input: "Abrir inventário",
    icon: "backpack",
  },
];

export function createInitialGameSnapshot(): GameSnapshot {
  const narrativeHistory: NarrativeEntry[] = [
    {
      id: "world-initial",
      type: "world",
      text: initialNarration,
      locationId: "hill-road",
      createdAt: "initial",
    },
  ];

  return {
    player: clone(initialPlayer),
    locations: clone(locations),
    currentLocationId: "hill-road",
    world: clone(initialWorld),
    narrativeHistory,
    suggestedActions: clone(initialSuggestedActions),
  };
}
