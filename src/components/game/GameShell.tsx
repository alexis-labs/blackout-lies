"use client";

import { useState } from "react";
import { GameScreen } from "@/components/game/GameScreen";
import { PageTransition } from "@/components/game/PageTransition";
import { StartScreen } from "@/components/game/StartScreen";

export function GameShell() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  if (hasStarted) {
    return <GameScreen />;
  }

  return (
    <>
      <StartScreen onStart={() => setIsTransitioning(true)} />
      {isTransitioning ? (
        <PageTransition onComplete={() => setHasStarted(true)} />
      ) : null}
    </>
  );
}
