import type { CaseStatus } from "@/game/types/case";
import type { DialogueEntry } from "@/game/types/dialogue";

export type SuspectId = string;

export type SuspectVoiceProfile = {
  id: string;
  baseFreq: number;
  variance: number;
  waveform: OscillatorType;
  blipEveryNChars: number;
  volume?: number;
};

export type SuspectConfession = {
  id: string;
  label: string;
  confession: string;
  matchers?: string[];
};

export type SuspectConfessionChecklist = readonly [
  SuspectConfession?,
  SuspectConfession?,
  SuspectConfession?,
  SuspectConfession?,
  SuspectConfession?,
];

export type SuspectProfile = {
  id: SuspectId;
  displayName: string;
  shortName: string;
  nickname?: string;
  age?: number;
  occupation?: string;
  portraitUrl?: string;
  backgroundUrl?: string;

  personality: {
    traits: string[];
    speakingStyle: string;
    emotionalBaseline: string;
    intimidationResponse: string;
    lieStyle: string;
  };

  caseContext: {
    caseId: string;
    caseTitle: string;
    status: CaseStatus;
    knownAssociates: string[];
    lastSeen: string;
    publicNotes: string;
    evidence: string[];
  };

  privateKnowledge: {
    truth: string;
    lies: string[];
    secrets: string[];
    contradictions: string[];
    sensitiveTopics: string[];
  };

  interrogationRules: {
    canConfess: boolean;
    confessionRequires: string[];
    avoidRevealing: string[];
    revealWhenAskedAbout: Record<string, string>;
    contradictionTriggers: Record<string, string>;
  };

  suggestedQuestions: string[];
  confessionChecklist: SuspectConfessionChecklist;
  detectiveNotes: string[];
  voice: SuspectVoiceProfile;
  systemPrompt: string;
  initialMessage?: string;
};

export type InterrogationState = {
  suspectId: SuspectId;
  history: DialogueEntry[];
  questionsAsked: number;
  topicsCovered: string[];
  contradictionsFound: string[];
  pressureLevel: number;
  confessionUnlocked: boolean;
};
