import type { CaseFolder } from "@/game/types/case";
import { baby } from "@/game/suspects/baby";
import { nicoGrinMoretti } from "@/game/suspects/nico-grin-moretti";
import { rosaBlackCatNeri } from "@/game/suspects/rosa-black-cat-neri";

export const playableCaseId = "CV-2025";

export const caseFolders = [
  {
    id: playableCaseId,
    slotLabel: "CASE 01",
    title: "Blackout Lies",
    status: "OPEN",
    suspectIds: [nicoGrinMoretti.id, rosaBlackCatNeri.id, baby.id],
    description:
      "Elena Duarte Vale vanished in Porto Escuro after a night of broken timelines, deleted messages, and headlights near the mill road. Three suspects sit in separate rooms. Each one owns a piece of the same bad night, and the file only closes when every checklist is complete.",
    evidence: [
      "Phone records and WhatsApp messages bend around the same late hours.",
      "Witnesses place movement near the mill road after dark.",
      "Deleted messages connect Nico, Rosa, and Baby across the timeline.",
    ],
  },
  {
    id: "CASE-02",
    slotLabel: "CASE 02",
    title: "Locked File",
    status: "LOCKED",
    description: "Folder sealed. The cabinet gives up nothing yet.",
  },
  {
    id: "CASE-03",
    slotLabel: "CASE 03",
    title: "Locked File",
    status: "LOCKED",
    description: "Folder sealed. Fresh ink is waiting for another case.",
  },
] as const satisfies readonly CaseFolder[];

export function getCaseFolderById(caseId: string) {
  return caseFolders.find((caseFolder) => caseFolder.id === caseId);
}
