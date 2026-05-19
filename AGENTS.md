# Agent Instructions

## Project

This is a Next.js + TypeScript fantasy LLM text-adventure game.

## Commands

- Install: npm install
- Dev: npm run dev
- Build: npm run build
- Typecheck: npm run typecheck

## Rules

- Keep components modular.
- Use TypeScript types from src/lib/gameTypes.ts.
- Keep game content in src/lib/gameData.ts.
- Keep narrative logic in src/lib/narrativeEngine.ts.
- Keep server-side LLM provider logic in src/lib/llmServer.ts.
- Do not hardcode large game state inside React components.
- Do not add external services unless explicitly requested.
- Never commit .env.local or API keys.
- Maintain the dark fantasy ornate UI style.
