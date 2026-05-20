"use client";

import { useSound } from "@/hooks/useSound";
import type { SuspectId, SuspectProfile } from "@/game/types/suspect";

type SuspectSelectorProps = {
  suspects: SuspectProfile[];
  activeSuspectId: SuspectId;
  disabled?: boolean;
  onChange: (suspectId: SuspectId) => void;
};

export function SuspectSelector({
  suspects,
  activeSuspectId,
  disabled = false,
  onChange,
}: SuspectSelectorProps) {
  const { play } = useSound();

  return (
    <label className="suspect-selector">
      <span>SUSPECT</span>
      <select
        value={activeSuspectId}
        disabled={disabled}
        onMouseEnter={() => play("buttonHover")}
        onChange={(event) => {
          onChange(event.target.value);
          play("tabSwitch");
        }}
      >
        {suspects.map((suspect) => (
          <option key={suspect.id} value={suspect.id}>
            {suspect.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}
