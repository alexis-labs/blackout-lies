import type { CaseDeskResolution } from "@/game/types/caseDesk";

export type DialogueEntry = {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  deskResult?: CaseDeskResolution;
};
