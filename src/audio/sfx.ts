export type SoundName =
  | "dialogueBlip"
  | "buttonClick"
  | "buttonHover"
  | "fileOpen"
  | "fileClose"
  | "tabSwitch"
  | "sendQuestion"
  | "errorBuzz"
  | "thinkingLoopStart"
  | "thinkingLoopStop";

export type SyntheticSound = {
  frequency: number;
  duration: number;
  waveform: OscillatorType;
  volume: number;
  slideTo?: number;
};

export const syntheticSfx: Record<Exclude<SoundName, "dialogueBlip">, SyntheticSound[]> = {
  buttonClick: [
    { frequency: 260, duration: 0.035, waveform: "square", volume: 0.24 },
    { frequency: 170, duration: 0.045, waveform: "square", volume: 0.18 },
  ],
  buttonHover: [
    { frequency: 420, duration: 0.025, waveform: "triangle", volume: 0.08 },
  ],
  fileOpen: [
    { frequency: 160, duration: 0.04, waveform: "square", volume: 0.14 },
    { frequency: 230, duration: 0.055, waveform: "triangle", volume: 0.12 },
    { frequency: 310, duration: 0.035, waveform: "square", volume: 0.08 },
  ],
  fileClose: [
    { frequency: 250, duration: 0.035, waveform: "triangle", volume: 0.1 },
    { frequency: 130, duration: 0.06, waveform: "square", volume: 0.16 },
  ],
  tabSwitch: [
    { frequency: 360, duration: 0.03, waveform: "square", volume: 0.11 },
    { frequency: 470, duration: 0.025, waveform: "square", volume: 0.08 },
  ],
  sendQuestion: [
    { frequency: 280, duration: 0.045, waveform: "triangle", volume: 0.16 },
    { frequency: 560, duration: 0.055, waveform: "square", volume: 0.12 },
  ],
  errorBuzz: [
    { frequency: 92, duration: 0.075, waveform: "sawtooth", volume: 0.18 },
    { frequency: 78, duration: 0.075, waveform: "sawtooth", volume: 0.16 },
  ],
  thinkingLoopStart: [
    { frequency: 180, duration: 0.035, waveform: "triangle", volume: 0.08 },
  ],
  thinkingLoopStop: [
    { frequency: 130, duration: 0.045, waveform: "triangle", volume: 0.06 },
  ],
};
