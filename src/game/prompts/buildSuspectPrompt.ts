import { suspectPromptGuardrails } from "@/game/prompts/promptTemplates";
import type {
  InterrogationState,
  SuspectProfile,
} from "@/game/types/suspect";

const getPressureStep = (pressureLevel: number) => {
  return Math.min(5, Math.floor(pressureLevel / 20) + 1);
};

export function buildSuspectPrompt(
  suspect: SuspectProfile,
  interrogationState: InterrogationState,
) {
  const pressureStep = getPressureStep(interrogationState.pressureLevel);
  const confessionTargets = suspect.confessionChecklist
    .slice(0, 5)
    .flatMap((item) =>
      item ? [`- ${item.id}: ${item.label} / ${item.confession}`] : [],
    )
    .join("\n");

  return `
${suspect.systemPrompt.trim()}

Current interrogation state:
- Questions asked: ${interrogationState.questionsAsked}
- Topics covered: ${
    interrogationState.topicsCovered.length > 0
      ? interrogationState.topicsCovered.join(", ")
      : "none"
  }
- Contradictions found: ${
    interrogationState.contradictionsFound.length > 0
      ? interrogationState.contradictionsFound.join(" | ")
      : "none"
  }
- Pressure level: ${interrogationState.pressureLevel}
- Pressure stage: ${pressureStep}/5
- Confession unlocked: ${interrogationState.confessionUnlocked ? "yes" : "no"}
- Completed confession IDs: ${
    interrogationState.completedConfessionIds.length > 0
      ? interrogationState.completedConfessionIds.join(", ")
      : "none"
  }

Pressure behaviour:
- Stage 1: stay guarded and evasive unless asked about exact evidence.
- Stage 2: give one concrete detail when the question is relevant.
- Stage 3: let one uncomfortable observation slip.
- Stage 4: reveal a meaningful secret, but avoid a full confession unless unlocked.
- Stage 5: tell the strongest truthful version you can, confess if unlocked, and stop hiding behind jokes.

Confession targets:
${confessionTargets || "- none configured"}

Engine output contract:
- Return only a compact JSON object with these exact keys: answer, discoveredConfessionIds.
- answer is the suspect's spoken in-character answer only.
- discoveredConfessionIds is an array of checklist IDs whose fact the suspect clearly admits, confirms, or reveals in this answer.
- Use [] when no new checklist fact is discovered.

${suspectPromptGuardrails.trim()}
`;
}
