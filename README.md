# Echoes of the Hollow Crown

**Echoes of the Hollow Crown** é um browser game de aventura textual dark fantasy, preparado para LLM, mas funcional offline com um motor narrativo mock local.

O jogador explora zonas, escreve ações em linguagem natural, escolhe ações sugeridas, ganha XP, sobe de nível, recolhe itens, consulta diário/mapa e guarda o progresso localmente.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- Framer Motion
- Lucide React
- IndexedDB com fallback para localStorage

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

## Configurar LLM real

A app funciona offline com mock local. Para usar um LLM real, cria `.env.local` a partir de `.env.example`:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-5.2
OPENAI_BASE_URL=https://api.openai.com/v1
```

Se `LLM_PROVIDER=mock` ou se não existir `OPENAI_API_KEY`, o endpoint volta ao motor local.

- `src/lib/narrativeEngine.ts` contém o motor narrativo local.
- `src/lib/llmClient.ts` expõe `mockLLMResponse()` e `realLLMResponse()`.
- `src/lib/llmServer.ts` faz a chamada server-side ao LLM configurado.
- `src/app/api/chat/route.ts` recebe estado do jogo + input do jogador e retorna `NarrativeResponse`.

## Estrutura

```txt
src/
  app/
    page.tsx
    layout.tsx
    globals.css
    api/chat/route.ts
  components/game/
    GameShell.tsx
    CharacterPanel.tsx
    InventoryPanel.tsx
    AttributesPanel.tsx
    NarrativePanel.tsx
    ActionButtons.tsx
    CommandInput.tsx
    RightWorldPanel.tsx
    StatusBar.tsx
    OrnateFrame.tsx
    MiniMap.tsx
    JournalPanel.tsx
  lib/
    gameTypes.ts
    gameData.ts
    narrativeEngine.ts
    llmClient.ts
    llmServer.ts
    storage.ts
  store/
    gameStore.ts
  styles/
    theme.ts
AGENTS.md
README.md
```

## Gameplay implementado

- Sistema de personagem, atributos e vitais
- Inventário com itens e quantidades
- XP, level up e feedback visual
- Localizações desbloqueáveis
- Histórico narrativo com ações do jogador
- Input livre de texto
- Motor narrativo mock para comandos comuns
- Endpoint LLM real configurável por `.env.local`
- Guardar, carregar, novo jogo e reset local
- UI responsiva compacta com layout desktop em três zonas e tabs em mobile
