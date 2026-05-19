import type { NarrativeResponse, PlayerAction } from "@/lib/gameTypes";
import { generateNarrativeResponse } from "@/lib/narrativeEngine";

const wait = (milliseconds: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

export async function mockLLMResponse(
  action: PlayerAction,
): Promise<NarrativeResponse> {
  await wait(260);
  return generateNarrativeResponse(action);
}

export async function realLLMResponse(
  action: PlayerAction,
): Promise<NarrativeResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(action),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(error?.error ?? "The LLM endpoint did not return a valid response.");
  }

  return (await response.json()) as NarrativeResponse;
}
