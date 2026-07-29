let currentAudio: HTMLAudioElement | null = null;
let currentAbortController: AbortController | null = null;
let activeRequestId = 0;

// Native Web Speech fallback helper
const fallbackNativeTTS = (text: string, speed: number, volume: number) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.error("Audio Engine: Speech synthesis unsupported.");
    return;
  }
  
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.5, Math.min(2.0, speed));
    utterance.volume = Math.max(0, Math.min(1, volume / 100));
    utterance.lang = 'en-US';
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    console.log(`Audio Engine: Playing via native browser TTS fallback for "${text}"`);
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Audio Engine: Native TTS playback error:", err);
  }
};

export const playBritishAudio = async (text: string, speed: number, volume: number = 50) => {
  if (!text || !text.trim()) return;

  // Increment request ID to cancel any stale pending requests
  const requestId = ++activeRequestId;
  
  // Abort any ongoing fetch request
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }

  // Safely stop any currently playing audio element
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // Ignore pause interrupts on already stopped audio
    }
    currentAudio = null;
  }

  // Cancel any ongoing native browser speech
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore synthesis cancel errors
    }
  }

  console.log(`TTS Audio Engine: Requesting ElevenLabs audio (Req #${requestId}) for: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`);

  const abortController = new AbortController();
  currentAbortController = abortController;

  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
    const response = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
      body: JSON.stringify({ text, speed, volume }),
    });

    // Check if another play request superseded this one while fetching
    if (requestId !== activeRequestId) return;

    if (!response.ok) {
      console.warn("TTS Audio Engine: ElevenLabs API returned non-OK status. Falling back to native browser speech...");
      fallbackNativeTTS(text, speed, volume);
      return;
    }

    const audioBlob = await response.blob();
    if (requestId !== activeRequestId) return;

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Set volume safely (0.0 to 1.0)
    audio.volume = Math.max(0, Math.min(1, volume / 100));

    currentAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (currentAudio === audio) currentAudio = null;
    };

    audio.onerror = (e) => {
      console.error("TTS Audio Engine: Audio element error, falling back to native TTS.", e);
      URL.revokeObjectURL(audioUrl);
      if (requestId === activeRequestId) {
        fallbackNativeTTS(text, speed, volume);
      }
    };

    // Play audio and handle browser interruption promises cleanly
    try {
      await audio.play();
      // Apply playback speed after play() resolves to ensure browser compatibility
      audio.playbackRate = Math.max(0.25, Math.min(2.5, speed));
    } catch (playError: unknown) {
      // If play was interrupted by user clicking another word, suppress AbortError
      if (playError instanceof Error && (playError.name === 'AbortError' || playError.message.includes('interrupted'))) {
        console.log(`TTS Audio Engine: Request #${requestId} playback interrupted by new click.`);
        URL.revokeObjectURL(audioUrl);
        return;
      }
      console.error("TTS Audio Engine: Play failed, using native fallback:", playError);
      URL.revokeObjectURL(audioUrl);
      if (requestId === activeRequestId) {
        fallbackNativeTTS(text, speed, volume);
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Fetch was intentionally aborted by newer play request - ignore
      return;
    }
    console.error("TTS Audio Engine: Fetch error. Using browser speech fallback:", error);
    if (requestId === activeRequestId) {
      fallbackNativeTTS(text, speed, volume);
    }
  }
};

