"use client";

import { Folder, SendHorizontal } from "lucide-react";
import type { FormEvent } from "react";
import { useSound } from "@/hooks/useSound";

type InputBarProps = {
  input: string;
  isFileOpen: boolean;
  hasError?: boolean;
  disabled?: boolean;
  isThinking?: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onToggleFile: () => void;
};

export function InputBar({
  input,
  isFileOpen,
  hasError = false,
  disabled = false,
  isThinking = false,
  onInputChange,
  onSubmit,
  onToggleFile,
}: InputBarProps) {
  const { play } = useSound();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      className={`interrogation-input-bar ${hasError ? "input-error" : ""}`}
      onSubmit={handleSubmit}
    >
      <input
        aria-label="Ask a question"
        value={input}
        disabled={disabled}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Ask a question..."
      />

      <button
        type="button"
        className={`file-toggle-button ${isFileOpen ? "active" : ""}`}
        aria-pressed={isFileOpen}
        onMouseEnter={() => play("buttonHover")}
        onClick={() => {
          onToggleFile();
          play(isFileOpen ? "fileClose" : "fileOpen");
        }}
      >
        <Folder size={17} strokeWidth={2.2} aria-hidden="true" />
        FILE
      </button>

      <button
        type="submit"
        className="send-question-button"
        disabled={disabled}
        aria-label="Send question"
        onMouseEnter={() => play("buttonHover")}
      >
        {isThinking ? (
          <span className="send-loading" aria-hidden="true">
            ...
          </span>
        ) : (
          <SendHorizontal size={20} strokeWidth={2.4} aria-hidden="true" />
        )}
      </button>
    </form>
  );
}
