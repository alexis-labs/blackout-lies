"use client";

import { useCallback, useEffect, useState } from "react";
import { CaseMenuScreen } from "@/components/game/CaseMenuScreen";
import { GameScreen } from "@/components/game/GameScreen";
import { PageTransition } from "@/components/game/PageTransition";
import { StartScreen } from "@/components/game/StartScreen";
import { caseFolders } from "@/game/suspects/cases";
import type { CaseProgress } from "@/game/types/case";
import { useSound } from "@/hooks/useSound";

type GamePhase = "start" | "caseMenu" | "interrogation";

type TransitionTarget = {
  phase: GamePhase;
  caseId?: string;
};

export function GameShell() {
  const [phase, setPhase] = useState<GamePhase>("start");
  const [selectedCaseId, setSelectedCaseId] = useState<string>();
  const [transitionTarget, setTransitionTarget] = useState<TransitionTarget>();
  const [caseProgressById, setCaseProgressById] = useState<
    Record<string, CaseProgress | undefined>
  >({});
  const { startMusicLoop } = useSound();
  const isTransitioning = Boolean(transitionTarget);

  useEffect(() => {
    startMusicLoop();
  }, [startMusicLoop]);

  const beginTransition = useCallback((target: TransitionTarget) => {
    setTransitionTarget((current) => current ?? target);
  }, []);

  const updateCaseProgress = useCallback(
    (caseId: string, progress: CaseProgress) => {
      setCaseProgressById((current) => {
        const previous = current[caseId];

        if (
          previous?.completedSuspects === progress.completedSuspects &&
          previous?.totalSuspects === progress.totalSuspects &&
          previous?.isComplete === progress.isComplete
        ) {
          return current;
        }

        return {
          ...current,
          [caseId]: progress,
        };
      });
    },
    [],
  );

  return (
    <>
      {phase === "start" ? (
        <StartScreen onStart={() => beginTransition({ phase: "caseMenu" })} />
      ) : null}

      {phase === "caseMenu" ? (
        <CaseMenuScreen
          cases={caseFolders}
          progressByCaseId={caseProgressById}
          onSelectCase={(caseId) =>
            beginTransition({ phase: "interrogation", caseId })
          }
        />
      ) : null}

      {selectedCaseId ? (
        <div
          className={
            phase === "interrogation"
              ? "game-screen-mount active"
              : "game-screen-mount preserved"
          }
        >
          <GameScreen
            caseId={selectedCaseId}
            onBackToCases={() => beginTransition({ phase: "caseMenu" })}
            onProgressChange={updateCaseProgress}
          />
        </div>
      ) : null}
      {isTransitioning ? (
        <PageTransition
          onCover={() => {
            if (transitionTarget?.caseId) {
              setSelectedCaseId(transitionTarget.caseId);
            }
            setPhase(transitionTarget?.phase ?? phase);
          }}
          onComplete={() => setTransitionTarget(undefined)}
        />
      ) : null}
    </>
  );
}
