"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Compass, MapPinned } from "lucide-react";
import { useEffect, useRef } from "react";
import type { LocationState, NarrativeEntry } from "@/lib/gameTypes";
import { OrnateFrame } from "@/components/game/OrnateFrame";

type NarrativePanelProps = {
  location: LocationState;
  history: NarrativeEntry[];
};

export function NarrativePanel({ location, history }: NarrativePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history]);

  return (
    <OrnateFrame className="narrative-frame" contentClassName="narrative-content">
      <div className="location-header">
        <div className="location-heading">
          <span className="location-icon">
            <MapPinned size={22} strokeWidth={1.7} />
          </span>
          <div>
            <h1>{location.name}</h1>
            <p>{location.subtitle}</p>
          </div>
        </div>
        <div className="compass-rose" aria-label="Bússola decorativa">
          <Compass size={34} strokeWidth={1.3} />
        </div>
      </div>

      <div className="ornate-divider" aria-hidden="true">
        <span />
      </div>

      <div ref={scrollRef} className="narrative-scroll">
        <AnimatePresence initial={false}>
          {history.map((entry) => (
            <motion.article
              key={entry.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className={`narrative-entry entry-${entry.type}${
                entry.isStreaming ? " entry-streaming" : ""
              }`}
            >
              {entry.type === "player" ? (
                <>
                  <p className="entry-label">A tua ação</p>
                  <p>{entry.text}</p>
                </>
              ) : (
                formatNarration(entry.text).map((paragraph, index) => (
                  <p
                    key={`${entry.id}-${index}`}
                    className={isSpoken(paragraph) ? "spoken-line" : undefined}
                  >
                    {paragraph}
                  </p>
                ))
              )}
              {entry.isStreaming ? (
                <div className="smoke-particles" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              ) : null}
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </OrnateFrame>
  );
}

function formatNarration(text: string) {
  return text.split(/\n{2,}/).filter(Boolean);
}

function isSpoken(paragraph: string) {
  return paragraph.includes("«") || paragraph.includes("»");
}
