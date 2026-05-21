"use client";

import { useEffect, useState } from "react";
import { GameScreen } from "@/components/game/GameScreen";
import { PageTransition } from "@/components/game/PageTransition";
import { StartScreen } from "@/components/game/StartScreen";
import { useSound } from "@/hooks/useSound";

export function GameShell() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { startMusicLoop } = useSound();

  useEffect(() => {
    startMusicLoop();
  }, [startMusicLoop]);

  function startGame() {
    setIsTransitioning(true);
  }

  return (
    <>
      {hasStarted ? (
        <GameScreen />
      ) : (
        <StartScreen onStart={startGame} />
      )}
      {isTransitioning ? (
        <PageTransition
          onCover={() => setHasStarted(true)}
          onComplete={() => setIsTransitioning(false)}
        />
      ) : null}
    </>
  );
}
