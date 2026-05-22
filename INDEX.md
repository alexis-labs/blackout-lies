# Blackout Lies Project Index

This index is a quick map for navigating the Blackout Lies codebase. The project is a Next.js + TypeScript noir interrogation game with a pixel art interface, local interrogation engine, and optional server-side OpenAI provider.

## Start Here

- `README.md`: project overview, quickstart, architecture notes, and troubleshooting.
- `AGENTS.md`: baseline agent instructions currently used by Codex-style agents.
- `AGENT.md`: compact working guide for future contributors and agents.
- `package.json`: available scripts and dependency list.

## Common Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run lint
```

The dev server normally runs at `http://localhost:3000`.

## Application Entry Points

- `src/app/page.tsx`: renders the main game shell.
- `src/app/layout.tsx`: app metadata and root layout.
- `src/app/globals.css`: global styling and the noir pixel art visual system.
- `src/app/api/interrogate/route.ts`: server API route for interrogation requests.

## Game UI Components

All main game UI lives in `src/components/game/`.

- `GameShell.tsx`: top-level shell and screen orchestration.
- `GameScreen.tsx`: primary interrogation screen.
- `StartScreen.tsx`: opening screen.
- `CaseMenuScreen.tsx`: case selection/menu flow.
- `CaseFilePanel.tsx`: case file, notes, evidence, and history surface.
- `CaseFileTabs.tsx`: case file tab controls.
- `DialogueHistory.tsx`: conversation history.
- `SpeechBubble.tsx`: active suspect response display.
- `InputBar.tsx`: player question input.
- `SuggestedQuestions.tsx`: context-aware suggested prompts.
- `PressureBar.tsx`: suspect pressure/progress feedback.
- `SuspectSelector.tsx`: suspect switching controls.
- `SuspectBackground.tsx`: suspect scene background.
- `SoundToggle.tsx`: audio on/off control.
- `PageTransition.tsx`: animated screen transitions.
- `TipBar.tsx`: short gameplay tips.

Keep components modular and avoid placing large game-state definitions inside React components.

## Game Domain Code

Core game systems live in `src/game/`.

- `src/game/types/`: TypeScript domain types.
- `src/game/suspects/`: suspect profiles, case content, secrets, contradictions, and case files.
- `src/game/engine/interrogationEngine.ts`: local interrogation logic and state transitions.
- `src/game/engine/interrogationServer.ts`: provider selection and server-side interrogation handling.
- `src/game/prompts/`: prompt construction and templates for LLM-backed responses.

## Suspect And Case Content

Use `src/game/suspects/` for all suspect and case content.

- `index.ts`: exports playable suspects and lookup helpers.
- `cases.ts`: case metadata and menu-level case content.
- `baby.ts`: suspect content for Baby.
- `maria-black-cat.ts`: suspect content for Maria Black Cat.
- `vinnie-grin-marino.ts`: suspect content for Vinnie Grin Marino.

Related visual assets live in `public/assets/suspects/<suspect-id>/`.

## Audio

- `src/audio/AudioManager.ts`: browser audio manager and playback control.
- `src/audio/sfx.ts`: generated sound effect definitions.
- `src/hooks/useSound.ts`: React hook for sound state/control.
- `public/assets/music/`: background music assets and notes.

## Hooks And Shared Types

- `src/hooks/useTypewriter.ts`: typewriter-style text reveal behavior.
- `src/hooks/useSound.ts`: sound lifecycle and toggle support.
- `src/types/three.d.ts`: Three.js type declaration support.

## Assets

- `public/assets/start/start-background.png`: start screen background.
- `public/assets/suspects/*/portrait.png`: suspect portraits.
- `public/assets/suspects/*/background.png`: suspect interrogation backgrounds.
- `public/assets/music/background-loop.mp3`: background loop.

## Environment

Without environment variables, the app falls back to the local/mock engine.

Optional `.env.local` values for OpenAI mode:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-5.4-nano
OPENAI_BASE_URL=https://api.openai.com/v1
```

Never commit `.env.local` or API keys.

## Safe Change Checklist

- Run `npm run typecheck` after TypeScript or game logic changes.
- Run `npm run build` before release-level changes.
- Keep new domain types in `src/game/types/`.
- Keep prompt changes in `src/game/prompts/`.
- Keep suspect and case writing in `src/game/suspects/`.
- Keep interrogation rules in `src/game/engine/interrogationEngine.ts`.
- Preserve the noir pixel art interrogation UI style.
