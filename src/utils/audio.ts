export const playBritishAudio = (text: string, speed: number, volume: number = 50) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = speed;
  utterance.volume = volume / 100; // API takes 0.0 to 1.0
  
  const voices = window.speechSynthesis.getVoices();
  // Attempt to select a high quality British voice if available
  const gbVoice = voices.find(v => v.lang === 'en-GB' && v.name.includes('Google')) 
    || voices.find(v => v.lang === 'en-GB');
    
  if (gbVoice) {
    utterance.voice = gbVoice;
  }
  
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};
