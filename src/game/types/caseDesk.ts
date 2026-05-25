import type { SuspectId } from "@/game/types/suspect";

export type CaseEvidenceKind =
  | "statement"
  | "phone"
  | "timeline"
  | "witness"
  | "note";

export type CaseEvidenceCard = {
  id: string;
  label: string;
  body: string;
  source: string;
  kind: CaseEvidenceKind;
};

export type CaseDeskChallenge = {
  id: string;
  suspectId: SuspectId;
  claimText: string;
  triggerTerms: string[];
  correctEvidenceId: string;
  decoyEvidenceIds: string[];
  timeLimit: number;
  successNote: string;
  missNote: string;
  pressureGain: number;
  missPenalty: number;
  contradiction: string;
};

export type CaseDeskRank = "miss" | "hit" | "perfect";

export type CaseDeskResolution = {
  challengeId: string;
  selectedEvidenceId?: string;
  isCorrect: boolean;
  timedOut: boolean;
  rank: CaseDeskRank;
  note: string;
  pressureDelta: number;
  focusDelta: number;
  remainingSeconds: number;
  speedBonus: number;
  scoreDelta: number;
  contradiction?: string;
};
