import type { DialogueEntry } from "@/game/types/dialogue";

type DialogueHistoryProps = {
  history: DialogueEntry[];
  pendingQuestion?: string;
};

export function DialogueHistory({
  history,
  pendingQuestion,
}: DialogueHistoryProps) {
  return (
    <section className="dialogue-history" aria-label="Interrogation history">
      <h3>INTERROGATION HISTORY</h3>

      {history.length === 0 && !pendingQuestion ? (
        <div className="empty-history">
          <p>No questions asked yet.</p>
          <p>Start the interrogation.</p>
        </div>
      ) : (
        <div className="history-stack">
          {history.map((entry) => (
            <article key={entry.id} className="history-entry">
              <time>{entry.timestamp}</time>
              <p>
                <strong>Q:</strong> {entry.question}
              </p>
              <p>
                <strong>A:</strong> {entry.answer}
              </p>
            </article>
          ))}

          {pendingQuestion ? (
            <article className="history-entry pending-entry">
              <time>NOW</time>
              <p>
                <strong>Q:</strong> {pendingQuestion}
              </p>
              <p>
                <strong>A:</strong> Thinking under a hot lamp...
              </p>
            </article>
          ) : null}
        </div>
      )}
    </section>
  );
}
