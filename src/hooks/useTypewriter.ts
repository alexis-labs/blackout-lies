"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TypewriterOptions = {
  speedMs?: number;
  enabled?: boolean;
  onChar?: (character: string, index: number) => void;
  onComplete?: () => void;
};

const punctuationDelay = (character: string) => {
  if (character === "." || character === "!" || character === "?") {
    return 170;
  }

  if (character === "," || character === ";" || character === ":") {
    return 90;
  }

  return 0;
};

export function useTypewriter(
  text: string,
  {
    speedMs = 22,
    enabled = true,
    onChar,
    onComplete,
  }: TypewriterOptions = {},
) {
  const [visibleText, setVisibleText] = useState(enabled ? "" : text);
  const [isTyping, setIsTyping] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const timeoutRef = useRef<number | undefined>(undefined);
  const indexRef = useRef(0);
  const completedRef = useRef(false);
  const callbacksRef = useRef<{
    onChar?: (character: string, index: number) => void;
    onComplete?: () => void;
  }>({});

  useEffect(() => {
    callbacksRef.current = { onChar, onComplete };
  }, [onChar, onComplete]);

  const clearTimer = useCallback(() => {
    if (typeof window !== "undefined" && timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const complete = useCallback(() => {
    clearTimer();
    indexRef.current = text.length;
    setVisibleText(text);
    setIsTyping(false);

    if (!completedRef.current) {
      completedRef.current = true;
      callbacksRef.current.onComplete?.();
    }
  }, [clearTimer, text]);

  useEffect(() => {
    clearTimer();
    completedRef.current = false;
    indexRef.current = 0;

    if (typeof window === "undefined") {
      return;
    }

    if (!enabled || !text) {
      timeoutRef.current = window.setTimeout(() => {
        setVisibleText(text);
        setIsTyping(false);

        if (!completedRef.current) {
          completedRef.current = true;
          callbacksRef.current.onComplete?.();
        }
      }, 0);
      return clearTimer;
    }

    const tick = () => {
      indexRef.current += 1;
      const nextText = text.slice(0, indexRef.current);
      const character = text[indexRef.current - 1] ?? "";

      setVisibleText(nextText);
      callbacksRef.current.onChar?.(character, indexRef.current - 1);

      if (indexRef.current >= text.length) {
        setIsTyping(false);

        if (!completedRef.current) {
          completedRef.current = true;
          callbacksRef.current.onComplete?.();
        }
        return;
      }

      timeoutRef.current = window.setTimeout(
        tick,
        speedMs + punctuationDelay(character),
      );
    };

    timeoutRef.current = window.setTimeout(() => {
      setVisibleText("");
      setIsTyping(true);
      timeoutRef.current = window.setTimeout(tick, speedMs);
    }, 0);

    return clearTimer;
  }, [
    clearTimer,
    enabled,
    restartKey,
    speedMs,
    text,
  ]);

  return {
    visibleText,
    isTyping,
    skip: complete,
    restart: () => setRestartKey((current) => current + 1),
  };
}
