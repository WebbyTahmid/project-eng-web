let currentAudio: HTMLAudioElement | null = null;

// Native Web Speech fallback helper
const fallbackNativeTTS = (text: string, speed: number, volume: number) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.error("Audio Engine: Speech synthesis unsupported.");
    return;
  }
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = speed;
  utterance.volume = volume / 100;
  utterance.lang = 'en-US';
  
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
  if (preferredVoice) utterance.voice = preferredVoice;

  console.log(`Audio Engine: Playing via native browser TTS fallback for "${text}"`);
  window.speechSynthesis.speak(utterance);
};

export const playBritishAudio = async (text: string, speed: number, volume: number = 50) => {
  if (!text) return;
  
  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  console.log(`TTS Audio Engine: Requesting ElevenLabs audio for: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`);

  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
    const response = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, speed, volume }),
    });

    if (!response.ok) {
      console.warn("TTS Audio Engine: ElevenLabs API returned non-OK status. Falling back to native browser speech...");
      fallbackNativeTTS(text, speed, volume);
      return;
    }

    // Convert response to a blob and create an object URL
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);
    audio.playbackRate = speed;
    audio.volume = volume / 100;

    currentAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
    audio.onerror = (e) => {
      console.error("TTS Audio Engine: Audio element playback failed, falling back to native TTS.", e);
      URL.revokeObjectURL(audioUrl);
      fallbackNativeTTS(text, speed, volume);
    };

    await audio.play();
  } catch (error) {
    console.error("TTS Audio Engine: ElevenLabs fetch error. Using browser speech fallback:", error);
    fallbackNativeTTS(text, speed, volume);
  }
};
