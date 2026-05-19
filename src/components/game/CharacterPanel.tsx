"use client";

import { Brain, Crown, Heart, UserRound } from "lucide-react";
import type { PlayerState } from "@/lib/gameTypes";
import { OrnateFrame } from "@/components/game/OrnateFrame";
import { StatusBar } from "@/components/game/StatusBar";

type CharacterPanelProps = {
  player: PlayerState;
};

export function CharacterPanel({ player }: CharacterPanelProps) {
  return (
    <OrnateFrame title="Personagem" icon={UserRound} className="panel-glow">
      <div className="character-card">
        <div className="character-sigil">
          <Crown size={28} strokeWidth={1.6} />
        </div>
        <div>
          <h3>{player.name}</h3>
          <p>
            {player.className} · Nível {player.level}
          </p>
        </div>
      </div>

      <div className="panel-stack">
        <StatusBar
          label="Vida"
          value={player.vitals.health}
          max={player.vitals.maxHealth}
          tone="health"
          icon={Heart}
        />
        <StatusBar
          label="Sanidade"
          value={player.vitals.sanity}
          max={player.vitals.maxSanity}
          tone="sanity"
          icon={Brain}
        />
      </div>
    </OrnateFrame>
  );
}
