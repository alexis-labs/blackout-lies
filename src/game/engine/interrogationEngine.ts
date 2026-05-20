import { buildSuspectPrompt } from "@/game/prompts/buildSuspectPrompt";
import type {
  InterrogationState,
  SuspectId,
  SuspectProfile,
} from "@/game/types/suspect";

type AskSuspectParams = {
  suspect: SuspectProfile;
  interrogationState: InterrogationState;
  question: string;
};

export type SuspectLLMPayload = {
  systemPrompt: string;
  userMessage: string;
  metadata: {
    suspectId: SuspectId;
    caseId: string;
    interrogationState: InterrogationState;
  };
};

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const unique = (items: string[]) => Array.from(new Set(items));

const pressureStepFromLevel = (pressureLevel: number) => {
  return Math.min(5, Math.floor(pressureLevel / 20) + 1);
};

export function createInitialInterrogationState(
  suspectId: SuspectId,
): InterrogationState {
  return {
    suspectId,
    history: [],
    questionsAsked: 0,
    topicsCovered: [],
    contradictionsFound: [],
    pressureLevel: 0,
    confessionUnlocked: false,
  };
}

export function buildSuspectLLMPayload({
  suspect,
  interrogationState,
  question,
}: AskSuspectParams): SuspectLLMPayload {
  return {
    systemPrompt: buildSuspectPrompt(suspect, interrogationState),
    userMessage: question,
    metadata: {
      suspectId: suspect.id,
      caseId: suspect.caseContext.caseId,
      interrogationState,
    },
  };
}

function topicFromQuestion(question: string, suspect: SuspectProfile) {
  const normalized = normalize(question);
  const topics: string[] = [];

  if (
    normalized.includes("alibi") ||
    normalized.includes("where were you") ||
    normalized.includes("last night")
  ) {
    topics.push("alibi");
  }

  const candidates = unique([
    "statue",
    "back exit",
    ...Object.keys(suspect.interrogationRules.revealWhenAskedAbout),
    ...suspect.privateKnowledge.sensitiveTopics,
  ]);

  candidates.forEach((candidate) => {
    if (normalized.includes(normalize(candidate))) {
      topics.push(candidate);
    }
  });

  return unique(topics);
}

function findContradictions(
  question: string,
  answer: string,
  suspect: SuspectProfile,
) {
  const combined = normalize(`${question} ${answer}`);

  return Object.entries(suspect.interrogationRules.contradictionTriggers)
    .filter(([trigger]) => combined.includes(normalize(trigger)))
    .map(([, contradiction]) => contradiction);
}

function calculatePressureIncrease(
  question: string,
  answer: string,
  suspect: SuspectProfile,
) {
  const combined = normalize(`${question} ${answer}`);
  let pressure = 8;

  suspect.privateKnowledge.sensitiveTopics.forEach((topic) => {
    if (combined.includes(normalize(topic))) {
      pressure += 9;
    }
  });

  suspect.caseContext.evidence.forEach((evidence) => {
    if (combined.includes(normalize(evidence))) {
      pressure += 12;
    }
  });

  if (findContradictions(question, answer, suspect).length > 0) {
    pressure += 18;
  }

  return pressure;
}

function findUnrevealedPressureTruth(
  suspect: SuspectProfile,
  interrogationState: InterrogationState,
) {
  const pressureStep = pressureStepFromLevel(interrogationState.pressureLevel);

  if (pressureStep < 3) {
    return undefined;
  }

  const previousAnswers = normalize(
    interrogationState.history.map((entry) => entry.answer).join(" "),
  );
  const configuredConfessions = suspect.confessionChecklist
    .slice(0, 5)
    .flatMap((item) => (item ? [item.confession] : []));
  const truthPool =
    configuredConfessions.length > 0
      ? configuredConfessions
      : [suspect.privateKnowledge.truth, ...suspect.privateKnowledge.secrets];
  const truthCandidates =
    pressureStep >= 5 ? truthPool : truthPool.slice(0, pressureStep >= 4 ? 2 : 1);

  return truthCandidates.find(
    (candidate) => !previousAnswers.includes(normalize(candidate)),
  );
}

function addPressureTruth(
  response: string,
  suspect: SuspectProfile,
  interrogationState: InterrogationState,
) {
  const pressureTruth = findUnrevealedPressureTruth(
    suspect,
    interrogationState,
  );

  if (!pressureTruth) {
    return response;
  }

  return `${response}\n\n${suspect.shortName}'s mask slips. "Fine. ${pressureTruth}"`;
}

function requirementIsMet(
  requirement: string,
  topicsCovered: string[],
  contradictionsFound: string[],
) {
  const normalizedRequirement = normalize(requirement);

  if (
    normalizedRequirement.includes("presented contradiction") ||
    normalizedRequirement.includes("contradiction")
  ) {
    return contradictionsFound.length > 0;
  }

  return topicsCovered.some((topic) =>
    normalizedRequirement.includes(normalize(topic)),
  );
}

export function updateInterrogationProgress(
  state: InterrogationState,
  suspect: SuspectProfile,
  question: string,
  answer: string,
): InterrogationState {
  const topicsCovered = unique([
    ...state.topicsCovered,
    ...topicFromQuestion(question, suspect),
  ]);
  const contradictionsFound = unique([
    ...state.contradictionsFound,
    ...findContradictions(question, answer, suspect),
  ]);
  const pressureLevel = Math.min(
    100,
    state.pressureLevel + calculatePressureIncrease(question, answer, suspect),
  );
  const confessionUnlocked =
    suspect.interrogationRules.canConfess &&
    suspect.interrogationRules.confessionRequires.every((requirement) =>
      requirementIsMet(requirement, topicsCovered, contradictionsFound),
    );

  return {
    ...state,
    questionsAsked: state.questionsAsked + 1,
    topicsCovered,
    contradictionsFound,
    pressureLevel,
    confessionUnlocked,
  };
}

function mockSuspectResponse({
  suspect,
  interrogationState,
  question,
}: AskSuspectParams) {
  const normalizedQuestion = normalize(question);
  const pressureStep = pressureStepFromLevel(interrogationState.pressureLevel);
  const topicResponse = Object.entries(
    suspect.interrogationRules.revealWhenAskedAbout,
  ).find(([topic]) => normalizedQuestion.includes(normalize(topic)));

  if (interrogationState.confessionUnlocked || pressureStep >= 5) {
    return suspect.interrogationRules.canConfess
      ? addPressureTruth(
          "Fine. You got teeth, detective. I know more than I said, and maybe I helped the wrong person look lucky.",
          suspect,
          interrogationState,
        )
      : addPressureTruth(
          "Nice pressure, detective. I still did not steal it, but I saw enough to ruin somebody's evening.",
          suspect,
          interrogationState,
        );
  }

  if (topicResponse) {
    return addPressureTruth(topicResponse[1], suspect, interrogationState);
  }

  if (
    normalizedQuestion.includes("where were you") ||
    normalizedQuestion.includes("last night") ||
    normalizedQuestion.includes("alibi")
  ) {
    return addPressureTruth(
      `${suspect.shortName} shrugs under the lamp. "I was where the night was loud and the clocks were rude, detective. You got a sharper time than that?"`,
      suspect,
      interrogationState,
    );
  }

  if (normalizedQuestion.includes("who")) {
    return addPressureTruth(
      `${suspect.shortName} smiles thinly. "Names cost extra, detective."`,
      suspect,
      interrogationState,
    );
  }

  if (normalizedQuestion.includes("why")) {
    return addPressureTruth(
      `"Why" is a big coat for a small hook, detective. Try hanging evidence on it.`,
      suspect,
      interrogationState,
    );
  }

  return addPressureTruth(
    `${suspect.shortName} leans back under the lamp. "Ask it cleaner, detective. Vague questions get vague answers."`,
    suspect,
    interrogationState,
  );
}

async function askExistingLLMEngine(
  payload: SuspectLLMPayload,
  params: AskSuspectParams,
) {
  await wait(320);

  void payload;
  return mockSuspectResponse(params);
}

export async function askSuspect(params: AskSuspectParams): Promise<string> {
  const payload = buildSuspectLLMPayload(params);

  return askExistingLLMEngine(payload, params);
}
