"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSound } from "@/hooks/useSound";

type SoundToggleProps = {
  enabled: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
};

export function SoundToggle({
  enabled,
  volume,
  onToggle,
  onVolumeChange,
}: SoundToggleProps) {
  const Icon = enabled ? Volume2 : VolumeX;
  const { play } = useSound();

  return (
    <div className="sound-controls">
      <button
        type="button"
        className="sound-toggle-button"
        aria-pressed={enabled}
        onMouseEnter={() => play("buttonHover")}
        onClick={() => {
          play("buttonClick");
          onToggle();
        }}
      >
        <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
        <span className="sound-toggle-label">
          {enabled ? "SOUND ON" : "SOUND OFF"}
        </span>
      </button>
      <label>
        <span>VOL</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          disabled={!enabled}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
