"use client";

import Image from "next/image";
import { useState } from "react";
import { CaseFileTabs } from "@/components/game/CaseFileTabs";
import { DialogueHistory } from "@/components/game/DialogueHistory";
import type { CaseFileTab } from "@/game/types/case";
import type {
  SuspectConfession,
  InterrogationState,
  SuspectProfile,
} from "@/game/types/suspect";

type CaseFilePanelProps = {
  isOpen: boolean;
  activeTab: CaseFileTab;
  suspect: SuspectProfile;
  interrogationState: InterrogationState;
  pendingQuestion?: string;
  onTabChange: (tab: CaseFileTab) => void;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function isConfessionComplete(
  confession: SuspectConfession,
  interrogationState: InterrogationState,
) {
  const answerText = normalize(
    interrogationState.history.map((entry) => entry.answer).join(" "),
  );
  const matchers = [
    confession.confession,
    ...(confession.matchers ?? []),
  ].map(normalize);

  return matchers.some((matcher) => answerText.includes(matcher));
}

function SuspectPortrait({
  name,
  portraitUrl,
}: {
  name: string;
  portraitUrl?: string;
}) {
  const [canShowPortrait, setCanShowPortrait] = useState(Boolean(portraitUrl));

  return (
    <div className="suspect-portrait">
      {canShowPortrait && portraitUrl ? (
        <Image
          src={portraitUrl}
          alt={`${name} portrait`}
          width={104}
          height={104}
          onError={() => setCanShowPortrait(false)}
        />
      ) : (
        <span>SUSPECT IMG</span>
      )}
    </div>
  );
}

function ConfessionChecklist({
  suspect,
  interrogationState,
}: {
  suspect: SuspectProfile;
  interrogationState: InterrogationState;
}) {
  const confessionItems = suspect.confessionChecklist
    .filter((item): item is SuspectConfession => Boolean(item))
    .slice(0, 5);
  const completedCount = confessionItems.filter((item) =>
    isConfessionComplete(item, interrogationState),
  ).length;

  if (confessionItems.length === 0) {
    return null;
  }

  return (
    <div className="confession-checklist file-section">
      <div className="confession-checklist-header">
        <h2>CONFESSION CHECKLIST:</h2>
        <span>
          {completedCount}/{confessionItems.length}
        </span>
      </div>
      <ul>
        {confessionItems.map((item) => {
          const isComplete = isConfessionComplete(item, interrogationState);

          return (
            <li
              key={item.id}
              className={isComplete ? "complete" : ""}
            >
              <span className="confession-checkmark" aria-hidden="true">
                {isComplete ? "OK" : ""}
              </span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CaseTabContent({
  suspect,
  interrogationState,
}: {
  suspect: SuspectProfile;
  interrogationState: InterrogationState;
}) {
  const topics = interrogationState.topicsCovered.map((topic) =>
    topic.toLowerCase(),
  );
  const hasTopic = (topic: string) =>
    topics.some((coveredTopic) => coveredTopic === topic.toLowerCase());

  return (
    <section className="case-tab-content" aria-label="Case file">
      <header className="case-title-block">
        <h1>{suspect.caseContext.caseTitle}</h1>
        <p>
          CASE #: <strong>{suspect.caseContext.caseId}</strong>
        </p>
        <p>
          STATUS: <strong>{suspect.caseContext.status}</strong>
        </p>
      </header>

      <div className="suspect-card">
        <SuspectPortrait
          key={suspect.id}
          name={suspect.displayName}
          portraitUrl={suspect.portraitUrl}
        />
        <div>
          <h2>SUSPECT:</h2>
          <h3>{suspect.displayName.toUpperCase()}</h3>
          {suspect.age ? <p>- Age: {suspect.age}</p> : null}
          {suspect.occupation ? (
            <p>- Occupation: {suspect.occupation}</p>
          ) : null}
          <p>
            - Known Associates:{" "}
            {suspect.caseContext.knownAssociates.join(", ") || "Unknown"}
          </p>
          <p>- Last Seen: {suspect.caseContext.lastSeen}</p>
        </div>
      </div>

      <div className="file-section">
        <h2>CASE NOTES:</h2>
        <p>{suspect.caseContext.publicNotes}</p>
      </div>

      <div className="file-section">
        <h2>EVIDENCE:</h2>
        <ul>
          {suspect.caseContext.evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <ConfessionChecklist
        suspect={suspect}
        interrogationState={interrogationState}
      />

      <div className="case-progress-strip" aria-label="Interrogation state">
        <span className={hasTopic("alibi") ? "stamped" : ""}>ALIBI</span>
        <span className={hasTopic("statue") ? "stamped" : ""}>STATUE</span>
        <span className={hasTopic("back exit") ? "stamped" : ""}>EXIT</span>
        <span
          className={
            interrogationState.contradictionsFound.length > 0
              ? "stamped danger"
              : ""
          }
        >
          CONTRADICTION
        </span>
      </div>

      <div className="pressure-meter" aria-label="Pressure level">
        <div>
          <span>PRESSURE</span>
          <strong>{interrogationState.pressureLevel}%</strong>
        </div>
        <meter
          min="0"
          max="100"
          value={interrogationState.pressureLevel}
        />
      </div>
    </section>
  );
}

function NotesTab({
  suspect,
  interrogationState,
}: {
  suspect: SuspectProfile;
  interrogationState: InterrogationState;
}) {
  const topics =
    interrogationState.topicsCovered.length > 0
      ? interrogationState.topicsCovered.join(", ")
      : "None yet";
  const contradictions =
    interrogationState.contradictionsFound.length > 0
      ? interrogationState.contradictionsFound.join(" / ")
      : "None logged";

  return (
    <section className="notes-tab" aria-label="Detective notes">
      <h3>DETECTIVE NOTES</h3>
      <ul>
        {suspect.detectiveNotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      <div className="live-notes">
        <h3>LIVE FILE NOTES</h3>
        <ul>
          <li>Questions asked: {interrogationState.questionsAsked}</li>
          <li>Topics covered: {topics}</li>
          <li>Contradictions: {contradictions}</li>
          <li>Pressure level: {interrogationState.pressureLevel}%</li>
          <li>
            Confession status:{" "}
            {interrogationState.confessionUnlocked ? "Unlocked" : "Locked"}
          </li>
        </ul>
      </div>
    </section>
  );
}

export function CaseFilePanel({
  isOpen,
  activeTab,
  suspect,
  interrogationState,
  pendingQuestion,
  onTabChange,
}: CaseFilePanelProps) {
  return (
    <aside
      className={`case-file-panel ${isOpen ? "open" : "closed"}`}
      aria-hidden={!isOpen}
    >
      <CaseFileTabs activeTab={activeTab} onChange={onTabChange} />

      <div className="case-file-paper">
        {activeTab === "case" ? (
          <CaseTabContent
            suspect={suspect}
            interrogationState={interrogationState}
          />
        ) : null}

        {activeTab === "history" ? (
          <DialogueHistory
            history={interrogationState.history}
            pendingQuestion={pendingQuestion}
          />
        ) : null}

        {activeTab === "notes" ? (
          <NotesTab
            suspect={suspect}
            interrogationState={interrogationState}
          />
        ) : null}
      </div>
    </aside>
  );
}
