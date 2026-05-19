import type { NarrativeResponse, PlayerAction } from "@/lib/gameTypes";
import { generateNarrativeResponse } from "@/lib/narrativeEngine";

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ?? "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.4-nano";

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    narration: { type: "string" },
    suggestedActions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          input: { type: "string" },
          icon: {
            type: "string",
            enum: [
              "message",
              "search",
              "route",
              "lamp",
              "map",
              "backpack",
              "sword",
              "rest",
              "spark",
              "flee",
            ],
          },
          tone: {
            type: "string",
            enum: ["default", "danger", "magic", "safe"],
          },
        },
        required: ["id", "label", "input", "icon"],
      },
    },
    statChanges: {
      type: "object",
      additionalProperties: false,
      properties: {
        strength: { type: "number" },
        intelligence: { type: "number" },
        wisdom: { type: "number" },
        charisma: { type: "number" },
        dexterity: { type: "number" },
      },
    },
    vitalChanges: {
      type: "object",
      additionalProperties: false,
      properties: {
        health: { type: "number" },
        maxHealth: { type: "number" },
        sanity: { type: "number" },
        maxSanity: { type: "number" },
        vigor: { type: "number" },
        maxVigor: { type: "number" },
      },
    },
    inventoryAdd: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          icon: {
            type: "string",
            enum: [
              "map",
              "lamp",
              "coin",
              "book",
              "key",
              "feather",
              "scroll",
              "potion",
              "shield",
              "compass",
              "gem",
              "default",
            ],
          },
          quantity: { type: "number" },
          description: { type: "string" },
          rarity: {
            type: "string",
            enum: ["common", "uncommon", "rare", "quest"],
          },
        },
        required: ["id", "name", "icon"],
      },
    },
    inventoryRemove: {
      type: "array",
      items: { type: "string" },
    },
    xpGain: { type: "number" },
    locationChange: { type: "string" },
    journalEntry: { type: "string" },
    worldPatch: {
      type: "object",
      additionalProperties: false,
      properties: {
        currentObjective: { type: "string" },
        reputationLocal: { type: "number" },
        unlockLocations: {
          type: "array",
          items: { type: "string" },
        },
        flagUpdates: {
          type: "object",
          additionalProperties: { type: "boolean" },
        },
        weather: { type: "string" },
        timeOfDay: { type: "string" },
        danger: {
          type: "string",
          enum: ["Baixo", "Médio", "Alto", "Mortal"],
        },
      },
    },
  },
  required: ["narration", "suggestedActions"],
};

export async function generateConfiguredNarrativeResponse(
  action: PlayerAction,
): Promise<NarrativeResponse> {
  const provider =
    process.env.LLM_PROVIDER?.toLowerCase() ??
    (process.env.OPENAI_API_KEY ? "openai" : "mock");

  if (provider !== "openai") {
    return withoutSuggestions(generateNarrativeResponse(action));
  }

  if (!process.env.OPENAI_API_KEY) {
    return withoutSuggestions(generateNarrativeResponse(action));
  }

  return requestOpenAIResponse(action);
}

async function requestOpenAIResponse(
  action: PlayerAction,
): Promise<NarrativeResponse> {
  const response = await fetch(`${OPENAI_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: systemPrompt(),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(buildPromptState(action)),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "narrative_response",
          description:
            "A game engine response for Echoes of the Hollow Crown.",
          schema: responseSchema,
          strict: false,
        },
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI request failed: ${details}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  return normalizeLLMResponse(extractOutputText(data));
}

function systemPrompt() {
  return [
    "You are the narrative engine for Echoes of the Hollow Crown, a dark medieval fantasy text adventure.",
    "Respond in European Portuguese.",
    "Continue the story from the supplied state and the player's free-form action.",
    "Be interactive: let the player's action change the world when plausible.",
    "Return only JSON that matches the schema.",
    "The UI no longer shows suggested choices, so always return suggestedActions as an empty array.",
    "Keep narration vivid but concise: 1 to 3 short paragraphs.",
    "Use xpGain, vitalChanges, inventoryAdd, inventoryRemove, journalEntry, locationChange, and worldPatch when they make gameplay sense.",
    "Only use a locationChange id from availableLocationIds.",
    "Do not kill the player outright. Keep health and sanity changes small.",
  ].join("\n");
}

function buildPromptState(action: PlayerAction) {
  return {
    playerInput: action.input,
    player: action.player,
    currentLocation: action.location,
    world: action.world,
    availableLocationIds: action.location.connections.concat(action.location.id),
  };
}

function extractOutputText(data: OpenAIResponse) {
  if (data.output_text) {
    return data.output_text;
  }

  const text = data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");

  if (!text) {
    throw new Error("OpenAI response did not include output text.");
  }

  return text;
}

function normalizeLLMResponse(text: string): NarrativeResponse {
  const parsed = JSON.parse(text) as Partial<NarrativeResponse>;

  if (!parsed.narration || typeof parsed.narration !== "string") {
    throw new Error("LLM response did not include valid narration.");
  }

  return {
    ...parsed,
    narration: parsed.narration,
    suggestedActions: [],
  };
}

function withoutSuggestions(response: NarrativeResponse): NarrativeResponse {
  return {
    ...response,
    suggestedActions: [],
  };
}
