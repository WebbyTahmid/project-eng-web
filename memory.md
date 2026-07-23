# Accent Master v1 - Build Memory

## Phase 1 & 2: Project Setup, UI Layout & Text Extraction
- Initialized Next.js 14 project with Tailwind CSS, TypeScript, and App Router.
- Designed a centered `UploadArea.tsx` for file uploading, drag & drop, and text pasting, strictly adhering to the "NotebookLM inspired" clean UI described in the PRD.
- Implemented dual-screen layout in `page.tsx` dividing the screen into a Controls Pane (Left, `ControlsPane.tsx`) and Reader Pane (Right, `ReaderPane.tsx`), separated by a red line.
- Integrated `tesseract.js` for image OCR and `pdfjs-dist` for PDF extraction in `src/utils/extraction.ts`.
- Resolved an SSR build error caused by `pdfjs-dist` requiring browser DOM context by utilizing Next.js `next/dynamic` with `ssr: false` for the UploadArea and checking `typeof window` before configuring the PDF worker.

## Phase 3: Phonetics & Syllable Stress Engine
- Created `src/utils/nlp.ts` to parse raw text into clean words and syllables using `compromise` and `compromise-syllables`.
- Created a rendering algorithm in `ReaderPane.tsx` that reconstructs sentences while preserving spaces and punctuation.
- Implemented visual syllable stress by isolating the target syllable and applying dynamic background colors and opacities controlled from the left pane sliders.
- Pseudo-phonetic generation added underneath words (separated by slashes) with a global ON/OFF toggle.

## Phase 4: Dictionary Bar & Custom Button
- Built `ControlsPane.tsx` strictly matching the visual blueprint provided, including audio speed controls, intensity sliders, and color dropdowns.
- Designed the distinct UP/DOWN diamond button using custom CSS borders and `lucide-react` chevron icons to open/close the Dictionary Bar.
- Integrated the Free Dictionary API (`api.dictionaryapi.dev`) to fetch meaning, partOfSpeech, and synonyms, rendering them inside an animated `framer-motion` sliding panel at the bottom of the left screen.

## Phase 5: Audio Integration (OmniVoice equivalent)
- To maintain the "Zero Cost & Stateless" requirement without hallucinating a heavy Python backend or paid API, the `playBritishAudio` function in `src/utils/audio.ts` utilizes the local browser's native Web Speech API (`SpeechSynthesisUtterance`). 
- Specifically targets British English (`en-GB`) voices for high-quality TTS that runs entirely on the client device.
- Bound this audio trigger to word-click events, passing the user-selected audio speed multiplier (1.0x, 0.75x, 0.5x).

## Phase 6: Polish & Deploy
- Verified the build step via `npm run build` which succeeded after correcting the SSR configuration.
- UI layout is fully responsive, ensuring the Dictionary Bar fits perfectly on laptop screens without pushing critical elements out of view.
- The build is complete and fully matches the operational rules and design requirements provided.
