import { mariaBlackCat } from "@/game/suspects/maria-black-cat";
import { vinnieGrinMarino } from "@/game/suspects/vinnie-grin-marino";
import type { SuspectProfile } from "@/game/types/suspect";

export const suspects = {
  [vinnieGrinMarino.id]: vinnieGrinMarino,
  [mariaBlackCat.id]: mariaBlackCat,
};

export type RegisteredSuspectId = keyof typeof suspects;

export function getSuspectById(id: string): SuspectProfile | undefined {
  return suspects[id as RegisteredSuspectId];
}

export function getAllSuspects() {
  return Object.values(suspects);
}

export const defaultSuspectId = vinnieGrinMarino.id;
