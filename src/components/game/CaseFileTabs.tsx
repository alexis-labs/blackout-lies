"use client";

import type { CaseFileTab } from "@/game/types/case";
import { useSound } from "@/hooks/useSound";

const tabs: Array<{ id: CaseFileTab; label: string }> = [
  { id: "case", label: "CASE FILE" },
  { id: "history", label: "HISTORY" },
  { id: "notes", label: "NOTES" },
];

type CaseFileTabsProps = {
  activeTab: CaseFileTab;
  onChange: (tab: CaseFileTab) => void;
};

export function CaseFileTabs({ activeTab, onChange }: CaseFileTabsProps) {
  const { play } = useSound();

  return (
    <div className="case-file-tabs" role="tablist" aria-label="Case file tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? "active" : ""}
          role="tab"
          aria-selected={activeTab === tab.id}
          onMouseEnter={() => play("buttonHover")}
          onClick={() => {
            if (activeTab !== tab.id) {
              play("tabSwitch");
            } else {
              play("buttonClick");
            }
            onChange(tab.id);
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
