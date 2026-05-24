"use client";

import { FileText, Hourglass, Stamp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CaseDeskChallenge,
  CaseEvidenceCard,
} from "@/game/types/caseDesk";
import type { InterrogationState } from "@/game/types/suspect";
import { useSound } from "@/hooks/useSound";

type EvidenceDeskProps = {
  challenge: CaseDeskChallenge;
  evidenceCards: CaseEvidenceCard[];
  interrogationState: InterrogationState;
  paused?: boolean;
  onSelectEvidence: (evidenceId: string) => void;
  onTimeout: () => void;
};

function orderChallengeCards(
  challenge: CaseDeskChallenge,
  evidenceCards: CaseEvidenceCard[],
) {
  const cardById = new Map(evidenceCards.map((card) => [card.id, card]));
  const orderedIds = [
    challenge.decoyEvidenceIds[0],
    challenge.correctEvidenceId,
    ...challenge.decoyEvidenceIds.slice(1),
  ];

  return orderedIds
    .flatMap((id) => {
      const card = id ? cardById.get(id) : undefined;
      return card ? [card] : [];
    })
    .slice(0, 4);
}

export function EvidenceDesk({
  challenge,
  evidenceCards,
  interrogationState,
  paused = false,
  onSelectEvidence,
  onTimeout,
}: EvidenceDeskProps) {
  const { play } = useSound();
  const [remaining, setRemaining] = useState(challenge.timeLimit);
  const timeoutHandledRef = useRef(false);
  const cards = useMemo(
    () => orderChallengeCards(challenge, evidenceCards),
    [challenge, evidenceCards],
  );
  const progress = Math.max(0, remaining / challenge.timeLimit);
  const isDanger = remaining <= 4;

  useEffect(() => {
    if (paused || timeoutHandledRef.current) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 0.1));
    }, 100);

    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (paused || remaining > 0 || timeoutHandledRef.current) {
      return;
    }

    timeoutHandledRef.current = true;
    onTimeout();
  }, [onTimeout, paused, remaining]);

  return (
    <section
      className={`evidence-desk ${paused ? "paused" : ""} ${
        isDanger ? "danger" : ""
      }`}
      aria-label="Evidence desk"
    >
      <div className="evidence-desk-lamp" aria-hidden="true" />

      <header className="evidence-desk-statement">
        <div>
          <span>STATEMENT UNDER LAMP</span>
          <p>{challenge.claimText}</p>
        </div>
        <div className="evidence-desk-timer" aria-label="Time remaining">
          <Hourglass size={16} strokeWidth={2.4} aria-hidden="true" />
          <strong>{paused ? "READ" : Math.ceil(remaining)}</strong>
        </div>
      </header>

      <div className="evidence-desk-meter" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className="evidence-card-grid">
        {cards.map((card) => {
          const isConfirmed = interrogationState.confirmedEvidenceIds.includes(
            card.id,
          );

          return (
            <button
              key={card.id}
              type="button"
              className={`evidence-card evidence-kind-${card.kind} ${
                isConfirmed ? "confirmed" : ""
              }`}
              disabled={paused}
              onMouseEnter={() => play("buttonHover")}
              onClick={() => onSelectEvidence(card.id)}
            >
              <span className="evidence-card-source">
                <FileText size={14} strokeWidth={2.2} aria-hidden="true" />
                {card.source}
              </span>
              <strong>{card.label}</strong>
              <p>{card.body}</p>
              {isConfirmed ? (
                <span className="evidence-card-stamp">
                  <Stamp size={15} strokeWidth={2.4} aria-hidden="true" />
                  USED
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <footer className="evidence-desk-footer">
        <span>FOCUS</span>
        <div className="focus-pips" aria-label="Focus remaining">
          {Array.from(
            { length: interrogationState.maxFocus },
            (_, index) => index + 1,
          ).map((pip) => (
            <span
              key={pip}
              className={pip <= interrogationState.focusLevel ? "active" : ""}
            />
          ))}
        </div>
        <strong>{paused ? "READ THE ROOM" : "PRESENT PROOF"}</strong>
      </footer>
    </section>
  );
}
