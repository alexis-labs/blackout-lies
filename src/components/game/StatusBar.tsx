"use client";

import type { LucideIcon } from "lucide-react";

type StatusBarProps = {
  label: string;
  value: number;
  max: number;
  tone: "xp" | "health" | "sanity" | "vigor";
  icon?: LucideIcon;
};

const toneClass = {
  xp: "bar-xp",
  health: "bar-health",
  sanity: "bar-sanity",
  vigor: "bar-vigor",
};

export function StatusBar({
  label,
  value,
  max,
  tone,
  icon: Icon,
}: StatusBarProps) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="status-row">
      <div className="status-label">
        <span>
          {Icon && <Icon size={14} strokeWidth={1.8} />}
          {label}
        </span>
        <strong>
          {value}/{max}
        </strong>
      </div>
      <div className="status-track" aria-label={`${label}: ${percent}%`}>
        <span
          className={`status-fill ${toneClass[tone]}`}
          style={{ width: `${clampPercent(percent)}%` }}
        />
      </div>
    </div>
  );
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}
