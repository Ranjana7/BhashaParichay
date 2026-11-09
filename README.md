# SanskritParichay (GitHub Pages)

Free, static, kid-friendly Sanskrit learning website for ages 5–12.

## What is included

- Home page (`index.html`)
- Alphabet Forest playable lesson (`alphabet-forest.html`) with progressive lesson steps
- Multi-world lesson engine (`learning-world.html` + `assets/learning-world.js`)
- About page (`about.html`)
- Local progress saving with `localStorage` (device/browser only)
- No account, no analytics, no ads, no trackers
- Mute toggle and reduced-motion support
- Six working activities in Alphabet Forest:
  - Hear and Pick
  - Picture Match
  - Arrange the Word
  - Flashcard Flip
  - Feed Mithu
  - Hidden Letter Hunt
- Additional full worlds with lesson progression:
  - Word Wonderland
  - Animal Jungle
  - Number Galaxy
  - Colour Kingdom
  - Sentence Castle
  - Story Island

## Run locally

1. Open `index.html` in your browser.
2. Click **Start Playing** to open Alphabet Forest.

## Publish on GitHub Pages (project URL style)

1. Create a new repository in your GitHub account (example: `sanskritparichay`).
2. In this folder (`C:\Users\ranjasharma\Downloads\SanskritParichay`), run:

```powershell
git init
git add .
git commit -m "Initial SanskritParichay website"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

3. In GitHub repo settings:
   - Go to **Settings → Pages**
   - Under **Build and deployment**, choose:
     - **Source:** Deploy from a branch
     - **Branch:** `main` and `/ (root)`
4. Save. Wait for deploy. Your site URL will be:

`https://USERNAME.github.io/REPOSITORY/`

## Child privacy and data

- Progress is stored locally in browser storage.
- Progress does not sync across devices or browsers.
- No personal data collection is implemented in this project.

## Content quality notes

- Pronunciation first attempts local files from `assets/audio/pronunciation/`.
- If a local clip is missing, browser speech synthesis is used as fallback.
- Audio is computer-generated or test-recorded and not human-verified yet.
- Lesson mappings and pronunciation should be reviewed by a Sanskrit educator before wide release.
- Curriculum progression is informed by the user's authorized Sanskrit From Home course structure, while all game content here is original.

## Assets and licenses

- Code/CSS/illustrations in this repository: Original work for this project.
- Fonts/images/audio: No paid runtime services are required.
- Browser Speech Synthesis API: built-in browser feature (no subscription).
- Animation libraries stored locally in `assets/vendor/`:
  - Motion (`motion.min.js`)
  - canvas-confetti (`canvas-confetti.min.js`)
  - lottie-web (`lottie.min.js`)
- Lottie JSON animation assets stored locally in `assets/lottie/`.
- Pronunciation asset manifest: `assets/audio/pronunciation/manifest.json`.
- Reference pronunciation clips in `assets/audio/reference/` were copied from the local `Stories for Kids/tts-availability-tests` folder.
