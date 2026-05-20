"use client";

import { useSound } from "@/hooks/useSound";

type SuggestedQuestionsProps = {
  questions: string[];
  onSelectQuestion: (question: string) => void;
};

export function SuggestedQuestions({
  questions,
  onSelectQuestion,
}: SuggestedQuestionsProps) {
  const { play } = useSound();
  const visibleQuestions = questions.slice(0, 3);

  if (visibleQuestions.length === 0) {
    return null;
  }

  return (
    <aside className="suggested-questions" aria-label="Suggested questions">
      <span className="suggestions-label">ASK</span>
      <ul>
        {visibleQuestions.map((question) => (
          <li key={question}>
            <button
              type="button"
              onMouseEnter={() => play("buttonHover")}
              onClick={() => {
                onSelectQuestion(question);
                play("buttonClick");
              }}
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
