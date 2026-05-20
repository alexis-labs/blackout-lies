# The Laughing Cat Caper

The Laughing Cat Caper e um jogo de interrogatorio noir em pixel art, feito com Next.js + TypeScript.

O jogador alterna entre suspeitos, faz perguntas livres, acompanha contradicoes e tenta arrancar uma confissao antes de perder o controlo da sala.

O projeto roda em dois modos:
- `mock/local`: totalmente offline, com motor de suspeitos local
- `openai`: respostas dinamicas via API, sem expor chave no cliente

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Browser Audio API

## Quickstart

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
```

## Configuracao LLM

Sem variaveis de ambiente, o jogo usa o motor local automaticamente.

Para ativar OpenAI, cria/edita `.env.local` com:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-5.4-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Notas:
- A chave nunca vai para o browser.
- O request passa por `src/app/api/interrogate/route.ts` no servidor.
- Se `LLM_PROVIDER` nao for `openai` ou faltar `OPENAI_API_KEY`, ha fallback para o modo local.

## Como o jogo funciona

1. O utilizador envia uma pergunta na interface.
2. O estado da ronda e enviado para a API (`/api/interrogate`).
3. O servidor decide entre motor local ou provider LLM.
4. A resposta regressa com novo estado de pressao, pistas e contradicoes.
5. A UI atualiza historico, case file e sugestoes.

## Estrutura do projeto

```txt
src/
  app/
    page.tsx
    layout.tsx
    globals.css
    api/
      chat/
      interrogate/route.ts
  audio/
    AudioManager.ts
    sfx.ts
  components/
    game/
      GameScreen.tsx
      DialogueHistory.tsx
      InputBar.tsx
      PressureBar.tsx
      SuspectSelector.tsx
      ...
  game/
    engine/
      interrogationEngine.ts
      interrogationServer.ts
    prompts/
      buildSuspectPrompt.ts
      promptTemplates.ts
    suspects/
      index.ts
      maria-black-cat.ts
      vinnie-grin-marino.ts
    types/
      case.ts
      dialogue.ts
      suspect.ts
```

## Regras de arquitetura

- Tipos de dominio devem ficar em `src/game/types/`.
- Conteudo de caso e suspeitos deve ficar em `src/game/suspects/`.
- Logica de interrogatorio deve ficar em `src/game/engine/interrogationEngine.ts`.
- Construcao de prompts deve ficar em `src/game/prompts/`.
- Evita estado de jogo grande hardcoded dentro de componentes React.

## Funcionalidades atuais

- Interrogatorio por input livre
- Dois suspeitos jogaveis com perfis e contradicoes
- Case file com separadores de caso, historico e notas
- Barra de pressao e progressao por topicos
- Perguntas sugeridas por contexto
- Feedback sonoro com controlo on/off
- UI responsiva com identidade noir pixel art

## Adicionar um novo suspeito

1. Criar um ficheiro em `src/game/suspects/novo-suspeito.ts`.
2. Definir perfil, segredos, contradicoes e comportamento base.
3. Exportar o suspeito em `src/game/suspects/index.ts`.
4. Adicionar assets em `public/assets/suspects/novo-suspeito/`.
5. Validar fluxo no motor local e no endpoint `api/interrogate`.

## Troubleshooting rapido

- `npm run dev` falha logo no arranque:
  - corre `npm install` novamente
  - valida versao do Node (`node -v`), idealmente LTS atual
- Respostas OpenAI nao aparecem:
  - confirma `LLM_PROVIDER=openai`
  - confirma `OPENAI_API_KEY` em `.env.local`
  - verifica erros no terminal do servidor
- UI carrega mas sem audio:
  - alguns browsers bloqueiam audio antes da primeira interacao do utilizador

## Seguranca

- Nunca commitar `.env.local`.
- Nunca expor API keys no cliente.

## Licenca

Definir conforme a politica do projeto.
