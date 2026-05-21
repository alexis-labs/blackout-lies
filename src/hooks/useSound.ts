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
    try {
      audioManager.play(sound);
    } catch {
      // Audio should never block gameplay controls.
    }
  }, []);

  const playDialogueBlip = useCallback(
    (character?: string, voice?: SuspectVoiceProfile) => {
      try {
        audioManager.playDialogueBlip(character, voice);
      } catch {
        // Audio should never block text rendering.
      }
    },
    [],
  );

  const startThinkingLoop = useCallback(() => {
    try {
      audioManager.startThinkingLoop();
    } catch {
      // Audio should never block gameplay controls.
    }
  }, []);

  const stopThinkingLoop = useCallback(() => {
    try {
      audioManager.stopThinkingLoop();
    } catch {
      // Audio should never block gameplay controls.
    }
  }, []);

  const startMusicLoop = useCallback(() => {
    try {
      audioManager.startMusicLoop();
    } catch {
      // Audio should never block gameplay controls.
    }
  }, []);

  const stopMusicLoop = useCallback(() => {
    try {
      audioManager.stopMusicLoop();
    } catch {
      // Audio should never block gameplay controls.
    }
  }, []);

  return {
    enabled,
    volume,
    play,
    playDialogueBlip,
    setEnabled,
    setVolume,
    startMusicLoop,
    startThinkingLoop,
    stopMusicLoop,
    stopThinkingLoop,
    toggleEnabled,
  };
}
