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
  tactic: string;
  hint: string;
};

const reactionOptions: ReactionOption[] = [
  {
    id: "truth",
    icon: BadgeCheck,
    label: "Truth",
    tactic: "Good Cop",
    hint: "Acreditar",
  },
  {
    id: "doubt",
    icon: MessageSquareWarning,
    label: "Doubt",
    tactic: "Bad Cop",
    hint: "Duvidar / pressionar",
  },
  {
    id: "lie",
    icon: Scale,
    label: "Lie",
    tactic: "Accuse",
    hint: "Mentira / acusar",
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
                title={
                  option.id === "lie"
                    ? "Accuse only works when the statement has evidence."
                    : option.hint
                }
                onMouseEnter={() => play("buttonHover")}
                onClick={() => {
                  onSelectReaction(option.id);
                  play("buttonClick");
                }}
              >
                <Icon size={18} strokeWidth={2.4} aria-hidden="true" />
                <span>
                  <strong>{option.label}</strong>
                  <small>
                    {option.tactic} - {option.hint}
                  </small>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
