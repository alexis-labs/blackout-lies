"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CaseFilePanel } from "@/components/game/CaseFilePanel";
import { InputBar } from "@/components/game/InputBar";
import { PageTransition } from "@/components/game/PageTransition";
import { PressureBar } from "@/components/game/PressureBar";
import { ReactionControls } from "@/components/game/ReactionControls";
import { SpeechBubble } from "@/components/game/SpeechBubble";
import { SoundToggle } from "@/components/game/SoundToggle";
import { SuspectBackground } from "@/components/game/SuspectBackground";
import { SuspectSelector } from "@/components/game/SuspectSelector";
import {
  askSuspect,
  createInitialInterrogationState,
  resolveInterrogationReaction,
  updateInterrogationProgress,
} from "@/game/engine/interrogationEngine";
import {
  defaultSuspectId,
  getAllSuspects,
  getSuspectById,
} from "@/game/suspects";
import { getCaseFolderById } from "@/game/suspects/cases";
import type { CaseFileTab, CaseProgress } from "@/game/types/case";
import type {
  DialogueEntry,
  InterrogationReaction,
} from "@/game/types/dialogue";
import type {
  InterrogationState,
  SuspectId,
  SuspectProfile,
} from "@/game/types/suspect";
import { useSound } from "@/hooks/useSound";

type GameStatus = "idle" | "thinking" | "typing" | "error";

type GameScreenProps = {
  caseId: string;
  onBackToCases: () => void;
  onProgressChange?: (caseId: string, progress: CaseProgress) => void;
};

type PendingQuestion = {
  suspectId: SuspectId;
  text: string;
};

type PendingReaction = {
  suspectId: SuspectId;
  entryId: string;
  question: string;
  answer: string;
  discoveredConfessionIds: string[];
};

type InterrogationGameState = {
  activeFileTab: CaseFileTab;
  input: string;
  isFileOpen?: boolean;
  activeSuspectId: SuspectId;
  interrogationStates: Record<SuspectId, InterrogationState>;
  suspectMessages: Record<SuspectId, string>;
  status: GameStatus;
  inputErrorKey: number;
  pendingQuestion?: PendingQuestion;
  pendingReaction?: PendingReaction;
};

const registeredSuspects = getAllSuspects();

function isSuspectProfile(
  suspect: SuspectProfile | undefined,
): suspect is SuspectProfile {
  return Boolean(suspect);
}

function getSuspectsForCase(caseId: string) {
  const caseFolder = getCaseFolderById(caseId);

  if (caseFolder && caseFolder.status !== "LOCKED") {
    const caseSuspects = caseFolder.suspectIds
      .map((suspectId) => getSuspectById(suspectId))
      .filter(isSuspectProfile);

    if (caseSuspects.length > 0) {
      return caseSuspects;
    }
  }

  return registeredSuspects;
}

const makeInitialInterrogationStates = (suspects: SuspectProfile[]) =>
  Object.fromEntries(
    suspects.map((suspect) => [
      suspect.id,
      createInitialInterrogationState(suspect.id),
    ]),
  ) as Record<SuspectId, InterrogationState>;

const makeInitialSuspectMessages = (suspects: SuspectProfile[]) =>
  Object.fromEntries(
    suspects.map((suspect) => [
      suspect.id,
      suspect.initialMessage ?? `${suspect.shortName} waits under the lamp.`,
    ]),
  ) as Record<SuspectId, string>;

const MOBILE_CASE_FILE_QUERY = "(max-width: 980px)";

function shouldOpenCaseFileByDefault() {
  if (typeof window === "undefined") {
    return false;
  }

  return !window.matchMedia(MOBILE_CASE_FILE_QUERY).matches;
}

function subscribeToCaseFilePreference(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(MOBILE_CASE_FILE_QUERY);
  mediaQuery.addEventListener("change", onChange);

  return () => {
    mediaQuery.removeEventListener("change", onChange);
  };
}

function createInitialGameState(caseId: string): InterrogationGameState {
  const suspects = getSuspectsForCase(caseId);
  const firstSuspect = suspects[0];

  return {
    activeFileTab: "case",
    input: "",
    isFileOpen: undefined,
    activeSuspectId: firstSuspect?.id ?? defaultSuspectId,
    interrogationStates: makeInitialInterrogationStates(suspects),
    suspectMessages: makeInitialSuspectMessages(suspects),
    status: "idle",
    inputErrorKey: 0,
    pendingQuestion: undefined,
    pendingReaction: undefined,
  };
}

const makeDialogueId = () =>
  `dialogue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatTimestamp = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export function GameScreen({
  caseId,
  onBackToCases,
  onProgressChange,
}: GameScreenProps) {
  const allSuspects = useMemo(() => getSuspectsForCase(caseId), [caseId]);
  const [game, setGame] = useState<InterrogationGameState>(
    () => createInitialGameState(caseId),
  );
  const [transitioningSuspectId, setTransitioningSuspectId] =
    useState<SuspectId>();
  const {
    enabled: soundEnabled,
    play,
    setVolume,
    startThinkingLoop,
    stopThinkingLoop,
    toggleEnabled,
    volume,
  } = useSound();
  const fallbackSuspect = allSuspects[0];
  const defaultIsFileOpen = useSyncExternalStore(
    subscribeToCaseFilePreference,
    shouldOpenCaseFileByDefault,
    () => false,
  );
  const isFileOpen = game.isFileOpen ?? defaultIsFileOpen;
  const activeSuspect =
    getSuspectById(game.activeSuspectId) ?? fallbackSuspect;
  const activeInterrogationState =
    game.interrogationStates[activeSuspect.id] ??
    createInitialInterrogationState(activeSuspect.id);
  const currentSuspectMessage =
    game.suspectMessages[activeSuspect.id] ??
    activeSuspect.initialMessage ??
    `${activeSuspect.shortName} waits under the lamp.`;
  const pendingQuestion =
    game.pendingQuestion?.suspectId === activeSuspect.id
      ? game.pendingQuestion.text
      : undefined;
  const pendingReaction =
    game.pendingReaction?.suspectId === activeSuspect.id
      ? game.pendingReaction
      : undefined;
  const isBusy = game.status === "thinking" || game.status === "typing";
  const hasReactionTarget = Boolean(pendingReaction);
  const isSuspectTransitioning = Boolean(transitioningSuspectId);
  const isCaseClosed = activeInterrogationState.caseClosed;
  const caseProgress = useMemo<CaseProgress>(() => {
    const totalSuspects = allSuspects.length;
    const completedSuspects = allSuspects.filter(
      (suspect) => game.interrogationStates[suspect.id]?.caseClosed,
    ).length;

    return {
      completedSuspects,
      totalSuspects,
      isComplete: totalSuspects > 0 && completedSuspects === totalSuspects,
    };
  }, [allSuspects, game.interrogationStates]);

  useEffect(() => {
    onProgressChange?.(caseId, caseProgress);
  }, [caseId, caseProgress, onProgressChange]);

  function updateInput(input: string) {
    setGame((current) => ({ ...current, input }));
  }

  function toggleFile() {
    setGame((current) => ({ ...current, isFileOpen: !isFileOpen }));
  }

  function setActiveFileTab(activeFileTab: CaseFileTab) {
    setGame((current) => ({
      ...current,
      activeFileTab,
      isFileOpen: true,
    }));
  }

  function setActiveSuspectId(suspectId: SuspectId) {
    if (
      !allSuspects.some((suspect) => suspect.id === suspectId) ||
      suspectId === game.activeSuspectId ||
      isSuspectTransitioning
    ) {
      return;
    }

    setTransitioningSuspectId(suspectId);
  }

  function revealSuspectTransition() {
    const nextSuspectId = transitioningSuspectId;

    if (!nextSuspectId || !getSuspectById(nextSuspectId)) {
      setTransitioningSuspectId(undefined);
      return;
    }

    setGame((current) => ({
      ...current,
      activeSuspectId: nextSuspectId,
      activeFileTab: "case",
      input: "",
      status: current.status === "thinking" ? current.status : "idle",
    }));
  }

  function completeSuspectTransition() {
    setTransitioningSuspectId(undefined);
  }

  async function submitQuestion() {
    const question = game.input.trim();
    const suspect = activeSuspect;
    const interrogationState = activeInterrogationState;

    if (!question) {
      play("errorBuzz");
      setGame((current) => ({
        ...current,
        status: "error",
        inputErrorKey: current.inputErrorKey + 1,
      }));
      window.setTimeout(() => {
        setGame((current) =>
          current.status === "error" ? { ...current, status: "idle" } : current,
        );
      }, 260);
      return;
    }

    if (
      isBusy ||
      interrogationState.caseClosed
    ) {
      return;
    }

    play("sendQuestion");
    startThinkingLoop();

    setGame((current) => ({
      ...current,
      input: "",
      status: "thinking",
      pendingQuestion: { suspectId: suspect.id, text: question },
      activeFileTab: "history",
    }));

    try {
      const suspectAnswer = await askSuspect({
        suspect,
        interrogationState,
        question,
      });
      const { answer, discoveredConfessionIds } = suspectAnswer;
      stopThinkingLoop();
      const entryId = makeDialogueId();
      const entry: DialogueEntry = {
        id: entryId,
        question,
        answer,
        timestamp: formatTimestamp(),
      };

      setGame((current) => {
        const latestState =
          current.interrogationStates[suspect.id] ??
          createInitialInterrogationState(suspect.id);
        const progressedState = updateInterrogationProgress(
          latestState,
          suspect,
          question,
          answer,
          discoveredConfessionIds,
        );

        return {
          ...current,
          activeFileTab: progressedState.caseClosed ? "case" : current.activeFileTab,
          interrogationStates: {
            ...current.interrogationStates,
            [suspect.id]: {
              ...progressedState,
              history: [...latestState.history, entry],
            },
          },
          suspectMessages: {
            ...current.suspectMessages,
            [suspect.id]: answer,
          },
          status: "typing",
          pendingQuestion: undefined,
          pendingReaction: {
            suspectId: suspect.id,
            entryId,
            question,
            answer,
            discoveredConfessionIds,
          },
        };
      });
    } catch {
      stopThinkingLoop();
      play("errorBuzz");
      const answer = `The room light buzzes, the tape recorder coughs, and ${suspect.shortName} gives you nothing. Try again.`;
      const entry: DialogueEntry = {
        id: makeDialogueId(),
        question,
        answer,
        timestamp: formatTimestamp(),
      };

      setGame((current) => {
        const latestState =
          current.interrogationStates[suspect.id] ??
          createInitialInterrogationState(suspect.id);

        return {
          ...current,
          interrogationStates: {
            ...current.interrogationStates,
            [suspect.id]: {
              ...latestState,
              history: [...latestState.history, entry],
            },
          },
          suspectMessages: {
            ...current.suspectMessages,
            [suspect.id]: answer,
          },
          status: "typing",
          pendingQuestion: undefined,
        };
      });
    }
  }

  function selectReaction(selectedReaction: InterrogationReaction) {
    const reaction = pendingReaction;
    const suspect = activeSuspect;

    if (!reaction || game.status === "thinking" || isCaseClosed) {
      return;
    }

    setGame((current) => {
      const latestState =
        current.interrogationStates[suspect.id] ??
        createInitialInterrogationState(suspect.id);
      const entry = latestState.history.find(
        (historyEntry) => historyEntry.id === reaction.entryId,
      );
      const reactionOutcome = resolveInterrogationReaction({
        suspect,
        question: reaction.question,
        answer: reaction.answer,
        discoveredConfessionIds: reaction.discoveredConfessionIds,
        selectedReaction,
      });

      return {
        ...current,
        activeFileTab: "history",
        interrogationStates: {
          ...current.interrogationStates,
          [suspect.id]: {
            ...latestState,
            history: latestState.history.map((historyEntry) =>
              historyEntry.id === reaction.entryId
                ? {
                    ...(entry ?? historyEntry),
                    reaction: reactionOutcome,
                  }
                : historyEntry,
            ),
          },
        },
        pendingReaction:
          current.pendingReaction?.entryId === reaction.entryId
            ? undefined
            : current.pendingReaction,
      };
    });
  }

  return (
    <main className="interrogation-screen">
      <SuspectBackground backgroundUrl={activeSuspect.backgroundUrl} />

      <div className="interrogation-controls" aria-label="Interrogation controls">
        <button
          className="case-menu-return-button"
          type="button"
          disabled={game.status === "thinking" || isSuspectTransitioning}
          onClick={() => {
            play("fileClose");
            onBackToCases();
          }}
        >
          Files
        </button>

        <SuspectSelector
          suspects={allSuspects}
          activeSuspectId={activeSuspect.id}
          disabled={game.status === "thinking" || isSuspectTransitioning}
          onChange={setActiveSuspectId}
        />

        <SoundToggle
          enabled={soundEnabled}
          volume={volume}
          onToggle={toggleEnabled}
          onVolumeChange={setVolume}
        />
      </div>

      <CaseFilePanel
        isOpen={isFileOpen}
        activeTab={game.activeFileTab}
        suspect={activeSuspect}
        interrogationState={activeInterrogationState}
        pendingQuestion={pendingQuestion}
        onTabChange={setActiveFileTab}
      />

      <section className="suspect-stage" aria-label="Suspect interrogation area">
        <SpeechBubble
          text={currentSuspectMessage}
          voice={activeSuspect.voice}
          isThinking={game.status === "thinking"}
          onTypingComplete={() => {
            setGame((current) =>
              current.status === "typing" ? { ...current, status: "idle" } : current,
            );
          }}
        />
      </section>

      <div className="interrogation-bottom-hud">
        <ReactionControls
          disabled={game.status === "thinking" || isCaseClosed}
          hasPendingReaction={hasReactionTarget}
          onSelectReaction={selectReaction}
        />

        <InputBar
          input={game.input}
          isFileOpen={isFileOpen}
          hasError={game.status === "error"}
          key={`input-${game.inputErrorKey}`}
          disabled={isBusy || isCaseClosed}
          isThinking={game.status === "thinking"}
          onInputChange={updateInput}
          onSubmit={submitQuestion}
          onToggleFile={toggleFile}
        />

        <PressureBar pressureLevel={activeInterrogationState.pressureLevel} />
      </div>

      {isSuspectTransitioning ? (
        <PageTransition
          onCover={revealSuspectTransition}
          onComplete={completeSuspectTransition}
        />
      ) : null}
    </main>
  );
}
