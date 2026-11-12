window.BHASHA_LANGUAGES = {
  spanish: {
    key: "spanish",
    title: "SpanishParichay",
    languageName: "Spanish",
    languageTheme: "spanish",
    welcomeLine: "Hola! Explore Spanish worlds with Mithu.",
    storagePrefix: "bhashaParichay.spanish",
    levelOneWorld: "greetings",
    worlds: [
      {
        key: "greetings",
        title: "Greeting Garden",
        subtitle: "Hello words and polite phrases",
        cardClass: "world-alphabet",
        illustration: "../assets/illustrations/vocab/family.svg",
        lessons: [
          {
            title: "Say Hello",
            objective: "Use friendly Spanish greetings.",
            focus: [
              { text: "hola", meaning: "hello" },
              { text: "buenos días", meaning: "good morning" },
              { text: "gracias", meaning: "thank you" }
            ],
            match: { prompt: "Pick the Spanish word for hello.", options: ["hola", "adiós", "por favor"], answer: "hola" },
            listen: { prompt: "Listen and choose the spoken greeting.", text: "buenos días", options: ["buenos días", "gracias", "hola"], answer: "buenos días" },
            build: { prompt: "Build: thank you", tiles: ["gra", "cias"], answer: "gracias" }
          }
        ]
      },
      {
        key: "colours",
        title: "Colour Carnival",
        subtitle: "Bright colour words",
        cardClass: "world-colour",
        illustration: "../assets/illustrations/vocab/lotus.svg",
        lessons: [
          {
            title: "Rainbow Colours",
            objective: "Name common colours in Spanish.",
            focus: [
              { text: "rojo", meaning: "red" },
              { text: "azul", meaning: "blue" },
              { text: "verde", meaning: "green" }
            ],
            match: { prompt: "Pick the Spanish word for blue.", options: ["rojo", "azul", "verde"], answer: "azul" },
            listen: { prompt: "Listen and pick the colour.", text: "verde", options: ["azul", "verde", "amarillo"], answer: "verde" },
            build: { prompt: "Build: red", tiles: ["ro", "jo"], answer: "rojo" }
          }
        ]
      },
      {
        key: "numbers",
        title: "Number Rocket",
        subtitle: "Count from one to ten",
        cardClass: "world-galaxy",
        illustration: "../assets/illustrations/vocab/moon.svg",
        lessons: [
          {
            title: "First Numbers",
            objective: "Recognize beginner number words.",
            focus: [
              { text: "uno", meaning: "one" },
              { text: "dos", meaning: "two" },
              { text: "tres", meaning: "three" }
            ],
            match: { prompt: "Pick the Spanish word for two.", options: ["uno", "tres", "dos"], answer: "dos" },
            listen: { prompt: "Listen and choose the number.", text: "tres", options: ["dos", "tres", "uno"], answer: "tres" },
            build: { prompt: "Build: one", tiles: ["u", "no"], answer: "uno" }
          }
        ]
      },
      {
        key: "animals",
        title: "Animal Amigos",
        subtitle: "Friendly animal names",
        cardClass: "world-jungle",
        illustration: "../assets/illustrations/vocab/elephant.svg",
        lessons: [
          {
            title: "Jungle Friends",
            objective: "Learn simple animal words.",
            focus: [
              { text: "gato", meaning: "cat" },
              { text: "perro", meaning: "dog" },
              { text: "pájaro", meaning: "bird" }
            ],
            match: { prompt: "Pick the Spanish word for dog.", options: ["gato", "perro", "pez"], answer: "perro" },
            listen: { prompt: "Listen and choose the animal.", text: "gato", options: ["gato", "pájaro", "perro"], answer: "gato" },
            build: { prompt: "Build: bird", tiles: ["pá", "ja", "ro"], answer: "pájaro" }
          }
        ]
      },
      {
        key: "food",
        title: "Food Fiesta",
        subtitle: "Tasty everyday food words",
        cardClass: "world-word",
        illustration: "../assets/illustrations/vocab/fruit.svg",
        lessons: [
          {
            title: "Snack Time",
            objective: "Use food vocabulary in context.",
            focus: [
              { text: "manzana", meaning: "apple" },
              { text: "pan", meaning: "bread" },
              { text: "leche", meaning: "milk" }
            ],
            match: { prompt: "Pick the Spanish word for milk.", options: ["leche", "pan", "agua"], answer: "leche" },
            listen: { prompt: "Listen and choose the food.", text: "manzana", options: ["pan", "manzana", "leche"], answer: "manzana" },
            build: { prompt: "Build: bread", tiles: ["p", "an"], answer: "pan" }
          }
        ]
      },
      {
        key: "family",
        title: "Family Fiesta",
        subtitle: "People at home",
        cardClass: "world-story",
        illustration: "../assets/illustrations/vocab/family.svg",
        lessons: [
          {
            title: "My Family",
            objective: "Identify close family words.",
            focus: [
              { text: "mamá", meaning: "mom" },
              { text: "papá", meaning: "dad" },
              { text: "hermano", meaning: "brother" }
            ],
            match: { prompt: "Pick the Spanish word for dad.", options: ["mamá", "papá", "hermana"], answer: "papá" },
            listen: { prompt: "Listen and choose the family word.", text: "mamá", options: ["mamá", "papá", "hermano"], answer: "mamá" },
            build: { prompt: "Build: brother", tiles: ["her", "ma", "no"], answer: "hermano" }
          }
        ]
      },
      {
        key: "objects",
        title: "Object Orchard",
        subtitle: "Useful classroom objects",
        cardClass: "world-sentence",
        illustration: "../assets/illustrations/vocab/chariot.svg",
        lessons: [
          {
            title: "Classroom Basics",
            objective: "Name familiar objects.",
            focus: [
              { text: "libro", meaning: "book" },
              { text: "mesa", meaning: "table" },
              { text: "silla", meaning: "chair" }
            ],
            match: { prompt: "Pick the Spanish word for book.", options: ["libro", "silla", "mesa"], answer: "libro" },
            listen: { prompt: "Listen and choose the object.", text: "silla", options: ["libro", "silla", "mesa"], answer: "silla" },
            build: { prompt: "Build: table", tiles: ["me", "sa"], answer: "mesa" }
          }
        ]
      }
    ]
  },
  portuguese: {
    key: "portuguese",
    title: "PortugueseParichay",
    languageName: "Portuguese",
    languageTheme: "portuguese",
    welcomeLine: "Olá! Explore Brazilian Portuguese worlds with Mithu.",
    variantLabel: "Brazilian Portuguese",
    storagePrefix: "bhashaParichay.portuguese",
    levelOneWorld: "greetings",
    worlds: [
      {
        key: "greetings",
        title: "Greeting Grove",
        subtitle: "Hello phrases in Brazilian Portuguese",
        cardClass: "world-alphabet",
        illustration: "../assets/illustrations/vocab/family.svg",
        lessons: [
          {
            title: "Oi and Friends",
            objective: "Use friendly greetings.",
            focus: [
              { text: "oi", meaning: "hi" },
              { text: "bom dia", meaning: "good morning" },
              { text: "obrigado", meaning: "thank you" }
            ],
            match: { prompt: "Pick the Portuguese word for hi.", options: ["oi", "tchau", "por favor"], answer: "oi" },
            listen: { prompt: "Listen and choose the greeting.", text: "bom dia", options: ["bom dia", "oi", "obrigado"], answer: "bom dia" },
            build: { prompt: "Build: thank you", tiles: ["obri", "ga", "do"], answer: "obrigado" }
          }
        ]
      },
      {
        key: "colours",
        title: "Color Parade",
        subtitle: "Bright colour words",
        cardClass: "world-colour",
        illustration: "../assets/illustrations/vocab/lotus.svg",
        lessons: [
          {
            title: "Color Splash",
            objective: "Recognize basic colours.",
            focus: [
              { text: "vermelho", meaning: "red" },
              { text: "azul", meaning: "blue" },
              { text: "verde", meaning: "green" }
            ],
            match: { prompt: "Pick the Portuguese word for green.", options: ["azul", "verde", "amarelo"], answer: "verde" },
            listen: { prompt: "Listen and choose the colour.", text: "azul", options: ["azul", "vermelho", "verde"], answer: "azul" },
            build: { prompt: "Build: red", tiles: ["ver", "me", "lho"], answer: "vermelho" }
          }
        ]
      },
      {
        key: "numbers",
        title: "Number Ship",
        subtitle: "Count from one to ten",
        cardClass: "world-galaxy",
        illustration: "../assets/illustrations/vocab/moon.svg",
        lessons: [
          {
            title: "Counting Time",
            objective: "Learn beginner numbers.",
            focus: [
              { text: "um", meaning: "one" },
              { text: "dois", meaning: "two" },
              { text: "três", meaning: "three" }
            ],
            match: { prompt: "Pick the Portuguese word for two.", options: ["um", "dois", "três"], answer: "dois" },
            listen: { prompt: "Listen and choose the number.", text: "três", options: ["dois", "três", "um"], answer: "três" },
            build: { prompt: "Build: one", tiles: ["u", "m"], answer: "um" }
          }
        ]
      },
      {
        key: "animals",
        title: "Animal Amigos",
        subtitle: "Friendly animal names",
        cardClass: "world-jungle",
        illustration: "../assets/illustrations/vocab/elephant.svg",
        lessons: [
          {
            title: "Animal Friends",
            objective: "Say common animals.",
            focus: [
              { text: "gato", meaning: "cat" },
              { text: "cachorro", meaning: "dog" },
              { text: "pássaro", meaning: "bird" }
            ],
            match: { prompt: "Pick the Portuguese word for dog.", options: ["gato", "cachorro", "peixe"], answer: "cachorro" },
            listen: { prompt: "Listen and choose the animal.", text: "gato", options: ["gato", "pássaro", "cachorro"], answer: "gato" },
            build: { prompt: "Build: bird", tiles: ["pás", "sa", "ro"], answer: "pássaro" }
          }
        ]
      },
      {
        key: "food",
        title: "Food Festival",
        subtitle: "Simple food words",
        cardClass: "world-word",
        illustration: "../assets/illustrations/vocab/fruit.svg",
        lessons: [
          {
            title: "Meal Words",
            objective: "Name everyday foods.",
            focus: [
              { text: "maçã", meaning: "apple" },
              { text: "pão", meaning: "bread" },
              { text: "leite", meaning: "milk" }
            ],
            match: { prompt: "Pick the Portuguese word for milk.", options: ["leite", "pão", "água"], answer: "leite" },
            listen: { prompt: "Listen and choose the food.", text: "maçã", options: ["maçã", "pão", "leite"], answer: "maçã" },
            build: { prompt: "Build: bread", tiles: ["p", "ão"], answer: "pão" }
          }
        ]
      },
      {
        key: "family",
        title: "Family Forest",
        subtitle: "Family words for children",
        cardClass: "world-story",
        illustration: "../assets/illustrations/vocab/family.svg",
        lessons: [
          {
            title: "My Family",
            objective: "Recognize close family terms.",
            focus: [
              { text: "mamãe", meaning: "mom" },
              { text: "papai", meaning: "dad" },
              { text: "irmão", meaning: "brother" }
            ],
            match: { prompt: "Pick the Portuguese word for dad.", options: ["mamãe", "papai", "irmã"], answer: "papai" },
            listen: { prompt: "Listen and choose the family word.", text: "mamãe", options: ["mamãe", "papai", "irmão"], answer: "mamãe" },
            build: { prompt: "Build: brother", tiles: ["ir", "mão"], answer: "irmão" }
          }
        ]
      },
      {
        key: "objects",
        title: "Object Oasis",
        subtitle: "Classroom and home objects",
        cardClass: "world-sentence",
        illustration: "../assets/illustrations/vocab/chariot.svg",
        lessons: [
          {
            title: "Object Words",
            objective: "Learn basic object names.",
            focus: [
              { text: "livro", meaning: "book" },
              { text: "mesa", meaning: "table" },
              { text: "cadeira", meaning: "chair" }
            ],
            match: { prompt: "Pick the Portuguese word for chair.", options: ["livro", "mesa", "cadeira"], answer: "cadeira" },
            listen: { prompt: "Listen and choose the object.", text: "livro", options: ["livro", "cadeira", "mesa"], answer: "livro" },
            build: { prompt: "Build: table", tiles: ["me", "sa"], answer: "mesa" }
          }
        ]
      }
    ]
  }
};
