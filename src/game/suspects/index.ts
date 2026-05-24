import { nicoGrinMoretti } from "@/game/suspects/nico-grin-moretti";
import { rosaBlackCatNeri } from "@/game/suspects/rosa-black-cat-neri";
import { baby } from "@/game/suspects/baby";
import type { SuspectProfile } from "@/game/types/suspect";

export const suspects = {
  [nicoGrinMoretti.id]: nicoGrinMoretti,
  [rosaBlackCatNeri.id]: rosaBlackCatNeri,
  [baby.id]: baby,
};

export type RegisteredSuspectId = keyof typeof suspects;

export function getSuspectById(id: string): SuspectProfile | undefined {
  return suspects[id as RegisteredSuspectId];
}

export function getAllSuspects() {
  return Object.values(suspects);
}

export const defaultSuspectId = nicoGrinMoretti.id;
