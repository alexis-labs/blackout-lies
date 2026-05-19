"use client";

import { RotateCcw, Save, Sparkles, Upload } from "lucide-react";

type GameControlsProps = {
  disabled?: boolean;
  onNewGame: () => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
  onResetGame: () => void;
};

export function GameControls({
  disabled = false,
  onNewGame,
  onSaveGame,
  onLoadGame,
  onResetGame,
}: GameControlsProps) {
  return (
    <footer className="campaign-controls" aria-label="Controlos de campanha">
      <button type="button" onClick={onNewGame} disabled={disabled}>
        <Sparkles size={15} strokeWidth={1.8} />
        Novo
      </button>
      <button type="button" onClick={onSaveGame} disabled={disabled}>
        <Save size={15} strokeWidth={1.8} />
        Guardar
      </button>
      <button type="button" onClick={onLoadGame} disabled={disabled}>
        <Upload size={15} strokeWidth={1.8} />
        Carregar
      </button>
      <button type="button" onClick={onResetGame} disabled={disabled}>
        <RotateCcw size={15} strokeWidth={1.8} />
        Reset
      </button>
    </footer>
  );
}
