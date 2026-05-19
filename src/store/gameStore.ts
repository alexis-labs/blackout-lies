"use client";

import { create } from "zustand";
import { createInitialGameSnapshot } from "@/lib/gameData";
import type {
  GameSnapshot,
  InventoryItem,
  NarrativeEntry,
  NarrativeResponse,
  PlayerState,
  PlayerStats,
  PlayerVitals,
  WorldState,
} from "@/lib/gameTypes";
import { realLLMResponse } from "@/lib/llmClient";
import {
  clearGameSnapshot,
  loadGameSnapshot,
  saveGameSnapshot,
} from "@/lib/storage";

type FeedbackType = "item" | "xp" | "save" | "system" | "level";

export type GameFeedback = {
  id: string;
  type: FeedbackType;
  message: string;
};

export type GameView = "hero" | "story" | "world";

type GameStore = GameSnapshot & {
  activeView: GameView;
  isProcessing: boolean;
  feedback?: GameFeedback;
  submitAction: (input: string) => Promise<void>;
  chooseSuggestedAction: (input: string) => Promise<void>;
  setActiveView: (view: GameView) => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
  newGame: () => void;
  resetGame: () => Promise<void>;
  clearFeedback: () => void;
};

const freshSnapshot = createInitialGameSnapshot();

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function mergeInventory(
  inventory: InventoryItem[],
  add?: InventoryItem[],
  remove?: string[],
) {
  let next = [...inventory];
  const addedNames: string[] = [];

  if (remove?.length) {
    next = next.filter((item) => !remove.includes(item.id));
  }

  add?.forEach((item) => {
    const existing = next.find((current) => current.id === item.id);
    if (existing) {
      if (item.quantity) {
        existing.quantity = (existing.quantity ?? 1) + item.quantity;
      }
      return;
    }

    next.push({ ...item });
    addedNames.push(item.name);
  });

  return { inventory: next, addedNames };
}

function applyStatChanges(
  stats: PlayerStats,
  changes?: Partial<PlayerStats>,
): PlayerStats {
  if (!changes) {
    return stats;
  }

  return {
    strength: clamp(stats.strength + (changes.strength ?? 0), 1, 30),
    intelligence: clamp(stats.intelligence + (changes.intelligence ?? 0), 1, 30),
    wisdom: clamp(stats.wisdom + (changes.wisdom ?? 0), 1, 30),
    charisma: clamp(stats.charisma + (changes.charisma ?? 0), 1, 30),
    dexterity: clamp(stats.dexterity + (changes.dexterity ?? 0), 1, 30),
  };
}

function applyVitalChanges(
  vitals: PlayerVitals,
  changes?: Partial<PlayerVitals>,
): PlayerVitals {
  if (!changes) {
    return vitals;
  }

  const maxHealth = vitals.maxHealth + (changes.maxHealth ?? 0);
  const maxSanity = vitals.maxSanity + (changes.maxSanity ?? 0);
  const maxVigor = vitals.maxVigor + (changes.maxVigor ?? 0);

  return {
    maxHealth,
    health: clamp(vitals.health + (changes.health ?? 0), 0, maxHealth),
    maxSanity,
    sanity: clamp(vitals.sanity + (changes.sanity ?? 0), 0, maxSanity),
    maxVigor,
    vigor: clamp(vitals.vigor + (changes.vigor ?? 0), 0, maxVigor),
  };
}

function applyExperience(player: PlayerState, xpGain = 0) {
  let xp = player.xp + xpGain;
  let xpToNext = player.xpToNext;
  let level = player.level;
  let leveledUp = false;

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext += 150;
    leveledUp = true;
  }

  return {
    player: {
      ...player,
      level,
      xp,
      xpToNext,
      vitals: leveledUp
        ? {
            ...player.vitals,
            maxHealth: player.vitals.maxHealth + 2,
            health: player.vitals.maxHealth + 2,
            maxSanity: player.vitals.maxSanity + 1,
            sanity: player.vitals.maxSanity + 1,
            maxVigor: player.vitals.maxVigor + 2,
            vigor: player.vitals.maxVigor + 2,
          }
        : player.vitals,
    },
    leveledUp,
  };
}

function buildWorld(
  world: WorldState,
  response: NarrativeResponse,
): WorldState {
  const patch = response.worldPatch;
  const unlocks = new Set(world.unlockedLocationIds);

  if (response.locationChange) {
    unlocks.add(response.locationChange);
  }

  patch?.unlockLocations?.forEach((locationId) => unlocks.add(locationId));

  return {
    ...world,
    currentObjective: patch?.currentObjective ?? world.currentObjective,
    reputationLocal: patch?.reputationLocal ?? world.reputationLocal,
    unlockedLocationIds: Array.from(unlocks),
    journal: response.journalEntry
      ? [response.journalEntry, ...world.journal].slice(0, 12)
      : world.journal,
    flags: {
      ...world.flags,
      ...patch?.flagUpdates,
    },
  };
}

function feedbackFor(
  response: NarrativeResponse,
  addedNames: string[],
  leveledUp: boolean,
): GameFeedback | undefined {
  if (leveledUp) {
    return {
      id: makeId("feedback"),
      type: "level",
      message: "Subiste de nível. A coroa ouviu o teu nome.",
    };
  }

  if (addedNames.length > 0) {
    return {
      id: makeId("feedback"),
      type: "item",
      message: `Item adicionado: ${addedNames.join(", ")}`,
    };
  }

  if (response.xpGain) {
    return {
      id: makeId("feedback"),
      type: "xp",
      message: `+${response.xpGain} XP`,
    };
  }

  return undefined;
}

function snapshotFromState(state: GameStore): GameSnapshot {
  return {
    player: state.player,
    locations: state.locations,
    currentLocationId: state.currentLocationId,
    world: state.world,
    narrativeHistory: state.narrativeHistory,
    suggestedActions: state.suggestedActions,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...freshSnapshot,
  activeView: "story",
  isProcessing: false,
  feedback: undefined,

  setActiveView: (view) => set({ activeView: view }),

  clearFeedback: () => set({ feedback: undefined }),

  chooseSuggestedAction: async (input) => {
    await get().submitAction(input);
  },

  submitAction: async (rawInput) => {
    const input = rawInput.trim();
    if (!input || get().isProcessing) {
      return;
    }

    const playerEntry: NarrativeEntry = {
      id: makeId("player"),
      type: "player",
      text: input,
      input,
      locationId: get().currentLocationId,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      isProcessing: true,
      narrativeHistory: [...state.narrativeHistory, playerEntry],
    }));

    try {
      const state = get();
      const response = await realLLMResponse({
        input,
        player: state.player,
        location: state.locations[state.currentLocationId],
        world: state.world,
      });

      set((current) => {
        const { inventory, addedNames } = mergeInventory(
          current.player.inventory,
          response.inventoryAdd,
          response.inventoryRemove,
        );

        const playerWithStats: PlayerState = {
          ...current.player,
          stats: applyStatChanges(current.player.stats, response.statChanges),
          vitals: applyVitalChanges(
            current.player.vitals,
            response.vitalChanges,
          ),
          inventory,
        };

        const experience = applyExperience(playerWithStats, response.xpGain);
        const nextLocationId =
          response.locationChange && current.locations[response.locationChange]
            ? response.locationChange
            : current.currentLocationId;

        const locationPatch = response.worldPatch;
        const nextLocations =
          locationPatch?.danger || locationPatch?.weather || locationPatch?.timeOfDay
            ? {
                ...current.locations,
                [current.currentLocationId]: {
                  ...current.locations[current.currentLocationId],
                  danger:
                    locationPatch.danger ??
                    current.locations[current.currentLocationId].danger,
                  weather:
                    locationPatch.weather ??
                    current.locations[current.currentLocationId].weather,
                  timeOfDay:
                    locationPatch.timeOfDay ??
                    current.locations[current.currentLocationId].timeOfDay,
                },
              }
            : current.locations;

        const worldEntry: NarrativeEntry = {
          id: makeId("world"),
          type: "world",
          text: response.narration,
          locationId: nextLocationId,
          createdAt: new Date().toISOString(),
        };

        return {
          player: experience.player,
          locations: nextLocations,
          currentLocationId: nextLocationId,
          world: buildWorld(current.world, response),
          narrativeHistory: [...current.narrativeHistory, worldEntry],
          suggestedActions: response.suggestedActions,
          isProcessing: false,
          feedback: feedbackFor(response, addedNames, experience.leveledUp),
        };
      });
    } catch {
      const systemEntry: NarrativeEntry = {
        id: makeId("system"),
        type: "system",
        text: "A névoa engoliu a resposta. Tenta novamente.",
        locationId: get().currentLocationId,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        isProcessing: false,
        narrativeHistory: [...state.narrativeHistory, systemEntry],
        feedback: {
          id: makeId("feedback"),
          type: "system",
          message: "Não foi possível gerar a resposta narrativa.",
        },
      }));
    }
  },

  saveGame: async () => {
    const ok = await saveGameSnapshot(snapshotFromState(get()));
    set({
      feedback: {
        id: makeId("feedback"),
        type: ok ? "save" : "system",
        message: ok ? "Jogo guardado localmente." : "Não foi possível guardar.",
      },
    });
  },

  loadGame: async () => {
    const snapshot = await loadGameSnapshot();
    if (!snapshot) {
      set({
        feedback: {
          id: makeId("feedback"),
          type: "system",
          message: "Nenhum save local encontrado.",
        },
      });
      return;
    }

    set({
      ...snapshot,
      activeView: "story",
      isProcessing: false,
      feedback: {
        id: makeId("feedback"),
        type: "save",
        message: "Save carregado.",
      },
    });
  },

  newGame: () => {
    set({
      ...createInitialGameSnapshot(),
      activeView: "story",
      isProcessing: false,
      feedback: {
        id: makeId("feedback"),
        type: "system",
        message: "Nova jornada iniciada.",
      },
    });
  },

  resetGame: async () => {
    await clearGameSnapshot();
    set({
      ...createInitialGameSnapshot(),
      activeView: "story",
      isProcessing: false,
      feedback: {
        id: makeId("feedback"),
        type: "system",
        message: "Jogo reposto e save local removido.",
      },
    });
  },
}));
