"use client";

import {
  AlertTriangle,
  CloudFog,
  Clock3,
  Crown,
  Flame,
  ShieldAlert,
} from "lucide-react";
import type { LocationState, WorldState } from "@/lib/gameTypes";
import { MiniMap } from "@/components/game/MiniMap";
import { OrnateFrame } from "@/components/game/OrnateFrame";

type RightWorldPanelProps = {
  location: LocationState;
  locations: Record<string, LocationState>;
  currentLocationId: string;
  world: WorldState;
};

export function RightWorldPanel({
  location,
  locations,
  currentLocationId,
  world,
}: RightWorldPanelProps) {
  return (
    <div className="right-stack">
      <OrnateFrame className="art-frame" contentClassName="art-content">
        <div className="world-art" aria-label={location.imagePrompt}>
          <div className="mist-layer" />
          <div className="moon-disc" />
          <div className="tower-silhouette" />
          <div className="road-silhouette" />
          <div className="raven-mark" />
          <div className="art-caption">
            <Crown size={16} strokeWidth={1.7} />
            {location.name}
          </div>
        </div>
      </OrnateFrame>

      <MiniMap
        locations={locations}
        currentLocationId={currentLocationId}
        world={world}
      />

      <OrnateFrame title="Objetivo" icon={Flame} className="objective-frame">
        <p className="objective-text">{world.currentObjective}</p>
      </OrnateFrame>

      <OrnateFrame
        title="Estado do Mundo"
        icon={ShieldAlert}
        className="world-state-frame"
      >
        <div className="world-state-grid">
          <WorldStateItem icon={Clock3} label="Hora" value={location.timeOfDay} />
          <WorldStateItem icon={CloudFog} label="Clima" value={location.weather} />
          <WorldStateItem
            icon={AlertTriangle}
            label="Perigo"
            value={location.danger}
          />
          <WorldStateItem
            icon={Crown}
            label="Reputação"
            value={String(world.reputationLocal)}
          />
        </div>
      </OrnateFrame>
    </div>
  );
}

function WorldStateItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="world-state-item">
      <Icon size={15} strokeWidth={1.8} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
