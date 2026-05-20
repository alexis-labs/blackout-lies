"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef } from "react";
import type { SuspectVoiceProfile } from "@/game/types/suspect";
import { useSound } from "@/hooks/useSound";
import { useTypewriter } from "@/hooks/useTypewriter";

type SpeechBubbleProps = {
  text: string;
  voice: SuspectVoiceProfile;
  isThinking?: boolean;
  typewriterEnabled?: boolean;
  onTypingComplete?: () => void;
};

export function SpeechBubble({
  text,
  voice,
  isThinking = false,
  typewriterEnabled = true,
  onTypingComplete,
}: SpeechBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const { playDialogueBlip } = useSound();
  const handleChar = useCallback(
    (character: string, index: number) => {
      if (index % Math.max(1, voice.blipEveryNChars) === 0) {
        playDialogueBlip(character, voice);
      }
    },
    [playDialogueBlip, voice],
  );
  const { visibleText, isTyping, skip } = useTypewriter(text, {
    enabled: typewriterEnabled && !isThinking,
    onChar: handleChar,
    onComplete: onTypingComplete,
  });
  const displayText = isThinking ? "..." : visibleText;

  useEffect(() => {
    if (isThinking) {
      return;
    }

    const bubble = bubbleRef.current;
    if (!bubble) {
      return;
    }

    const hasOverflow = bubble.scrollHeight > bubble.clientHeight + 2;
    if (!hasOverflow) {
      return;
    }

    bubble.scrollTo({
      top: bubble.scrollHeight,
      behavior: "smooth",
    });
  }, [displayText, isThinking]);

  return (
    <div
      ref={bubbleRef}
      className={`speech-bubble ${isThinking ? "thinking" : ""} ${
        isTyping ? "typing" : ""
      }`}
      data-voice={voice.id}
      role="button"
      tabIndex={0}
      style={
        {
          "--voice-base-frequency": voice.baseFreq,
          "--voice-variance": voice.variance,
          "--voice-volume": voice.volume ?? 0.4,
        } as CSSProperties
      }
      onClick={() => {
        if (isTyping) {
          skip();
        }
      }}
      onKeyDown={(event) => {
        if (isTyping && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          skip();
        }
      }}
    >
      <p>
        {displayText}
        {!isThinking ? (
          <span className={`typewriter-cursor ${isTyping ? "active" : ""}`}>
            ▌
          </span>
        ) : null}
      </p>
    </div>
  );
}
