"use client";

import { Sparkles } from "lucide-react";
import type { PlayerStats } from "@/lib/gameTypes";
import { OrnateFrame } from "@/components/game/OrnateFrame";

const attributes: Array<[keyof PlayerStats, string]> = [
  ["strength", "Força"],
  ["intelligence", "Inteligência"],
  ["wisdom", "Sabedoria"],
  ["charisma", "Carisma"],
  ["dexterity", "Destreza"],
];

type AttributesPanelProps = {
  stats: PlayerStats;
};

export function AttributesPanel({ stats }: AttributesPanelProps) {
  return (
    <OrnateFrame title="Atributos" icon={Sparkles}>
      <div className="attributes-grid">
        {attributes.map(([key, label]) => (
          <div key={key} className="attribute-row">
            <span>{label}</span>
            <strong>{stats[key]}</strong>
          </div>
        ))}
      </div>
    </OrnateFrame>
  );
}
