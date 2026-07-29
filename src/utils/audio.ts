let currentAudio: HTMLAudioElement | null = null;
let currentAbortController: AbortController | null = null;
let activeRequestId = 0;

// In-Memory Audio Blob Cache for 100% instant & identical repeated word playback
const audioCacheMap = new Map<string, Blob>();

// Strict British Voice Cache
let cachedBritishVoice: SpeechSynthesisVoice | null = null;

// Pre-load and lock strict British English voice
const getBritishVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  if (cachedBritishVoice) return cachedBritishVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. First priority: Explicit British English lang code (en-GB / en_GB)
  let britishVoice = voices.find(v => v.lang === 'en-GB' || v.lang === 'en_GB');

  // 2. Second priority: Voice names containing UK / British / George / Hazel / Susan / Daniel
  if (!britishVoice) {
    britishVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return (name.includes('uk') || name.includes('british') || name.includes('george') || name.includes('hazel') || name.includes('susan') || name.includes('daniel')) && !name.includes('india') && !name.includes('us');
    });
  }

  // 3. Third priority: Any voice with lang starting with 'en' that is NOT Indian or US
  if (!britishVoice) {
    britishVoice = voices.find(v => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      return lang.startsWith('en') && !lang.includes('in') && !name.includes('india') && !name.includes('hindi');
    });
  }

  // 4. Fallback to first available English voice
  if (!britishVoice) {
    britishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
  }

  if (britishVoice) {
    cachedBritishVoice = britishVoice;
    console.log(`Audio Engine: Locked British Voice -> ${britishVoice.name} (${britishVoice.lang})`);
  }

  return britishVoice;
};

// Initialize voice listener on browser load
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedBritishVoice = null; // Reset to re-discover
    getBritishVoice();
  };
  getBritishVoice();
}

// Native Web Speech fallback helper with locked British voice
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
    utterance.lang = 'en-GB';

    const voice = getBritishVoice();
    if (voice) {
      utterance.voice = voice;
    }

    console.log(`Audio Engine: Playing fallback native TTS (${voice?.name || 'Default'}) for "${text}"`);
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Audio Engine: Native TTS playback error:", err);
  }
};

export const playBritishAudio = async (text: string, speed: number, volume: number = 50) => {
  if (!text || !text.trim()) return;

  const cleanText = text.trim();
  const cacheKey = cleanText.toLowerCase();
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
      // Ignore pause errors
    }
    currentAudio = null;
  }

  // Cancel any ongoing native browser speech
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cancel errors
    }
  }

  // Helper function to play an audio blob
  const playBlob = async (blob: Blob) => {
    if (requestId !== activeRequestId) return;

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
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
        fallbackNativeTTS(cleanText, speed, volume);
      }
    };

    try {
      await audio.play();
      audio.playbackRate = Math.max(0.25, Math.min(2.5, speed));
    } catch (playError: unknown) {
      if (playError instanceof Error && (playError.name === 'AbortError' || playError.message.includes('interrupted'))) {
        URL.revokeObjectURL(audioUrl);
        return;
      }
      console.error("TTS Audio Engine: Play failed, using native fallback:", playError);
      URL.revokeObjectURL(audioUrl);
      if (requestId === activeRequestId) {
        fallbackNativeTTS(cleanText, speed, volume);
      }
    }
  };

  // CHECK CACHE FIRST: If audio blob is already in cache, play instantly!
  if (audioCacheMap.has(cacheKey)) {
    console.log(`TTS Audio Engine: Playing cached audio for "${cleanText}"`);
    const cachedBlob = audioCacheMap.get(cacheKey)!;
    await playBlob(cachedBlob);
    return;
  }

  console.log(`TTS Audio Engine: Requesting ElevenLabs audio (Req #${requestId}) for: "${cleanText.length > 50 ? cleanText.substring(0, 50) + '...' : cleanText}"`);

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
      body: JSON.stringify({ text: cleanText, speed, volume }),
    });

    if (requestId !== activeRequestId) return;

    if (!response.ok) {
      console.warn("TTS Audio Engine: ElevenLabs API returned non-OK status. Falling back to native browser speech...");
      fallbackNativeTTS(cleanText, speed, volume);
      return;
    }

    const audioBlob = await response.blob();
    if (requestId !== activeRequestId) return;

    // Cache the audio blob for future instant identical playback
    audioCacheMap.set(cacheKey, audioBlob);

    await playBlob(audioBlob);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }
    console.error("TTS Audio Engine: Fetch error. Using browser speech fallback:", error);
    if (requestId === activeRequestId) {
      fallbackNativeTTS(cleanText, speed, volume);
    }
  }
};

