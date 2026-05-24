import type { CaseEvidenceCard } from "@/game/types/caseDesk";

export type CaseFileTab = "case" | "history" | "notes" | "checklist";

export type CaseStatus = "OPEN" | "CLOSED" | "COLD";

export type CaseFolderStatus = "OPEN" | "COMPLETE" | "LOCKED";

export type CaseProgress = {
  completedSuspects: number;
  totalSuspects: number;
  isComplete: boolean;
};

export type AvailableCaseFolder = {
  id: string;
  slotLabel: string;
  title: string;
  status: Exclude<CaseFolderStatus, "LOCKED">;
  suspectIds: string[];
  description: string;
  evidence: string[];
  evidenceCards: CaseEvidenceCard[];
};

export type LockedCaseFolder = {
  id: string;
  slotLabel: string;
  title: string;
  status: "LOCKED";
  description: string;
};

export type CaseFolder = AvailableCaseFolder | LockedCaseFolder;
