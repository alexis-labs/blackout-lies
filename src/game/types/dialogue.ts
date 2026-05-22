export type InterrogationReaction = "truth" | "doubt" | "lie";

export type InterrogationReactionOutcome = {
  selectedReaction: InterrogationReaction;
  correctReaction: InterrogationReaction;
  isCorrect: boolean;
  note: string;
  lostClues: number;
};

export type DialogueEntry = {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  reaction?: InterrogationReactionOutcome;
};
