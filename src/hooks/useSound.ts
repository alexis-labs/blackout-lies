"use client";

import { useCallback, useEffect, useState } from "react";
import { audioManager, type SoundName } from "@/audio/AudioManager";
import type { SuspectVoiceProfile } from "@/game/types/suspect";

const enabledKey = "game.sound.enabled";
const volumeKey = "game.sound.volume";
const defaultVolume = 0.45;

function getStoredEnabled() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(enabledKey) !== "false";
}

function getStoredVolume() {
  if (typeof window === "undefined") {
    return defaultVolume;
  }

  const storedRaw = window.localStorage.getItem(volumeKey);

  if (storedRaw === null) {
    return defaultVolume;
  }

  const stored = Number(storedRaw);
  return Number.isFinite(stored) ? stored : defaultVolume;
}

export function useSound() {
  const [enabled, setEnabledState] = useState(getStoredEnabled);
  const [volume, setVolumeState] = useState(getStoredVolume);

  useEffect(() => {
    audioManager.setEnabled(enabled);
    audioManager.setVolume(volume);
  }, [enabled, volume]);

  const setEnabled = useCallback((nextEnabled: boolean) => {
    audioManager.setEnabled(nextEnabled);
    setEnabledState(nextEnabled);
    window.localStorage.setItem(enabledKey, String(nextEnabled));
  }, []);

  const toggleEnabled = useCallback(() => {
    setEnabled(!audioManager.enabled);
  }, [setEnabled]);

  const setVolume = useCallback((nextVolume: number) => {
    const safeVolume = Math.min(Math.max(nextVolume, 0), 1);

    audioManager.setVolume(safeVolume);
    setVolumeState(safeVolume);
    window.localStorage.setItem(volumeKey, String(safeVolume));
  }, []);

  const play = useCallback((sound: SoundName) => {
    audioManager.play(sound);
  }, []);

  const playDialogueBlip = useCallback(
    (character?: string, voice?: SuspectVoiceProfile) => {
      audioManager.playDialogueBlip(character, voice);
    },
    [],
  );

  const startThinkingLoop = useCallback(() => {
    audioManager.startThinkingLoop();
  }, []);

  const stopThinkingLoop = useCallback(() => {
    audioManager.stopThinkingLoop();
  }, []);

  return {
    enabled,
    volume,
    play,
    playDialogueBlip,
    setEnabled,
    setVolume,
    startThinkingLoop,
    stopThinkingLoop,
    toggleEnabled,
  };
}
