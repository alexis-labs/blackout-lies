"use client";

import { Send } from "lucide-react";
import { FormEvent, useState } from "react";

type CommandInputProps = {
  disabled?: boolean;
  onSubmit: (input: string) => void;
};

export function CommandInput({ disabled = false, onSubmit }: CommandInputProps) {
  const [input, setInput] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    if (!value) {
      return;
    }

    onSubmit(value);
    setInput("");
  }

  return (
    <form className="command-form" onSubmit={handleSubmit}>
      <label htmlFor="command-input">Descreve a tua ação.</label>
      <div className="command-row">
        <input
          id="command-input"
          value={input}
          disabled={disabled}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ex.: examinar o corvo, seguir para a torre, usar lanterna..."
        />
        <button type="submit" disabled={disabled || !input.trim()}>
          <Send size={18} strokeWidth={1.8} />
          Enviar
        </button>
      </div>
      <p>Descreve a tua ação. O mundo reage à tua imaginação.</p>
    </form>
  );
}
