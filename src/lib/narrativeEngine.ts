import type {
  InventoryItem,
  NarrativeResponse,
  PlayerAction,
  SuggestedAction,
} from "@/lib/gameTypes";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const playerHasItem = (action: PlayerAction, id: string) =>
  action.player.inventory.some((item) => item.id === id);

const ravenFeather: InventoryItem = {
  id: "raven-feather",
  name: "Pena de Corvo",
  icon: "feather",
  description: "Negra como breu, mas com reflexos dourados na ponta.",
  rarity: "uncommon",
};

const rustyKey: InventoryItem = {
  id: "rusty-key",
  name: "Chave Enferrujada",
  icon: "key",
  description: "Abre algo que preferia continuar fechado.",
  rarity: "quest",
};

const moonShard: InventoryItem = {
  id: "moon-shard",
  name: "Lasca Lunar",
  icon: "gem",
  description: "Fria ao toque, pulsa quando a torre é mencionada.",
  rarity: "rare",
};

function baseActions(locationId: string): SuggestedAction[] {
  const shared: SuggestedAction[] = [
    {
      id: "use-lantern",
      label: "Usar lanterna",
      input: "Usar lanterna",
      icon: "lamp",
    },
    {
      id: "open-map",
      label: "Consultar mapa",
      input: "Consultar mapa",
      icon: "map",
    },
    {
      id: "rest",
      label: "Descansar",
      input: "Descansar junto à estrada",
      icon: "rest",
      tone: "safe",
    },
  ];

  if (locationId === "broken-tower") {
    return [
      {
        id: "inspect-crown",
        label: "Examinar a coroa partida",
        input: "Examinar a coroa partida no chão da torre",
        icon: "search",
        tone: "magic",
      },
      {
        id: "attack-shadow",
        label: "Atacar a sombra",
        input: "Atacar a sombra que se move nas escadas",
        icon: "sword",
        tone: "danger",
      },
      {
        id: "flee-road",
        label: "Recuar para a estrada",
        input: "Fugir para a Estrada da Colina",
        icon: "flee",
      },
      ...shared,
    ];
  }

  if (locationId === "hollow-wood") {
    return [
      {
        id: "follow-whisper",
        label: "Seguir o sussurro",
        input: "Seguir o sussurro no bosque",
        icon: "route",
        tone: "magic",
      },
      {
        id: "ask-trees",
        label: "Perguntar às árvores",
        input: "Perguntar às árvores sobre a coroa",
        icon: "message",
      },
      {
        id: "go-chapel",
        label: "Procurar a capela",
        input: "Seguir até à capela antiga",
        icon: "route",
        tone: "danger",
      },
      ...shared,
    ];
  }

  if (locationId === "old-chapel") {
    return [
      {
        id: "read-altar",
        label: "Ler o altar",
        input: "Ler os nomes riscados no altar",
        icon: "search",
        tone: "magic",
      },
      {
        id: "light-candles",
        label: "Acender as velas",
        input: "Usar lanterna para acender as velas",
        icon: "lamp",
      },
      {
        id: "retreat-woods",
        label: "Voltar ao bosque",
        input: "Fugir para o Bosque Oco",
        icon: "flee",
      },
      ...shared,
    ];
  }

  return [
    {
      id: "ask-tower",
      label: "Perguntar sobre a torre",
      input: "Perguntar sobre a torre",
      icon: "message",
      tone: "magic",
    },
    {
      id: "examine-raven",
      label: "Examinar o corvo",
      input: "Examinar o corvo",
      icon: "search",
    },
    {
      id: "follow-trail",
      label: "Seguir pela trilha",
      input: "Seguir pela trilha",
      icon: "route",
      tone: "safe",
    },
    ...shared,
  ];
}

export function generateNarrativeResponse(
  action: PlayerAction,
): NarrativeResponse {
  const input = normalize(action.input);
  const currentLocation = action.location.id;
  const has = (...terms: string[]) => terms.some((term) => input.includes(term));

  if (has("inventario", "mochila", "bolsa")) {
    return {
      narration:
        "Abres a mochila sobre uma pedra plana. Cada objeto parece mais pesado do que devia, como se a estrada já tivesse começado a cobrar portagem.\n\nA lanterna vibra quando a aproximas do mapa, revelando riscos quase invisíveis junto à torre.",
      suggestedActions: baseActions(currentLocation),
      journalEntry: "Revi o inventário. O mapa e a lanterna reagem um ao outro.",
    };
  }

  if (has("mapa")) {
    return {
      narration:
        "O Mapa Antigo range ao abrir. Uma linha de tinta aparece entre o Bosque Oco e uma capela sem nome. A tinta ainda está húmida.\n\n«A coroa não caiu na torre», diz uma nota que não estava ali antes. «Foi levada para baixo.»",
      suggestedActions: baseActions(currentLocation),
      xpGain: action.world.flags.mapRead ? 5 : 15,
      journalEntry:
        "O mapa revelou uma capela antiga ligada ao Bosque Oco e à Torre sem Coroa.",
      worldPatch: {
        unlockLocations: ["hollow-wood", "old-chapel"],
        currentObjective: "Descobre porque a capela está ligada à coroa.",
        flagUpdates: { mapRead: true },
      },
    };
  }

  if (has("lanterna", "lampiao", "luz")) {
    const foundShard = !playerHasItem(action, "moon-shard") && currentLocation !== "hill-road";

    return {
      narration: foundShard
        ? "Ergues a lanterna. A chama torna-se azul e desenha um círculo no chão. No centro, uma lasca prateada surge entre a lama e as raízes, fria como noite antiga.\n\nQuando a guardas, ouves sinos de uma igreja que já não existe."
        : "A lanterna acende com um estalo baixo. A luz não afasta totalmente a escuridão; antes revela as suas costuras. Pedras marcadas, pegadas recentes e penas negras apontam para norte.",
      suggestedActions: baseActions(currentLocation),
      inventoryAdd: foundShard ? [moonShard] : undefined,
      vitalChanges: { sanity: 1 },
      xpGain: foundShard ? 30 : 10,
      journalEntry: foundShard
        ? "A lanterna revelou uma Lasca Lunar, talvez um fragmento da Coroa Oca."
        : "A lanterna confirmou sinais recentes na estrada.",
      worldPatch: {
        flagUpdates: { lanternUsed: true },
      },
    };
  }

  if (has("corvo", "examinar corvo", "pena")) {
    const alreadyFound = playerHasItem(action, "raven-feather");

    return {
      narration: alreadyFound
        ? "O corvo inclina a cabeça, reconhecendo a pena que já levas. Depois bate as asas uma vez, apontando com o bico para a torre.\n\nNão parece um animal. Parece uma testemunha."
        : "Aproximas-te devagar. O corvo não foge. Um olho negro reflete a torre; o outro reflete-te a ti, usando uma coroa de cinza.\n\nQuando ele levanta voo, deixa cair uma pena marcada com um símbolo dourado.",
      suggestedActions: baseActions(currentLocation),
      inventoryAdd: alreadyFound ? undefined : [ravenFeather],
      xpGain: alreadyFound ? 5 : 20,
      journalEntry: alreadyFound
        ? "O corvo continua a apontar-me para a torre."
        : "Encontrei uma Pena de Corvo marcada por um símbolo dourado.",
      worldPatch: {
        flagUpdates: { ravenExamined: true },
      },
    };
  }

  if (has("perguntar", "falar", "questionar")) {
    return {
      narration:
        "A tua pergunta parece ficar suspensa no ar. O vento responde primeiro, movendo a relva contra a direção natural.\n\n«A torre perdeu o rei, mas não a fome», murmura uma voz sem corpo. «Leva luz. Leva nome. Não leves mentira.»",
      suggestedActions: baseActions(currentLocation),
      statChanges: { charisma: 1 },
      xpGain: 18,
      journalEntry:
        "Uma voz avisou-me: a torre perdeu o rei, mas não a fome.",
      worldPatch: {
        currentObjective: "Entra na Torre sem Coroa levando luz e cautela.",
        reputationLocal: action.world.reputationLocal + 1,
        flagUpdates: { heardTowerWarning: true },
      },
    };
  }

  if (has("torre", "subir", "entrar")) {
    return {
      narration:
        "Segues para norte. A subida morde as pernas, e as pedras da torre parecem reorganizar-se quando não olhas diretamente.\n\nÀ entrada, uma sombra escorre pelas escadas quebradas. No chão, há o contorno circular de uma coroa que já não está ali.",
      suggestedActions: baseActions("broken-tower"),
      xpGain: 25,
      locationChange: "broken-tower",
      journalEntry:
        "Cheguei à Torre sem Coroa. A coroa desapareceu, mas a sua marca ficou no chão.",
      worldPatch: {
        unlockLocations: ["broken-tower"],
        currentObjective: "Descobre o que guardava a coroa dentro da torre.",
        flagUpdates: { reachedTower: true },
      },
    };
  }

  if (has("seguir", "trilha", "caminho", "bosque")) {
    const target = currentLocation === "hill-road" ? "hollow-wood" : "old-chapel";

    return {
      narration:
        target === "hollow-wood"
          ? "Deixas a estrada principal. A trilha entra num bosque onde os ramos se entrelaçam como dedos. Algo acompanha os teus passos do lado de lá da névoa.\n\nAinda assim, o mapa aquece contra o peito."
          : "Segues os sinais até ao coração do bosque. Entre árvores tortas, a fachada de uma capela surge com as portas entreabertas, como uma boca cansada de rezar.",
      suggestedActions: baseActions(target),
      xpGain: 16,
      locationChange: target,
      journalEntry:
        target === "hollow-wood"
          ? "Entrei no Bosque Oco. A névoa parece escutar."
          : "Encontrei a Capela do Rei Vazio.",
      worldPatch: {
        unlockLocations: [target],
        currentObjective:
          target === "hollow-wood"
            ? "Segue os sinais no bosque sem perder a luz."
            : "Investiga o altar da Capela do Rei Vazio.",
      },
    };
  }

  if (has("descansar", "repousar", "acampar")) {
    return {
      narration:
        "Escolhes um recanto protegido do vento. Por alguns minutos, a estrada deixa de exigir respostas. Bebes água, fechas os olhos e deixas o corpo lembrar que ainda vive.\n\nQuando te ergues, o céu está mais escuro.",
      suggestedActions: baseActions(currentLocation),
      vitalChanges: { health: 4, sanity: 1, vigor: 6 },
      xpGain: 5,
      journalEntry: "Descansei o suficiente para continuar, mas a noite avançou.",
      worldPatch: {
        timeOfDay: "Anoitecer",
      },
    };
  }

  if (has("atacar", "golpear", "lutar", "espada")) {
    const gainsKey = !playerHasItem(action, "rusty-key");

    return {
      narration: gainsKey
        ? "Atacas antes que a sombra complete a forma. A lâmina atravessa frio, fumo e um grito baixo. Algo metálico cai nos teus pés: uma chave comida pela ferrugem.\n\nA vitória sabe a sangue no lábio."
        : "Golpeias a escuridão, mas ela já aprendeu o teu ritmo. Recuas com o braço dormente, ganhando apenas alguns segundos e uma dor nova.",
      suggestedActions: baseActions(currentLocation),
      inventoryAdd: gainsKey ? [rustyKey] : undefined,
      vitalChanges: { health: -2, vigor: -4 },
      xpGain: gainsKey ? 35 : 12,
      journalEntry: gainsKey
        ? "Derrotei uma sombra e encontrei uma Chave Enferrujada."
        : "A sombra resistiu. Preciso escolher melhor as próximas ações.",
      worldPatch: {
        danger: "Alto",
        flagUpdates: { shadowConfronted: true },
      },
    };
  }

  if (has("fugir", "recuar", "escapar", "voltar")) {
    const target = currentLocation === "old-chapel" ? "hollow-wood" : "hill-road";

    return {
      narration:
        "Recuas antes que a coragem se transforme em orgulho. O mundo range atrás de ti, contrariado por te ver escapar.\n\nQuando paras, a tua respiração está curta, mas inteira.",
      suggestedActions: baseActions(target),
      vitalChanges: { vigor: -2 },
      xpGain: 8,
      locationChange: target,
      journalEntry: "Recuar não resolveu o mistério, mas manteve-me vivo.",
    };
  }

  return {
    narration:
      "A tua intenção espalha-se pelo lugar como uma pedra lançada a água escura. O mundo não responde de imediato; escolhe antes mostrar pequenas consequências.\n\nUma marca antiga brilha e apaga-se. Algures à frente, algo ouviu o que disseste.",
    suggestedActions: baseActions(currentLocation),
    xpGain: 10,
    journalEntry: `Tentei: "${action.input}". O mundo pareceu reagir, mas ainda não entendi como.`,
    worldPatch: {
      flagUpdates: { worldListened: true },
    },
  };
}
