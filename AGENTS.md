# Agent Working Guide

Use this guide when working on Blackout Lies. The goal is to make changes that fit the existing Next.js + TypeScript noir interrogation game without scattering game logic or case content across the UI.

## Project Shape

Blackout Lies is a pixel art noir interrogation game. Players question suspects, track contradictions, build pressure, and inspect case files. The app supports a local/mock interrogation engine and an optional server-side OpenAI provider.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run lint
```

Use `npm run typecheck` as the default verification command after code edits. Use `npm run build` when touching routing, build config, server code, or anything release-facing.

## Architecture Rules

- Keep React components modular and focused on rendering or UI interaction.
- Do not hardcode large game state inside React components.
- Use domain types from `src/game/types/`.
- Keep suspect profiles, secrets, contradictions, and case content in `src/game/suspects/`.
- Keep interrogation state transitions and local logic in `src/game/engine/interrogationEngine.ts`.
- Keep server/provider selection in `src/game/engine/interrogationServer.ts`.
- Keep LLM prompt construction in `src/game/prompts/`.
- Do not add external services unless explicitly requested.
- Never commit `.env.local`, API keys, or secrets.
- Preserve the noir pixel art interrogation UI style.

## Where To Put Changes

- New or changed UI: `src/components/game/`.
- Main screen orchestration: `src/components/game/GameShell.tsx` and `src/components/game/GameScreen.tsx`.
- Suspect or case writing: `src/game/suspects/`.
- Domain model updates: `src/game/types/`.
- Local interrogation behavior: `src/game/engine/interrogationEngine.ts`.
- API/provider behavior: `src/game/engine/interrogationServer.ts` and `src/app/api/interrogate/route.ts`.
- Prompt wording/templates: `src/game/prompts/`.
- Global visual language: `src/app/globals.css`.
- Suspect images/backgrounds: `public/assets/suspects/<suspect-id>/`.
- Start screen assets: `public/assets/start/`.
- Audio behavior: `src/audio/` and `src/hooks/useSound.ts`.

## Adding A Suspect

1. Create a new suspect file in `src/game/suspects/`.
2. Use the existing `SuspectProfile` and related types from `src/game/types/`.
3. Add profile, voice, secrets, contradictions, suggested questions, and behavior data.
4. Export the suspect from `src/game/suspects/index.ts`.
5. Add portrait and background assets under `public/assets/suspects/<suspect-id>/`.
6. Verify the local engine and `/api/interrogate` route still handle the new suspect.

## Working Style

- Read nearby files before editing; follow local naming and structure.
- Prefer small, targeted changes over broad refactors.
- Keep writing and game data separate from UI code.
- Keep UI text consistent with the noir interrogation tone.
- When changing shared types or engine behavior, check all suspect files and UI consumers.
- If a change touches gameplay flow, test at least one full question/response loop.

## Verification

Before finishing a meaningful change, run the most relevant checks:

```bash
npm run typecheck
npm run build
```

For UI work, also run the dev server and inspect the screen in a browser when possible:

```bash
npm run dev
```
