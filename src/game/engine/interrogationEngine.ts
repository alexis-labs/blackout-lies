import type {
  InterrogationReaction,
  InterrogationReactionOutcome,
} from "@/game/types/dialogue";
import type {
  InterrogationState,
  SuspectAnswer,
  SuspectId,
  SuspectProfile,
} from "@/game/types/suspect";

type AskSuspectParams = {
  suspect: SuspectProfile;
  interrogationState: InterrogationState;
  question: string;
};

type InterrogateApiResponse = {
  answer?: string;
  discoveredConfessionIds?: string[];
  error?: string;
};

type ReactionProgressOptions = {
  reactionOutcome?: InterrogationReactionOutcome;
};

class InterrogateApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const unique = (items: string[]) => Array.from(new Set(items));

const tokenizeEvidence = (value: string) =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 5);

const pressureStepFromLevel = (pressureLevel: number) => {
  return Math.min(5, Math.floor(pressureLevel / 20) + 1);
};

export function isOffCaseQuestion(question: string) {
  const normalized = normalize(question);

  return [
    "python",
    "javascript",
    "typescript",
    "codigo",
    "code",
    "programa",
    "programming",
    "system prompt",
    "prompt",
    "contexto",
    "context",
    "hidden rules",
    "instrucoes",
    "instructions",
    "chatgpt",
    "api",
    "llm",
  ].some((term) => normalized.includes(term));
}

export function mockOffCaseResponse(
  suspect: SuspectProfile,
  question?: string,
) {
  const wantsPortuguese = question
    ? [
        "codigo",
        "contexto",
        "instrucoes",
        "pergunta",
        "porque",
        "como",
        "qual",
        "o que",
      ].some((term) => normalize(question).includes(term))
    : false;

  if (wantsPortuguese) {
    return `${suspect.shortName} olha para o gravador. "Sala errada para isso, detective. Pergunte-me sobre Porto Escuro, a estrada, os registos de celular, ou a noite em que Elena desapareceu."`;
  }

  return `${suspect.shortName} watches the tape reels turn. "Wrong room for that, detective. Ask me about Porto Escuro, the road, the phone records, or the night Elena vanished."`;
}

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
    completedConfessionIds: [],
    lostClueCount: 0,
    caseClosed: false,
  };
}

function topicFromQuestion(question: string, suspect: SuspectProfile) {
  const normalized = normalize(question);
  const topics: string[] = [];

  if (
    normalized.includes("alibi") ||
    normalized.includes("where were you") ||
    normalized.includes("onde estava") ||
    normalized.includes("onde voce estava") ||
    normalized.includes("onde estavas") ||
    normalized.includes("last night") ||
    normalized.includes("naquela noite")
  ) {
    topics.push("alibi");
  }

  const candidates = unique([
    "Elena",
    "WhatsApp",
    "phone records",
    "deleted messages",
    "mill road",
    "estrada do moinho",
    "carro",
    "car",
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

function findEvidenceMatches(
  question: string,
  answer: string,
  suspect: SuspectProfile,
) {
  const combined = normalize(`${question} ${answer}`);
  const contradictions = findContradictions(question, answer, suspect);
  const evidenceMatches = suspect.caseContext.evidence.filter((evidence) => {
    const keywords = unique(tokenizeEvidence(evidence));

    return keywords.filter((keyword) => combined.includes(keyword)).length >= 2;
  });

  return unique([...contradictions, ...evidenceMatches]);
}

function touchesSensitiveTopic(
  question: string,
  answer: string,
  suspect: SuspectProfile,
) {
  const combined = normalize(`${question} ${answer}`);

  return suspect.privateKnowledge.sensitiveTopics.some((topic) =>
    combined.includes(normalize(topic)),
  );
}

function classifyReaction(
  question: string,
  answer: string,
  suspect: SuspectProfile,
  discoveredConfessionIds: string[],
): InterrogationReaction {
  if (findEvidenceMatches(question, answer, suspect).length > 0) {
    return "lie";
  }

  if (
    discoveredConfessionIds.length === 0 &&
    touchesSensitiveTopic(question, answer, suspect)
  ) {
    return "doubt";
  }

  return "truth";
}

export function resolveInterrogationReaction({
  suspect,
  question,
  answer,
  discoveredConfessionIds,
  selectedReaction,
}: {
  suspect: SuspectProfile;
  question: string;
  answer: string;
  discoveredConfessionIds: string[];
  selectedReaction: InterrogationReaction;
}): InterrogationReactionOutcome {
  const correctReaction = classifyReaction(
    question,
    answer,
    suspect,
    discoveredConfessionIds,
  );
  const evidenceMatches = findEvidenceMatches(question, answer, suspect);
  const isCorrect = selectedReaction === correctReaction;
  const lostClues = isCorrect ? 0 : Math.max(1, discoveredConfessionIds.length);
  const note = isCorrect
    ? reactionSuccessNote(selectedReaction)
    : reactionMissNote(
        selectedReaction,
        correctReaction,
        evidenceMatches.length > 0,
      );

  return {
    selectedReaction,
    correctReaction,
    isCorrect,
    note,
    lostClues,
  };
}

function reactionSuccessNote(reaction: InterrogationReaction) {
  if (reaction === "truth") {
    return "Good cop landed. The answer holds for now.";
  }

  if (reaction === "doubt") {
    return "Bad cop pressure landed. The suspect gave ground.";
  }

  return "Accusation landed with evidence on the table.";
}

function reactionMissNote(
  selectedReaction: InterrogationReaction,
  correctReaction: InterrogationReaction,
  hadEvidence: boolean,
) {
  if (selectedReaction === "lie" && !hadEvidence) {
    return "Accusation failed. No evidence pinned that statement down.";
  }

  if (correctReaction === "truth") {
    return "Pressure broke the rhythm. That useful thread is gone.";
  }

  if (correctReaction === "doubt") {
    return "Too soft. The suspect kept the loose detail.";
  }

  return "The evidence window closed before the accusation stuck.";
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

type ChecklistConfession = NonNullable<
  SuspectProfile["confessionChecklist"][number]
>;

function confessionIsAdmitted(
  text: string,
  confession: ChecklistConfession,
) {
  const normalizedText = normalize(text);
  const matchers = [confession.confession, ...(confession.matchers ?? [])];

  return matchers.some((matcher) => normalizedText.includes(normalize(matcher)));
}

function findCompletedConfessionIds(
  state: InterrogationState,
  suspect: SuspectProfile,
  answer: string,
  discoveredConfessionIds: string[] = [],
) {
  const previousAnswerText = state.history.map((entry) => entry.answer).join(" ");
  const answerText = `${previousAnswerText} ${answer}`;
  const existingIds = state.completedConfessionIds ?? [];
  const checklistIds = suspect.confessionChecklist
    .slice(0, 5)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => item.id);
  const explicitIds = discoveredConfessionIds.filter((id) =>
    checklistIds.includes(id),
  );
  const admittedIds = suspect.confessionChecklist
    .slice(0, 5)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => confessionIsAdmitted(answerText, item))
    .map((item) => item.id);

  return unique([...existingIds, ...explicitIds, ...admittedIds]);
}

function hasCompletedChecklist(
  suspect: SuspectProfile,
  completedConfessionIds: string[],
) {
  const checklistIds = suspect.confessionChecklist
    .slice(0, 5)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => item.id);

  return (
    checklistIds.length > 0 &&
    checklistIds.every((id) => completedConfessionIds.includes(id))
  );
}

export function updateInterrogationProgress(
  state: InterrogationState,
  suspect: SuspectProfile,
  question: string,
  answer: string,
  discoveredConfessionIds: string[] = [],
  options: ReactionProgressOptions = {},
): InterrogationState {
  const reactionOutcome = options.reactionOutcome;
  const isReactionCorrect = reactionOutcome?.isCorrect ?? true;
  const topicsCovered = unique([
    ...state.topicsCovered,
    ...topicFromQuestion(question, suspect),
  ]);
  const contradictionsFound = isReactionCorrect
    ? unique([
        ...state.contradictionsFound,
        ...findContradictions(question, answer, suspect),
      ])
    : state.contradictionsFound;
  const pressureIncrease = calculatePressureIncrease(question, answer, suspect);
  const pressureLevel = Math.min(
    100,
    state.pressureLevel +
      (isReactionCorrect
        ? pressureIncrease
        : Math.max(4, Math.floor(pressureIncrease / 3))),
  );
  const confessionUnlocked =
    suspect.interrogationRules.canConfess &&
    suspect.interrogationRules.confessionRequires.every((requirement) =>
      requirementIsMet(requirement, topicsCovered, contradictionsFound),
    );
  const completedConfessionIds = isReactionCorrect
    ? findCompletedConfessionIds(state, suspect, answer, discoveredConfessionIds)
    : state.completedConfessionIds;
  const caseClosed = hasCompletedChecklist(suspect, completedConfessionIds);

  return {
    ...state,
    questionsAsked: state.questionsAsked + 1,
    topicsCovered,
    contradictionsFound,
    pressureLevel,
    confessionUnlocked,
    completedConfessionIds,
    lostClueCount: state.lostClueCount + (reactionOutcome?.lostClues ?? 0),
    caseClosed,
  };
}

export function mockSuspectResponse({
  suspect,
  interrogationState,
  question,
}: AskSuspectParams) {
  const normalizedQuestion = normalize(question);
  const pressureStep = pressureStepFromLevel(interrogationState.pressureLevel);
  const topicResponse = Object.entries(
    suspect.interrogationRules.revealWhenAskedAbout,
  ).find(([topic]) => normalizedQuestion.includes(normalize(topic)));

  if (isOffCaseQuestion(question)) {
    return mockOffCaseResponse(suspect, question);
  }

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

async function askConfiguredLLMEngine(
  params: AskSuspectParams,
): Promise<SuspectAnswer> {
  const response = await fetch("/api/interrogate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      suspectId: params.suspect.id,
      interrogationState: params.interrogationState,
      question: params.question,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | InterrogateApiResponse
    | null;

  if (!response.ok || !data?.answer) {
    throw new InterrogateApiError(
      data?.error ?? "Unable to generate suspect answer.",
      response.status,
    );
  }

  return {
    answer: data.answer,
    discoveredConfessionIds: Array.isArray(data.discoveredConfessionIds)
      ? data.discoveredConfessionIds.filter(
          (id): id is string => typeof id === "string",
        )
      : [],
  };
}

export async function askSuspect(
  params: AskSuspectParams,
): Promise<SuspectAnswer> {
  try {
    return await askConfiguredLLMEngine(params);
  } catch {
    await wait(320);

    return {
      answer: mockSuspectResponse(params),
      discoveredConfessionIds: [],
    };
  }
}
