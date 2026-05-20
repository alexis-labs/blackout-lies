import type { SuspectVoiceProfile } from "@/game/types/suspect";
import { syntheticSfx, type SoundName, type SyntheticSound } from "@/audio/sfx";

type BrowserAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isSilentDialogueChar = (character?: string) =>
  !character || /[\s.,;:!?'"()[\]{}-]/.test(character);

class AudioManager {
  enabled = true;
  masterVolume = 0.45;

  private context?: AudioContext;
  private thinkingLoopId?: number;
  private lastBlipAt = 0;
  private lastHoverAt = 0;

  init() {
    if (this.context || typeof window === "undefined") {
      return;
    }

    const audioWindow = window as BrowserAudioWindow;
    const AudioContextClass =
      globalThis.AudioContext ?? audioWindow.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    try {
      this.context = new AudioContextClass();
    } catch {
      this.context = undefined;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;

    if (!enabled) {
      this.stopThinkingLoop(false);
    }
  }

  setVolume(volume: number) {
    this.masterVolume = clamp(volume, 0, 1);
  }

  play(sound: SoundName) {
    if (sound === "dialogueBlip") {
      this.playDialogueBlip();
      return;
    }

    if (sound === "thinkingLoopStart") {
      this.startThinkingLoop();
      return;
    }

    if (sound === "thinkingLoopStop") {
      this.stopThinkingLoop();
      return;
    }

    if (sound === "buttonHover") {
      const now = performance.now();
      if (now - this.lastHoverAt < 70) {
        return;
      }
      this.lastHoverAt = now;
    }

    this.playPattern(syntheticSfx[sound]);
  }

  playDialogueBlip(character?: string, voice?: SuspectVoiceProfile) {
    if (isSilentDialogueChar(character) || !this.canPlay()) {
      return;
    }

    const now = performance.now();
    if (now - this.lastBlipAt < 42) {
      return;
    }

    this.lastBlipAt = now;

    const profile = voice ?? {
      id: "default-dialogue",
      baseFreq: 230,
      variance: 70,
      waveform: "square" as OscillatorType,
      blipEveryNChars: 2,
      volume: 0.35,
    };
    const code = character?.charCodeAt(0) ?? 0;
    const variance = Math.max(1, profile.variance);
    const steppedVariance = (code % 9) / 8;
    const frequency = profile.baseFreq + steppedVariance * variance;

    this.beep({
      frequency,
      duration: 0.03 + (code % 3) * 0.004,
      waveform: profile.waveform,
      volume: 0.12 * (profile.volume ?? 0.4),
      slideTo: frequency * 0.92,
    });
  }

  startThinkingLoop() {
    if (!this.canPlay() || this.thinkingLoopId) {
      return;
    }

    this.playPattern(syntheticSfx.thinkingLoopStart);
    this.thinkingLoopId = window.setInterval(() => {
      this.beep({
        frequency: 118,
        duration: 0.035,
        waveform: "triangle",
        volume: 0.055,
        slideTo: 132,
      });
    }, 520);
  }

  stopThinkingLoop(playStop = true) {
    if (typeof window !== "undefined" && this.thinkingLoopId) {
      window.clearInterval(this.thinkingLoopId);
      this.thinkingLoopId = undefined;
    }

    if (playStop) {
      this.playPattern(syntheticSfx.thinkingLoopStop);
    }
  }

  private canPlay() {
    if (!this.enabled) {
      return false;
    }

    this.init();

    if (!this.context) {
      return false;
    }

    if (this.context.state === "suspended") {
      void this.context.resume().catch(() => undefined);
    }

    return true;
  }

  private playPattern(pattern: SyntheticSound[]) {
    if (!this.canPlay()) {
      return;
    }

    pattern.forEach((sound, index) => {
      this.beep(sound, index * 0.045);
    });
  }

  private beep(sound: SyntheticSound, delay = 0) {
    if (!this.context) {
      return;
    }

    const startTime = this.context.currentTime + delay;
    const endTime = startTime + sound.duration;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = sound.waveform;
    oscillator.frequency.setValueAtTime(sound.frequency, startTime);

    if (sound.slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, sound.slideTo),
        endTime,
      );
    }

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, sound.volume * this.masterVolume),
      startTime + 0.006,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gain);
    gain.connect(this.context.destination);

    oscillator.start(startTime);
    oscillator.stop(endTime + 0.01);
  }
}

export const audioManager = new AudioManager();
export type { SoundName };
