window.SANSKRIT_WORLDS = {
  words: {
    key: "words",
    title: "Word Wonderland",
    subtitle: "Nouns, meaning, and gender basics",
    reviewRequired: true,
    lessons: [
      {
        title: "Nouns Around Us",
        objective: "Recognize everyday Sanskrit nouns.",
        focus: [
          { dev: "पुस्तकम्", translit: "pustakam", meaning: "book" },
          { dev: "गृहम्", translit: "griham", meaning: "house" },
          { dev: "वृक्षः", translit: "vrikshah", meaning: "tree" }
        ],
        match: { prompt: "Pick the Sanskrit word for book.", options: ["गृहम्", "पुस्तकम्", "नदी"], answer: "पुस्तकम्" },
        listen: { dev: "वृक्षः", options: ["वृक्षः", "माता", "सूर्यः"], answer: "वृक्षः" },
        build: { meaning: "house", tiles: ["गृ", "हम्"], answer: "गृहम्" }
      },
      {
        title: "Gender Clues 1",
        objective: "Notice ending patterns for simple linga categories.",
        focus: [
          { dev: "बालकः", translit: "balakah", meaning: "boy" },
          { dev: "बालिका", translit: "balika", meaning: "girl" },
          { dev: "फलम्", translit: "phalam", meaning: "fruit" }
        ],
        match: { prompt: "Pick the Sanskrit word for girl.", options: ["बालकः", "फलम्", "बालिका"], answer: "बालिका" },
        listen: { dev: "फलम्", options: ["फलम्", "बालकः", "नदी"], answer: "फलम्" },
        build: { meaning: "boy", tiles: ["बा", "लकः"], answer: "बालकः" }
      },
      {
        title: "Word Basket Review",
        objective: "Revise nouns with meaning and pronunciation.",
        focus: [
          { dev: "नदी", translit: "nadi", meaning: "river" },
          { dev: "चन्द्रः", translit: "chandrah", meaning: "moon" },
          { dev: "कमलम्", translit: "kamalam", meaning: "lotus" }
        ],
        match: { prompt: "Pick the Sanskrit word for lotus.", options: ["कमलम्", "नदी", "गजः"], answer: "कमलम्" },
        listen: { dev: "चन्द्रः", options: ["चन्द्रः", "मित्रम्", "माता"], answer: "चन्द्रः" },
        build: { meaning: "river", tiles: ["न", "दी"], answer: "नदी" }
      }
    ]
  },
  animals: {
    key: "animals",
    title: "Animal Jungle",
    subtitle: "Animal words and simple describing words",
    reviewRequired: true,
    lessons: [
      {
        title: "Meet Jungle Friends",
        objective: "Learn names of common animals.",
        focus: [
          { dev: "गजः", translit: "gajah", meaning: "elephant" },
          { dev: "सिंहः", translit: "simhah", meaning: "lion" },
          { dev: "मर्कटः", translit: "markatah", meaning: "monkey" }
        ],
        match: { prompt: "Pick the Sanskrit word for lion.", options: ["सिंहः", "गजः", "मर्कटः"], answer: "सिंहः" },
        listen: { dev: "गजः", options: ["गजः", "काकः", "मत्स्यः"], answer: "गजः" },
        build: { meaning: "monkey", tiles: ["मर्", "कटः"], answer: "मर्कटः" }
      },
      {
        title: "Birds and Small Animals",
        objective: "Expand vocabulary with smaller creatures.",
        focus: [
          { dev: "काकः", translit: "kakah", meaning: "crow" },
          { dev: "शुकः", translit: "shukah", meaning: "parrot" },
          { dev: "मत्स्यः", translit: "matsyah", meaning: "fish" }
        ],
        match: { prompt: "Pick the Sanskrit word for parrot.", options: ["शुकः", "काकः", "मत्स्यः"], answer: "शुकः" },
        listen: { dev: "मत्स्यः", options: ["शुकः", "मत्स्यः", "गजः"], answer: "मत्स्यः" },
        build: { meaning: "crow", tiles: ["का", "कः"], answer: "काकः" }
      },
      {
        title: "Animal Review",
        objective: "Revise animal names through play.",
        focus: [
          { dev: "अश्वः", translit: "ashvah", meaning: "horse" },
          { dev: "मेषः", translit: "meshah", meaning: "sheep" },
          { dev: "मृगः", translit: "mrigah", meaning: "deer" }
        ],
        match: { prompt: "Pick the Sanskrit word for horse.", options: ["अश्वः", "मेषः", "मृगः"], answer: "अश्वः" },
        listen: { dev: "मृगः", options: ["मेषः", "मृगः", "गजः"], answer: "मृगः" },
        build: { meaning: "sheep", tiles: ["मे", "षः"], answer: "मेषः" }
      }
    ]
  },
  numbers: {
    key: "numbers",
    title: "Number Galaxy",
    subtitle: "Numbers and counting patterns",
    reviewRequired: true,
    lessons: [
      {
        title: "Counting 1 to 5",
        objective: "Recognize numbers in Sanskrit.",
        focus: [
          { dev: "एकः", translit: "ekah", meaning: "one" },
          { dev: "द्वौ", translit: "dvau", meaning: "two" },
          { dev: "त्रयः", translit: "trayah", meaning: "three" }
        ],
        match: { prompt: "Pick Sanskrit for two.", options: ["एकः", "द्वौ", "चत्वारः"], answer: "द्वौ" },
        listen: { dev: "त्रयः", options: ["त्रयः", "पञ्च", "एकः"], answer: "त्रयः" },
        build: { meaning: "one", tiles: ["ए", "कः"], answer: "एकः" }
      },
      {
        title: "Counting 6 to 10",
        objective: "Continue counting with confidence.",
        focus: [
          { dev: "षट्", translit: "shat", meaning: "six" },
          { dev: "सप्त", translit: "sapta", meaning: "seven" },
          { dev: "अष्ट", translit: "ashta", meaning: "eight" }
        ],
        match: { prompt: "Pick Sanskrit for seven.", options: ["सप्त", "षट्", "दश"], answer: "सप्त" },
        listen: { dev: "अष्ट", options: ["अष्ट", "नव", "त्रयः"], answer: "अष्ट" },
        build: { meaning: "six", tiles: ["ष", "ट्"], answer: "षट्" }
      },
      {
        title: "Number Review",
        objective: "Revise common number words.",
        focus: [
          { dev: "नव", translit: "nava", meaning: "nine" },
          { dev: "दश", translit: "dasha", meaning: "ten" },
          { dev: "पञ्च", translit: "pancha", meaning: "five" }
        ],
        match: { prompt: "Pick Sanskrit for ten.", options: ["नव", "दश", "पञ्च"], answer: "दश" },
        listen: { dev: "पञ्च", options: ["अष्ट", "दश", "पञ्च"], answer: "पञ्च" },
        build: { meaning: "nine", tiles: ["न", "व"], answer: "नव" }
      }
    ]
  },
  colours: {
    key: "colours",
    title: "Colour Kingdom",
    subtitle: "Adjectives and simple agreement patterns",
    reviewRequired: true,
    lessons: [
      {
        title: "Basic Colours",
        objective: "Learn colour words in Sanskrit.",
        focus: [
          { dev: "रक्तः", translit: "raktah", meaning: "red" },
          { dev: "नीलः", translit: "nilah", meaning: "blue" },
          { dev: "पीतः", translit: "pitah", meaning: "yellow" }
        ],
        match: { prompt: "Pick Sanskrit for blue.", options: ["पीतः", "नीलः", "रक्तः"], answer: "नीलः" },
        listen: { dev: "रक्तः", options: ["नीलः", "रक्तः", "श्वेतः"], answer: "रक्तः" },
        build: { meaning: "yellow", tiles: ["पी", "तः"], answer: "पीतः" }
      },
      {
        title: "More Colours",
        objective: "Expand colour vocabulary.",
        focus: [
          { dev: "हरितः", translit: "haritah", meaning: "green" },
          { dev: "श्वेतः", translit: "shvetah", meaning: "white" },
          { dev: "कृष्णः", translit: "krishnah", meaning: "black" }
        ],
        match: { prompt: "Pick Sanskrit for green.", options: ["हरितः", "कृष्णः", "श्वेतः"], answer: "हरितः" },
        listen: { dev: "श्वेतः", options: ["पीतः", "श्वेतः", "रक्तः"], answer: "श्वेतः" },
        build: { meaning: "black", tiles: ["कृ", "ष्णः"], answer: "कृष्णः" }
      },
      {
        title: "Colour Review",
        objective: "Use colours with confidence.",
        focus: [
          { dev: "अरुणः", translit: "arunah", meaning: "orange/red dawn color" },
          { dev: "धूम्रः", translit: "dhumrah", meaning: "grey" },
          { dev: "नीलः", translit: "nilah", meaning: "blue" }
        ],
        match: { prompt: "Pick Sanskrit for grey.", options: ["धूम्रः", "अरुणः", "नीलः"], answer: "धूम्रः" },
        listen: { dev: "अरुणः", options: ["अरुणः", "नीलः", "हरितः"], answer: "अरुणः" },
        build: { meaning: "blue", tiles: ["नी", "लः"], answer: "नीलः" }
      }
    ]
  },
  sentences: {
    key: "sentences",
    title: "Sentence Castle",
    subtitle: "Simple sentence expansion",
    reviewRequired: true,
    lessons: [
      {
        title: "Two-word Sentences",
        objective: "Build subject + verb style mini sentences.",
        focus: [
          { dev: "बालकः पठति", translit: "balakah pathati", meaning: "The boy reads." },
          { dev: "बालिका लिखति", translit: "balika likhati", meaning: "The girl writes." },
          { dev: "गजः धावति", translit: "gajah dhavati", meaning: "The elephant runs." }
        ],
        match: { prompt: "Pick sentence: The girl writes.", options: ["बालिका लिखति", "बालकः पठति", "गजः धावति"], answer: "बालिका लिखति" },
        listen: { dev: "बालकः पठति", options: ["बालकः पठति", "बालिका लिखति", "गजः धावति"], answer: "बालकः पठति" },
        build: { meaning: "The elephant runs", tiles: ["गजः", "धावति"], answer: "गजः धावति" }
      },
      {
        title: "Add Describing Words",
        objective: "Use adjective + noun + verb structures.",
        focus: [
          { dev: "नीलः गजः धावति", translit: "nilah gajah dhavati", meaning: "The blue elephant runs." },
          { dev: "लघु पुस्तकम् अस्ति", translit: "laghu pustakam asti", meaning: "The book is small." },
          { dev: "सुन्दरम् पुष्पम् अस्ति", translit: "sundaram pushpam asti", meaning: "The flower is beautiful." }
        ],
        match: { prompt: "Pick sentence with beautiful flower.", options: ["सुन्दरम् पुष्पम् अस्ति", "नीलः गजः धावति", "लघु पुस्तकम् अस्ति"], answer: "सुन्दरम् पुष्पम् अस्ति" },
        listen: { dev: "लघु पुस्तकम् अस्ति", options: ["लघु पुस्तकम् अस्ति", "नीलः गजः धावति", "बालिका लिखति"], answer: "लघु पुस्तकम् अस्ति" },
        build: { meaning: "The blue elephant runs", tiles: ["नीलः", "गजः", "धावति"], answer: "नीलः गजः धावति" }
      },
      {
        title: "Sentence Review",
        objective: "Read and build short Sanskrit statements.",
        focus: [
          { dev: "अहं पठामि", translit: "aham pathami", meaning: "I read." },
          { dev: "वयं खेलामः", translit: "vayam khelamah", meaning: "We play." },
          { dev: "सः गायति", translit: "sah gayati", meaning: "He sings." }
        ],
        match: { prompt: "Pick sentence: We play.", options: ["वयं खेलामः", "अहं पठामि", "सः गायति"], answer: "वयं खेलामः" },
        listen: { dev: "अहं पठामि", options: ["सः गायति", "अहं पठामि", "वयं खेलामः"], answer: "अहं पठामि" },
        build: { meaning: "He sings", tiles: ["सः", "गायति"], answer: "सः गायति" }
      }
    ]
  },
  stories: {
    key: "stories",
    title: "Story Island",
    subtitle: "Guided mini stories, listening and comprehension",
    reviewRequired: true,
    lessons: [
      {
        title: "Story 1: The Lotus Pond",
        objective: "Listen and identify key words in story lines.",
        focus: [
          { dev: "एकदा सरसि कमलम् आसीत्।", translit: "ekada sarasi kamalam asit", meaning: "Once, there was a lotus in a lake." },
          { dev: "गजः जलं पिबति।", translit: "gajah jalam pibati", meaning: "The elephant drinks water." },
          { dev: "बालकः हसति।", translit: "balakah hasati", meaning: "The boy smiles." }
        ],
        match: { prompt: "Pick the line about elephant drinking water.", options: ["गजः जलं पिबति।", "बालकः हसति।", "एकदा सरसि कमलम् आसीत्।"], answer: "गजः जलं पिबति।" },
        listen: { dev: "बालकः हसति।", options: ["बालकः हसति।", "गजः जलं पिबति।", "वयं खेलामः"], answer: "बालकः हसति।" },
        build: { meaning: "The boy smiles", tiles: ["बालकः", "हसति।"], answer: "बालकः हसति।" }
      },
      {
        title: "Story 2: Rainbow Day",
        objective: "Use story lines with colours and actions.",
        focus: [
          { dev: "आकाशे इन्द्रधनुः दृश्यते।", translit: "akashe indradhanuh drishyate", meaning: "A rainbow is seen in the sky." },
          { dev: "बालिका नीलं पुष्पं पश्यति।", translit: "balika nilam pushpam pashyati", meaning: "The girl sees a blue flower." },
          { dev: "मित्रौ नृत्यतः।", translit: "mitrau nrityatah", meaning: "Two friends dance." }
        ],
        match: { prompt: "Pick the line about rainbow.", options: ["आकाशे इन्द्रधनुः दृश्यते।", "मित्रौ नृत्यतः।", "बालिका नीलं पुष्पं पश्यति।"], answer: "आकाशे इन्द्रधनुः दृश्यते।" },
        listen: { dev: "मित्रौ नृत्यतः।", options: ["मित्रौ नृत्यतः।", "बालिका नीलं पुष्पं पश्यति।", "गजः धावति"], answer: "मित्रौ नृत्यतः।" },
        build: { meaning: "The girl sees a blue flower", tiles: ["बालिका", "नीलं", "पुष्पं", "पश्यति।"], answer: "बालिका नीलं पुष्पं पश्यति।" }
      },
      {
        title: "Story Quiz",
        objective: "Revise short stories with comprehension checks.",
        focus: [
          { dev: "कः जलं पिबति?", translit: "kah jalam pibati", meaning: "Who drinks water?" },
          { dev: "गजः जलं पिबति।", translit: "gajah jalam pibati", meaning: "The elephant drinks water." },
          { dev: "कः हसति?", translit: "kah hasati", meaning: "Who smiles?" }
        ],
        match: { prompt: "Pick answer to: Who drinks water?", options: ["गजः जलं पिबति।", "बालिका लिखति।", "वयं खेलामः"], answer: "गजः जलं पिबति।" },
        listen: { dev: "कः हसति?", options: ["कः हसति?", "कः धावति?", "कः पठति?"], answer: "कः हसति?" },
        build: { meaning: "Who smiles?", tiles: ["कः", "हसति?"], answer: "कः हसति?" }
      }
    ]
  }
};
