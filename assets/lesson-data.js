window.ALPHABET_LESSON = {
  disclaimer:
    "Pronunciation audio in this version is computer-generated and not yet verified by a human Sanskrit speaker.",
  reviewStatus:
    "Needs Sanskrit speaker review before publication for exact pronunciation quality and age-level pedagogy checks.",
  letters: [
    { devanagari: "अ", transliteration: "a", example: "अग्निः", meaning: "fire" },
    { devanagari: "आ", transliteration: "aa", example: "आकाशः", meaning: "sky" },
    { devanagari: "इ", transliteration: "i", example: "इन्द्रधनुः", meaning: "rainbow" },
    { devanagari: "उ", transliteration: "u", example: "उष्ट्रः", meaning: "camel" },
    { devanagari: "ए", transliteration: "e", example: "एकः", meaning: "one" },
    { devanagari: "क", transliteration: "ka", example: "कमलम्", meaning: "lotus" },
    { devanagari: "ग", transliteration: "ga", example: "गजः", meaning: "elephant" },
    { devanagari: "च", transliteration: "ca", example: "चन्द्रः", meaning: "moon" },
    { devanagari: "न", transliteration: "na", example: "नदी", meaning: "river" },
    { devanagari: "म", transliteration: "ma", example: "माता", meaning: "mother" },
    { devanagari: "य", transliteration: "ya", example: "योगः", meaning: "yoga" },
    { devanagari: "र", transliteration: "ra", example: "रथः", meaning: "chariot" }
  ],
  activities: {
    hearAndPick: [
      { letter: "अ", options: ["अ", "म", "र"] },
      { letter: "ग", options: ["न", "ग", "ए"] },
      { letter: "च", options: ["क", "च", "उ"] },
      { letter: "य", options: ["म", "य", "आ"] }
    ],
    pictureMatch: [
      { emoji: "🐘", meaning: "elephant", answer: "गजः", options: ["गजः", "कमलम्", "नदी"] },
      { emoji: "🌸", meaning: "lotus", answer: "कमलम्", options: ["योगः", "कमलम्", "रथः"] },
      { emoji: "🌙", meaning: "moon", answer: "चन्द्रः", options: ["चन्द्रः", "अग्निः", "माता"] },
      { emoji: "🏞️", meaning: "river", answer: "नदी", options: ["एकः", "नदी", "आकाशः"] }
    ],
    arrangeWord: [
      { word: "गजः", meaning: "elephant", tiles: ["ज", "ः", "ग"] },
      { word: "कमलम्", meaning: "lotus", tiles: ["ल", "क", "म्", "म"] },
      { word: "माता", meaning: "mother", tiles: ["ता", "मा"] },
      { word: "योगः", meaning: "yoga", tiles: ["गः", "यो"] }
    ],
    flashcards: [
      { devanagari: "गजः", transliteration: "gajah", meaning: "elephant", options: ["elephant", "lotus", "river"] },
      { devanagari: "कमलम्", transliteration: "kamalam", meaning: "lotus", options: ["moon", "lotus", "mother"] },
      { devanagari: "नदी", transliteration: "nadee", meaning: "river", options: ["river", "chariot", "yoga"] },
      { devanagari: "माता", transliteration: "maataa", meaning: "mother", options: ["rainbow", "mother", "fire"] }
    ]
  }
};
