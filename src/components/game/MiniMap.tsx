"use client";

import { Map } from "lucide-react";
import type { LocationState, WorldState } from "@/lib/gameTypes";
import { OrnateFrame } from "@/components/game/OrnateFrame";

type MiniMapProps = {
  locations: Record<string, LocationState>;
  currentLocationId: string;
  world: WorldState;
};

export function MiniMap({
  locations,
  currentLocationId,
  world,
}: MiniMapProps) {
  const orderedLocations = Object.values(locations);

  return (
    <OrnateFrame title="Mapa" icon={Map} className="map-frame">
      <div className="mini-map">
        {orderedLocations.map((location) => {
          const unlocked = world.unlockedLocationIds.includes(location.id);
          const current = currentLocationId === location.id;
          return (
            <div
              key={location.id}
              className={`map-node ${current ? "node-current" : ""} ${
                unlocked ? "node-unlocked" : "node-locked"
              }`}
            >
              <span className="node-marker" />
              <div>
                <strong>{unlocked ? location.name : "Zona velada"}</strong>
                <small>{unlocked ? location.danger : "???"}</small>
              </div>
            </div>
          );
        })}
      </div>
    </OrnateFrame>
  );
}
