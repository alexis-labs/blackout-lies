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
    evidenceCards: [
      {
        id: "nico-elena-missed-messages",
        label: "Missed Message Log",
        body: "Elena tried to reach Nico before disappearing.",
        source: "Phone extraction",
        kind: "phone",
      },
      {
        id: "nico-whatsapp-4am",
        label: "4 AM WhatsApp Statement",
        body: "Nico said he only checked WhatsApp around 4 AM.",
        source: "Initial statement",
        kind: "statement",
      },
      {
        id: "nico-alibi-gap",
        label: "10 PM Timeline Gap",
        body: "His alibi leaves a gap after 10 PM.",
        source: "Timeline board",
        kind: "timeline",
      },
      {
        id: "nico-baby-deleted",
        label: "Deleted Baby Messages",
        body: "Deleted messages connect Nico and Baby.",
        source: "Phone extraction",
        kind: "phone",
      },
      {
        id: "nico-mill-road-witness",
        label: "Mill Road Witness",
        body: "A witness places a man matching him near the mill road.",
        source: "Witness statement",
        kind: "witness",
      },
      {
        id: "rosa-husband-contradiction",
        label: "Husband Statement",
        body: "Rosa's husband contradicted her claim that she stayed home all night.",
        source: "Witness statement",
        kind: "witness",
      },
      {
        id: "rosa-car-sighting",
        label: "Dark Compact Car",
        body: "A dark compact car matching Rosa's was reported near the mill road.",
        source: "Road report",
        kind: "witness",
      },
      {
        id: "baby-route-images",
        label: "Route Image Set",
        body: "Images on Baby's phone show parts of Elena's route.",
        source: "Phone extraction",
        kind: "phone",
      },
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
