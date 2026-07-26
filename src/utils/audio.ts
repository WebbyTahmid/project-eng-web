// Keep current Audio element reference to allow cancelling/replaying without overlap
let currentAudio: HTMLAudioElement | null = null;

export const playBritishAudio = async (text: string, speed: number, volume: number = 50) => {
  if (!text) return;
  
  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  console.log(`TTS Audio Engine: Requesting ElevenLabs audio for: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`);

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, speed, volume }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("TTS Audio Engine: API request failed.", errorData);
      return;
    }

    // Convert response to a blob and create an object URL
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);
    
    // Web Audio API playback rate mapping (speed variable from UI)
    audio.playbackRate = speed;
    audio.volume = volume / 100;

    currentAudio = audio;

    // Event listeners for debugging and cleanup
    audio.onplay = () => console.log("TTS Audio Engine: Started playing audio chunk.");
    audio.onended = () => {
      console.log("TTS Audio Engine: Finished playing audio.");
      URL.revokeObjectURL(audioUrl); // Cleanup
    };
    audio.onerror = (e) => {
      console.error("TTS Audio Engine: Playback failed.", e);
      URL.revokeObjectURL(audioUrl);
    };

    await audio.play();
  } catch (error) {
    console.error("TTS Audio Engine: Fatal error in the ElevenLabs speech synthesis pipeline:", error);
  }
};
