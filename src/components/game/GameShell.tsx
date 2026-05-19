"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Backpack,
  BookMarked,
  Crown,
  Map,
  RotateCcw,
  Save,
  ScrollText,
  Settings,
  Sparkles,
  Upload,
} from "lucide-react";
import { useEffect } from "react";
import { CharacterPanel } from "@/components/game/CharacterPanel";
import { CommandInput } from "@/components/game/CommandInput";
import { InventoryPanel } from "@/components/game/InventoryPanel";
import { NarrativePanel } from "@/components/game/NarrativePanel";
import { RightWorldPanel } from "@/components/game/RightWorldPanel";
import { useGameStore, type GameView } from "@/store/gameStore";

const mobileTabs: Array<{
  id: GameView;
  label: string;
  icon: typeof ScrollText;
}> = [
  { id: "hero", label: "Herói", icon: Crown },
  { id: "story", label: "História", icon: ScrollText },
  { id: "world", label: "Mundo", icon: Map },
];

export function GameShell() {
  const player = useGameStore((state) => state.player);
  const locations = useGameStore((state) => state.locations);
  const currentLocationId = useGameStore((state) => state.currentLocationId);
  const world = useGameStore((state) => state.world);
  const history = useGameStore((state) => state.narrativeHistory);
  const activeView = useGameStore((state) => state.activeView);
  const isProcessing = useGameStore((state) => state.isProcessing);
  const feedback = useGameStore((state) => state.feedback);
  const submitAction = useGameStore((state) => state.submitAction);
  const setActiveView = useGameStore((state) => state.setActiveView);
  const saveGame = useGameStore((state) => state.saveGame);
  const loadGame = useGameStore((state) => state.loadGame);
  const newGame = useGameStore((state) => state.newGame);
  const resetGame = useGameStore((state) => state.resetGame);
  const clearFeedback = useGameStore((state) => state.clearFeedback);
  const location = locations[currentLocationId];

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = window.setTimeout(() => clearFeedback(), 2800);
    return () => window.clearTimeout(timeout);
  }, [clearFeedback, feedback]);

  return (
    <main className="game-shell">
      <div className="ambient-vignette" aria-hidden="true" />

      <div className="mobile-tabs" role="tablist" aria-label="Secções do jogo">
        {mobileTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={activeView === id ? "active" : ""}
            onClick={() => setActiveView(id)}
          >
            <Icon size={16} strokeWidth={1.8} />
            {label}
          </button>
        ))}
      </div>

      <div className="game-layout">
        <aside
          className={`left-column ${activeView === "hero" ? "active" : ""}`}
        >
          <CharacterPanel player={player} />
          <InventoryPanel items={player.inventory} />
          <footer className="sidebar-footer">
            <button type="button" onClick={() => setActiveView("hero")}>
              <Backpack size={16} />
              Inventário
            </button>
            <button type="button" onClick={() => setActiveView("world")}>
              <BookMarked size={16} />
              Diário
            </button>
            <button type="button" onClick={() => setActiveView("world")}>
              <Map size={16} />
              Mapa
            </button>
            <button type="button" onClick={() => setActiveView("story")}>
              <Settings size={16} />
              Definições
            </button>
          </footer>
        </aside>

        <section
          className={`center-column ${
            activeView === "story" ? "active" : ""
          }`}
        >
          <header className="top-actions">
            <div className="save-actions">
              <button type="button" onClick={newGame}>
                <Sparkles size={15} />
                Novo Jogo
              </button>
              <button type="button" onClick={saveGame}>
                <Save size={15} />
                Guardar
              </button>
              <button type="button" onClick={loadGame}>
                <Upload size={15} />
                Carregar
              </button>
              <button type="button" onClick={resetGame}>
                <RotateCcw size={15} />
                Reset
              </button>
            </div>
          </header>

          <NarrativePanel location={location} history={history} />
          <CommandInput disabled={isProcessing} onSubmit={submitAction} />
        </section>

        <aside
          className={`right-column ${activeView === "world" ? "active" : ""}`}
        >
          <RightWorldPanel
            location={location}
            locations={locations}
            currentLocationId={currentLocationId}
            world={world}
          />
        </aside>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            key={feedback.id}
            className={`game-toast toast-${feedback.type}`}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22 }}
          >
            <Sparkles size={17} strokeWidth={1.8} />
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
