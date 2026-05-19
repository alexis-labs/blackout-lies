import { NextResponse } from "next/server";
import type { PlayerAction } from "@/lib/gameTypes";
import { generateConfiguredNarrativeResponse } from "@/lib/llmServer";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PlayerAction>;

    if (!body.input || !body.player || !body.location || !body.world) {
      return NextResponse.json(
        { error: "Missing input, player, location, or world state." },
        { status: 400 },
      );
    }

    const response = await generateConfiguredNarrativeResponse(
      body as PlayerAction,
    );

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process narrative request.",
      },
      { status: 502 },
    );
  }
}
