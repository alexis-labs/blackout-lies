"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CaseFilePanel } from "@/components/game/CaseFilePanel";
import { EvidenceDesk } from "@/components/game/EvidenceDesk";
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
  findCaseDeskChallenge,
  getCaseEvidenceCards,
  resolveCaseDeskChallenge,
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
  CaseDeskChallenge,
  CaseDeskResolution,
} from "@/game/types/caseDesk";
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

type PendingCaseDesk = {
  suspectId: SuspectId;
  entryId: string;
  question: string;
  answer: string;
  discoveredConfessionIds: string[];
  challenge: CaseDeskChallenge;
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
  pendingCaseDesk?: PendingCaseDesk;
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
    pendingCaseDesk: undefined,
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
  const caseFolder = useMemo(() => getCaseFolderById(caseId), [caseId]);
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
  const pendingCaseDesk =
    game.pendingCaseDesk?.suspectId === activeSuspect.id
      ? game.pendingCaseDesk
      : undefined;
  const activeEvidenceCards = useMemo(
    () =>
      getCaseEvidenceCards(
        activeSuspect,
        caseFolder?.status !== "LOCKED" ? caseFolder?.evidenceCards : [],
      ),
    [activeSuspect, caseFolder],
  );
  const isDeskOpen = Boolean(pendingCaseDesk);
  const isBusy =
    game.status === "thinking" || game.status === "typing" || isDeskOpen;
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
      pendingCaseDesk:
        current.pendingCaseDesk?.suspectId === nextSuspectId
          ? current.pendingCaseDesk
          : undefined,
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

    if (isBusy || interrogationState.caseClosed) {
      return;
    }

    play("sendQuestion");
    startThinkingLoop();

    setGame((current) => ({
      ...current,
      input: "",
      status: "thinking",
      pendingQuestion: { suspectId: suspect.id, text: question },
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
      const caseDeskChallenge = findCaseDeskChallenge({
        suspect,
        interrogationState,
        question,
        answer,
      });

      setGame((current) => {
        const latestState =
          current.interrogationStates[suspect.id] ??
          createInitialInterrogationState(suspect.id);
        const nextHistory = [...latestState.history, entry];

        if (caseDeskChallenge) {
          return {
            ...current,
            interrogationStates: {
              ...current.interrogationStates,
              [suspect.id]: {
                ...latestState,
                history: nextHistory,
              },
            },
            suspectMessages: {
              ...current.suspectMessages,
              [suspect.id]: answer,
            },
            status: "typing",
            pendingQuestion: undefined,
            pendingReaction: undefined,
            pendingCaseDesk: {
              suspectId: suspect.id,
              entryId,
              question,
              answer,
              discoveredConfessionIds,
              challenge: caseDeskChallenge,
            },
          };
        }

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
              history: nextHistory,
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
          pendingCaseDesk: undefined,
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
          pendingCaseDesk: undefined,
        };
      });
    }
  }

  function resolvePendingCaseDesk(resolution: CaseDeskResolution) {
    const caseDesk = pendingCaseDesk;
    const suspect = activeSuspect;

    if (!caseDesk || caseDesk.suspectId !== suspect.id) {
      return;
    }

    play(resolution.isCorrect ? "fileOpen" : "errorBuzz");

    setGame((current) => {
      const latestState =
        current.interrogationStates[suspect.id] ??
        createInitialInterrogationState(suspect.id);
      const entry = latestState.history.find(
        (historyEntry) => historyEntry.id === caseDesk.entryId,
      );
      const progressedState = updateInterrogationProgress(
        latestState,
        suspect,
        caseDesk.question,
        caseDesk.answer,
        caseDesk.discoveredConfessionIds,
        { caseDeskResolution: resolution },
      );

      return {
        ...current,
        activeFileTab: "history",
        interrogationStates: {
          ...current.interrogationStates,
          [suspect.id]: {
            ...progressedState,
            history: latestState.history.map((historyEntry) =>
              historyEntry.id === caseDesk.entryId
                ? {
                    ...(entry ?? historyEntry),
                    deskResult: resolution,
                  }
                : historyEntry,
            ),
          },
        },
        suspectMessages: {
          ...current.suspectMessages,
          [suspect.id]: resolution.isCorrect
            ? `${caseDesk.answer}\n\n${suspect.shortName}'s eyes drop to the file. "That one bites."`
            : `${caseDesk.answer}\n\n${suspect.shortName} lets the silence work for him.`,
        },
        pendingCaseDesk:
          current.pendingCaseDesk?.entryId === caseDesk.entryId
            ? undefined
            : current.pendingCaseDesk,
      };
    });
  }

  function selectEvidence(evidenceId: string) {
    const caseDesk = pendingCaseDesk;

    if (!caseDesk || game.status === "typing") {
      return;
    }

    resolvePendingCaseDesk(
      resolveCaseDeskChallenge({
        challenge: caseDesk.challenge,
        selectedEvidenceId: evidenceId,
      }),
    );
  }

  function timeoutEvidenceDesk() {
    const caseDesk = pendingCaseDesk;

    if (!caseDesk || game.status === "typing") {
      return;
    }

    resolvePendingCaseDesk(
      resolveCaseDeskChallenge({
        challenge: caseDesk.challenge,
        timedOut: true,
      }),
    );
  }

  function selectReaction(selectedReaction: InterrogationReaction) {
    const reaction = pendingReaction;
    const suspect = activeSuspect;

    if (!reaction || game.status === "thinking" || isCaseClosed || isDeskOpen) {
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
        pendingCaseDesk: undefined,
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
        evidenceCards={activeEvidenceCards}
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
          disabled={game.status === "thinking" || isCaseClosed || isDeskOpen}
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

      {pendingCaseDesk ? (
        <EvidenceDesk
          key={pendingCaseDesk.challenge.id}
          challenge={pendingCaseDesk.challenge}
          evidenceCards={activeEvidenceCards}
          interrogationState={activeInterrogationState}
          paused={game.status === "typing"}
          onSelectEvidence={selectEvidence}
          onTimeout={timeoutEvidenceDesk}
        />
      ) : null}

      {isSuspectTransitioning ? (
        <PageTransition
          onCover={revealSuspectTransition}
          onComplete={completeSuspectTransition}
        />
      ) : null}
    </main>
  );
}
