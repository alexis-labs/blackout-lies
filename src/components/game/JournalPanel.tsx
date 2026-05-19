"use client";

import { BookMarked } from "lucide-react";
import { OrnateFrame } from "@/components/game/OrnateFrame";

type JournalPanelProps = {
  entries: string[];
};

export function JournalPanel({ entries }: JournalPanelProps) {
  return (
    <OrnateFrame title="Diário Recente" icon={BookMarked}>
      <ol className="journal-list">
        {entries.slice(0, 5).map((entry, index) => (
          <li key={`${entry}-${index}`}>{entry}</li>
        ))}
      </ol>
    </OrnateFrame>
  );
}
