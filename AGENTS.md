# Agent Instructions

## Project

This is a Next.js + TypeScript noir interrogation game.

## Commands

- Install: npm install
- Dev: npm run dev
- Build: npm run build
- Typecheck: npm run typecheck

## Rules

- Keep components modular.
- Use TypeScript types from src/game/types/.
- Keep suspect and case content in src/game/suspects/.
- Keep interrogation logic in src/game/engine/interrogationEngine.ts.
- Keep prompt construction in src/game/prompts/.
- Do not hardcode large game state inside React components.
- Do not add external services unless explicitly requested.
- Never commit .env.local or API keys.
- Maintain the noir pixel art interrogation UI style.
