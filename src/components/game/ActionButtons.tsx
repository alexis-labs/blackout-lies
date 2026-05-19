"use client";

import {
  Backpack,
  Lamp,
  Map,
  MessageCircle,
  Route,
  Search,
  Sparkles,
  Sword,
  Trees,
  Undo2,
} from "lucide-react";
import type { ActionIconName, SuggestedAction } from "@/lib/gameTypes";

const actionIcons = {
  message: MessageCircle,
  search: Search,
  route: Route,
  lamp: Lamp,
  map: Map,
  backpack: Backpack,
  sword: Sword,
  rest: Trees,
  spark: Sparkles,
  flee: Undo2,
} satisfies Record<ActionIconName, typeof Search>;

type ActionButtonsProps = {
  actions: SuggestedAction[];
  disabled?: boolean;
  onChoose: (input: string) => void;
};

export function ActionButtons({
  actions,
  disabled = false,
  onChoose,
}: ActionButtonsProps) {
  return (
    <section className="actions-panel" aria-labelledby="suggested-actions">
      <div className="section-heading">
        <h2 id="suggested-actions">Ações Sugeridas</h2>
      </div>
      <div className="action-grid">
        {actions.map((action) => {
          const Icon = actionIcons[action.icon] ?? Sparkles;
          return (
            <button
              key={action.id}
              type="button"
              className={`action-button action-${action.tone ?? "default"}`}
              disabled={disabled}
              onClick={() => onChoose(action.input)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
