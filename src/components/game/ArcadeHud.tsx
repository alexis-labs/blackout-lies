"use client";

import { Trophy } from "lucide-react";
import type { InterrogationState } from "@/game/types/suspect";

type ArcadeHudProps = {
  interrogationState: InterrogationState;
};

export function ArcadeHud({ interrogationState }: ArcadeHudProps) {
  return (
    <aside className="arcade-hud" aria-label="Arcade interrogation status">
      <div>
        <Trophy size={15} strokeWidth={2.3} aria-hidden="true" />
        <span>SCORE</span>
        <strong>{interrogationState.arcadeScore.toLocaleString()}</strong>
      </div>
    </aside>
  );
}
