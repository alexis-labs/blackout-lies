"use client";

import { useLayoutEffect, useState } from "react";
import { CaseFilePanel } from "@/components/game/CaseFilePanel";
import { InputBar } from "@/components/game/InputBar";
import { PressureBar } from "@/components/game/PressureBar";
import { SpeechBubble } from "@/components/game/SpeechBubble";
import { SuggestedQuestions } from "@/components/game/SuggestedQuestions";
import { SoundToggle } from "@/components/game/SoundToggle";
import { SuspectBackground } from "@/components/game/SuspectBackground";
import { SuspectSelector } from "@/components/game/SuspectSelector";
import {
  askSuspect,
  createInitialInterrogationState,
  updateInterrogationProgress,
} from "@/game/engine/interrogationEngine";
import {
  defaultSuspectId,
  getAllSuspects,
  getSuspectById,
} from "@/game/suspects";
import type { CaseFileTab } from "@/game/types/case";
import type { DialogueEntry } from "@/game/types/dialogue";
import type {
  InterrogationState,
  SuspectId,
} from "@/game/types/suspect";
import { useSound } from "@/hooks/useSound";

type GameStatus = "idle" | "thinking" | "typing" | "error";

type PendingQuestion = {
  suspectId: SuspectId;
  text: string;
};

type InterrogationGameState = {
  activeFileTab: CaseFileTab;
  input: string;
  isFileOpen: boolean;
  activeSuspectId: SuspectId;
  interrogationStates: Record<SuspectId, InterrogationState>;
  suspectMessages: Record<SuspectId, string>;
  status: GameStatus;
  inputErrorKey: number;
  pendingQuestion?: PendingQuestion;
};

const allSuspects = getAllSuspects();

const makeInitialInterrogationStates = () =>
  Object.fromEntries(
    allSuspects.map((suspect) => [
      suspect.id,
      createInitialInterrogationState(suspect.id),
    ]),
  ) as Record<SuspectId, InterrogationState>;

const makeInitialSuspectMessages = () =>
  Object.fromEntries(
    allSuspects.map((suspect) => [
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

function createInitialGameState(): InterrogationGameState {
  return {
    activeFileTab: "case",
    input: "",
    // Keep first render deterministic for SSR hydration.
    isFileOpen: false,
    activeSuspectId: defaultSuspectId,
    interrogationStates: makeInitialInterrogationStates(),
    suspectMessages: makeInitialSuspectMessages(),
    status: "idle",
    inputErrorKey: 0,
    pendingQuestion: undefined,
  };
}

const makeDialogueId = () =>
  `dialogue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatTimestamp = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export function GameScreen() {
  const [game, setGame] = useState<InterrogationGameState>(
    createInitialGameState,
  );
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
  const isBusy = game.status === "thinking" || game.status === "typing";
  const isCaseClosed = activeInterrogationState.caseClosed;

  useLayoutEffect(() => {
    setGame((current) => ({
      ...current,
      isFileOpen: shouldOpenCaseFileByDefault(),
    }));
  }, []);

  function updateInput(input: string) {
    setGame((current) => ({ ...current, input }));
  }

  function toggleFile() {
    setGame((current) => ({ ...current, isFileOpen: !current.isFileOpen }));
  }

  function setActiveFileTab(activeFileTab: CaseFileTab) {
    setGame((current) => ({
      ...current,
      activeFileTab,
      isFileOpen: true,
    }));
  }

  function selectSuggestedQuestion(question: string) {
    setGame((current) => ({ ...current, input: question }));
  }

  function setActiveSuspectId(suspectId: SuspectId) {
    if (!getSuspectById(suspectId)) {
      return;
    }

    setGame((current) => ({
      ...current,
      activeSuspectId: suspectId,
      activeFileTab: "case",
      input: "",
      status: current.status === "thinking" ? current.status : "idle",
    }));
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
      activeFileTab: "history",
    }));

    try {
      const answer = await askSuspect({
        suspect,
        interrogationState,
        question,
      });
      stopThinkingLoop();
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
        const progressedState = updateInterrogationProgress(
          latestState,
          suspect,
          question,
          answer,
        );

        return {
          ...current,
          activeFileTab: progressedState.caseClosed
            ? "case"
            : current.activeFileTab,
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

  return (
    <main className="interrogation-screen">
      <SuspectBackground backgroundUrl={activeSuspect.backgroundUrl} />

      <div className="interrogation-controls" aria-label="Interrogation controls">
        <SuspectSelector
          suspects={allSuspects}
          activeSuspectId={activeSuspect.id}
          disabled={game.status === "thinking"}
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
        isOpen={game.isFileOpen}
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
        <SuggestedQuestions
          questions={activeSuspect.suggestedQuestions}
          onSelectQuestion={selectSuggestedQuestion}
        />

        <InputBar
          input={game.input}
          isFileOpen={game.isFileOpen}
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
    </main>
  );
}
