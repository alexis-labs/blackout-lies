import { NextResponse } from "next/server";
import {
  createInitialInterrogationState,
} from "@/game/engine/interrogationEngine";
import { generateConfiguredSuspectAnswer } from "@/game/engine/interrogationServer";
import { getSuspectById } from "@/game/suspects";
import type { InterrogationState } from "@/game/types/suspect";

type InterrogateRequestBody = {
  suspectId?: unknown;
  interrogationState?: unknown;
  question?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InterrogateRequestBody;
    const suspectId = typeof body.suspectId === "string" ? body.suspectId : "";
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const suspect = getSuspectById(suspectId);

    if (!suspect) {
      return NextResponse.json({ error: "Unknown suspect." }, { status: 404 });
    }

    if (!question) {
      return NextResponse.json({ error: "Missing question." }, { status: 400 });
    }

    const interrogationState = normalizeInterrogationState(
      suspect.id,
      body.interrogationState,
    );
    const suspectAnswer = await generateConfiguredSuspectAnswer({
      suspect,
      interrogationState,
      question,
    });

    return NextResponse.json(suspectAnswer);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process interrogation request.",
      },
      { status: 502 },
    );
  }
}

function normalizeInterrogationState(
  suspectId: string,
  value: unknown,
): InterrogationState {
  if (!value || typeof value !== "object") {
    return createInitialInterrogationState(suspectId);
  }

  const state = value as Partial<InterrogationState>;
  const fallback = createInitialInterrogationState(suspectId);

  return {
    suspectId,
    history: Array.isArray(state.history) ? state.history : fallback.history,
    questionsAsked:
      typeof state.questionsAsked === "number"
        ? state.questionsAsked
        : fallback.questionsAsked,
    topicsCovered: Array.isArray(state.topicsCovered)
      ? state.topicsCovered
      : fallback.topicsCovered,
    contradictionsFound: Array.isArray(state.contradictionsFound)
      ? state.contradictionsFound
      : fallback.contradictionsFound,
    pressureLevel:
      typeof state.pressureLevel === "number"
        ? state.pressureLevel
        : fallback.pressureLevel,
    confessionUnlocked:
      typeof state.confessionUnlocked === "boolean"
        ? state.confessionUnlocked
        : fallback.confessionUnlocked,
    completedConfessionIds: Array.isArray(state.completedConfessionIds)
      ? state.completedConfessionIds.filter(
          (id): id is string => typeof id === "string",
        )
      : fallback.completedConfessionIds,
    caseClosed:
      typeof state.caseClosed === "boolean"
        ? state.caseClosed
        : fallback.caseClosed,
  };
}
