# The Laughing Cat Caper

**The Laughing Cat Caper** e um browser game de interrogatorio noir em pixel art, preparado para respostas LLM e funcional offline com um motor local de suspeitos.

O jogador conduz interrogatorios, alterna entre suspeitos, consulta o ficheiro do caso, segue o historico de perguntas, pressiona contradicoes e tenta desbloquear confissoes.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Audio API do browser

## Instalar

```bash
npm install
```

## Correr em desenvolvimento

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Build

```bash
npm run typecheck
npm run build
```

## Configurar OpenAI

O jogo funciona offline com respostas mock. Para usar OpenAI, cria `.env.local` a partir de `.env.example`:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-5.4-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

As chamadas ao LLM passam por `src/app/api/interrogate/route.ts`, por isso a API key fica apenas no servidor. Se `LLM_PROVIDER` nao for `openai` ou faltar `OPENAI_API_KEY`, o jogo volta ao motor mock local.

## Estrutura

```txt
src/
  app/
    page.tsx
    layout.tsx
    globals.css
    api/interrogate/route.ts
  audio/
    AudioManager.ts
    sfx.ts
  components/game/
    CaseFilePanel.tsx
    CaseFileTabs.tsx
    DialogueHistory.tsx
    GameScreen.tsx
    InputBar.tsx
    PressureBar.tsx
    SoundToggle.tsx
    SpeechBubble.tsx
    SuggestedQuestions.tsx
    SuspectBackground.tsx
    SuspectSelector.tsx
    TipBar.tsx
  game/
    engine/interrogationEngine.ts
    engine/interrogationServer.ts
    prompts/
    suspects/
    types/
```

## Gameplay implementado

- Interrogatorio por input livre
- Dois suspeitos jogaveis com perfis, segredos e contradicoes
- Ficheiro do caso com separadores de caso, historico e notas
- Barra de pressao e progressao por topicos investigados
- Perguntas sugeridas por suspeito
- Feedback sonoro com controlo de volume
- Layout responsivo em estilo noir pixel art
