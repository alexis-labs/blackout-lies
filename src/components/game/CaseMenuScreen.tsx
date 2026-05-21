"use client";

import { useMemo, useState } from "react";
import type {
  AvailableCaseFolder,
  CaseFolder,
  CaseProgress,
} from "@/game/types/case";
import { useSound } from "@/hooks/useSound";

type CaseMenuScreenProps = {
  cases: readonly CaseFolder[];
  progressByCaseId: Record<string, CaseProgress | undefined>;
  onSelectCase: (caseId: string) => void;
};

const CASE_MENU_BACKGROUND_URL = "/assets/start/start-background.png";

function isAvailableCase(
  caseFolder: CaseFolder | undefined,
): caseFolder is AvailableCaseFolder {
  return Boolean(caseFolder && caseFolder.status !== "LOCKED");
}

function getDisplayStatus(
  caseFolder: CaseFolder,
  progress?: CaseProgress,
) {
  if (caseFolder.status === "LOCKED") {
    return "LOCKED";
  }

  return progress?.isComplete ? "COMPLETE" : caseFolder.status;
}

export function CaseMenuScreen({
  cases,
  progressByCaseId,
  onSelectCase,
}: CaseMenuScreenProps) {
  const [activeCaseId, setActiveCaseId] = useState(cases[0]?.id ?? "");
  const { play } = useSound();
  const activeCase = useMemo(
    () => cases.find((caseFolder) => caseFolder.id === activeCaseId) ?? cases[0],
    [activeCaseId, cases],
  );
  const activeProgress = activeCase
    ? progressByCaseId[activeCase.id]
    : undefined;
  const activeStatus = activeCase
    ? getDisplayStatus(activeCase, activeProgress)
    : "LOCKED";

  return (
    <main className="case-menu-screen">
      <div
        className="case-menu-background"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${CASE_MENU_BACKGROUND_URL}")`,
        }}
      />

      <section className="case-menu-desk" aria-label="Case folders">
        <div className="case-menu-folder-list" aria-label="Case list">
          {cases.map((caseFolder) => {
            const progress = progressByCaseId[caseFolder.id];
            const displayStatus = getDisplayStatus(caseFolder, progress);
            const isActive = caseFolder.id === activeCase?.id;

            return (
              <button
                key={caseFolder.id}
                type="button"
                className={[
                  "case-folder",
                  isActive ? "active" : "",
                  displayStatus.toLowerCase(),
                ]
                  .filter(Boolean)
                  .join(" ")}
                onMouseEnter={() => play("buttonHover")}
                onClick={() => {
                  play("fileOpen");
                  setActiveCaseId(caseFolder.id);
                }}
              >
                <span className="case-folder-tab" aria-hidden="true" />
                <span className="case-folder-slot">{caseFolder.slotLabel}</span>
                <strong>{caseFolder.title}</strong>
                <span>{displayStatus}</span>
              </button>
            );
          })}
        </div>

        {activeCase ? (
          <article className="case-menu-file" aria-label="Selected case file">
            <header>
              <p>{activeCase.slotLabel}</p>
              <h1>{activeCase.title}</h1>
              <span className={`case-menu-stamp ${activeStatus.toLowerCase()}`}>
                {activeStatus}
              </span>
            </header>

            <div className="case-menu-copy">
              <p>{activeCase.description}</p>

              {isAvailableCase(activeCase) ? (
                <>
                  <h2>FILE CONTENTS:</h2>
                  <ul>
                    {activeCase.evidence.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="case-menu-locked-note">
                  The lock is cold, the label is blank, and the folder stays shut.
                </p>
              )}
            </div>

            {isAvailableCase(activeCase) ? (
              <footer>
                <div className="case-menu-progress">
                  <span>SUSPECT CHECKLISTS</span>
                  <strong>
                    {activeProgress?.completedSuspects ?? 0}/
                    {activeProgress?.totalSuspects ??
                      activeCase.suspectIds.length}
                  </strong>
                </div>

                <button
                  className="case-menu-select"
                  type="button"
                  onMouseEnter={() => play("buttonHover")}
                  onClick={() => {
                    play("buttonClick");
                    onSelectCase(activeCase.id);
                  }}
                >
                  Select
                </button>
              </footer>
            ) : null}
          </article>
        ) : null}
      </section>
    </main>
  );
}
