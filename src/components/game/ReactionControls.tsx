"use client";

import {
  BadgeCheck,
  MessageSquareWarning,
  Scale,
  type LucideIcon,
} from "lucide-react";
import type { InterrogationReaction } from "@/game/types/dialogue";
import { useSound } from "@/hooks/useSound";

type ReactionControlsProps = {
  disabled?: boolean;
  hasPendingReaction: boolean;
  onSelectReaction: (reaction: InterrogationReaction) => void;
};

type ReactionOption = {
  id: InterrogationReaction;
  icon: LucideIcon;
  label: string;
};

const reactionOptions: ReactionOption[] = [
  {
    id: "truth",
    icon: BadgeCheck,
    label: "Truth",
  },
  {
    id: "doubt",
    icon: MessageSquareWarning,
    label: "Doubt",
  },
  {
    id: "lie",
    icon: Scale,
    label: "Lie",
  },
];

export function ReactionControls({
  disabled = false,
  hasPendingReaction,
  onSelectReaction,
}: ReactionControlsProps) {
  const { play } = useSound();
  const isDisabled = disabled || !hasPendingReaction;

  return (
    <aside
      className="reaction-controls"
      aria-label="Choose one interrogation reaction"
    >
      <span className="reaction-label">REACT</span>
      <ul>
        {reactionOptions.map((option) => {
          const Icon = option.icon;

          return (
            <li key={option.id}>
              <button
                type="button"
                className={`reaction-button reaction-${option.id}`}
                disabled={isDisabled}
                title={option.label}
                onMouseEnter={() => play("buttonHover")}
                onClick={() => {
                  onSelectReaction(option.id);
                  play("buttonClick");
                }}
              >
                <Icon size={18} strokeWidth={2.4} aria-hidden="true" />
                <strong>{option.label}</strong>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
