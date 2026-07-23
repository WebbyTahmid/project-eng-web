"use client";
import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ControlsPaneProps {
  phoneticsEnabled: boolean;
  setPhoneticsEnabled: (val: boolean) => void;
  syllableStressEnabled: boolean;
  setSyllableStressEnabled: (val: boolean) => void;
  stressColor: string;
  setStressColor: (val: string) => void;
  stressOpacity: number;
  setStressOpacity: (val: number) => void;
  phoneticColor: string;
  setPhoneticColor: (val: string) => void;
  phoneticOpacity: number;
  setPhoneticOpacity: (val: number) => void;
  mainTextColor: string;
  setMainTextColor: (val: string) => void;
  mainTextOpacity: number;
  setMainTextOpacity: (val: number) => void;
  markSaveColor: string;
  setMarkSaveColor: (val: string) => void;
  markSaveOpacity: number;
  setMarkSaveOpacity: (val: number) => void;
  audioSpeed: number;
  setAudioSpeed: (val: number) => void;
  volume: number;
  setVolume: (val: number) => void;
  selectedWord: string | null;
}

export default function ControlsPane({
  phoneticsEnabled,
  setPhoneticsEnabled,
  syllableStressEnabled,
  setSyllableStressEnabled,
  stressColor,
  setStressColor,
  stressOpacity,
  setStressOpacity,
  phoneticColor,
  setPhoneticColor,
  phoneticOpacity,
  setPhoneticOpacity,
  mainTextColor,
  setMainTextColor,
  mainTextOpacity,
  setMainTextOpacity,
  markSaveColor,
  setMarkSaveColor,
  markSaveOpacity,
  setMarkSaveOpacity,
  audioSpeed,
  setAudioSpeed,
  volume,
  setVolume,
  selectedWord
}: ControlsPaneProps) {
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [dictionaryData, setDictionaryData] = useState<any>(null);
  const [loadingDict, setLoadingDict] = useState(false);

  React.useEffect(() => {
    if (selectedWord) {
      fetchDictionary(selectedWord.replace(/[^a-zA-Z]/g, ''));
    }
  }, [selectedWord]);

  const fetchDictionary = async (word: string) => {
    if (!word) return;
    setLoadingDict(true);
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (res.ok) {
        const data = await res.json();
        setDictionaryData(data[0]);
      } else {
        setDictionaryData(null);
      }
    } catch (e) {
      setDictionaryData(null);
    }
    setLoadingDict(false);
  };

  return (
    <div className="flex flex-col h-full relative bg-white text-black">
      <div className="flex-1 space-y-6">
        
        {/* Audio Controls */}
        <div>
          <h3 className="font-semibold mb-2 text-sm">Audio speed</h3>
          <div className="flex items-center gap-4 text-sm font-medium mb-4">
            <button 
              onClick={() => setAudioSpeed(1.0)} 
              className={`pb-1 border-b-2 ${audioSpeed === 1.0 ? 'border-red-500 text-black' : 'border-transparent text-gray-400'}`}
            >
              1.0x
            </button>
            <button 
              onClick={() => setAudioSpeed(0.7)} 
              className={`pb-1 border-b-2 ${audioSpeed === 0.7 ? 'border-red-500 text-black' : 'border-transparent text-gray-400'}`}
            >
              0.7x
            </button>
            <button 
              onClick={() => setAudioSpeed(0.5)} 
              className={`pb-1 border-b-2 ${audioSpeed === 0.5 ? 'border-red-500 text-black' : 'border-transparent text-gray-400'}`}
            >
              0.5x
            </button>
          </div>
          
          <h3 className="font-semibold mb-2 text-sm">volume</h3>
          <div className="flex items-center gap-2 mb-1">
             <input 
                type="range" 
                min="0" max="100" step="1" 
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-700"
              />
          </div>
          <div className="flex justify-between text-xs text-gray-500 font-mono">
            <span>10</span>
            <span>50</span>
            <span>100</span>
          </div>
          <div className="border-b-2 border-gray-200 my-4"></div>
        </div>

        {/* Color Settings */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 rotate-45 border-2 border-blue-500 flex items-center justify-center">
               <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <h3 className="font-bold text-lg">color setting</h3>
          </div>

          <div className="space-y-6">
            
            {/* Main Text */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-blue-500">Main text</span>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={mainTextColor}
                  onChange={(e) => setMainTextColor(e.target.value)}
                  className="text-sm border-2 border-blue-400 text-blue-500 rounded px-2 py-1 outline-none font-medium w-24"
                >
                  <option value="#3b82f6">Blue</option>
                  <option value="#000000">Black</option>
                  <option value="#333333">Dark</option>
                </select>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-red-500 font-medium">Intensity</span>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.1" 
                    value={mainTextOpacity}
                    onChange={(e) => setMainTextOpacity(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <span className="text-xs text-red-500">{Math.round(mainTextOpacity * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Targeted Letters (Syllable Stress) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-green-500">Targeted letters</span>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={stressColor}
                  onChange={(e) => setStressColor(e.target.value)}
                  className="text-sm border-2 border-green-400 text-green-500 rounded px-2 py-1 outline-none font-medium w-24"
                >
                  <option value="#22c55e">Green</option>
                  <option value="#e02424">Red</option>
                  <option value="#eab308">Yellow</option>
                  <option value="#3b82f6">Blue</option>
                </select>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-red-500 font-medium">Intensity</span>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.1" 
                    value={stressOpacity}
                    onChange={(e) => setStressOpacity(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <span className="text-xs text-green-500">{Math.round(stressOpacity * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Phonetics Toggle */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-red-500">phonetics</span>
                <button 
                  onClick={() => setPhoneticsEnabled(!phoneticsEnabled)}
                  className={`w-9 h-4 rounded-full p-0.5 transition-colors flex items-center ${phoneticsEnabled ? 'bg-red-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${phoneticsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-xs font-bold text-red-500 border border-red-500 px-1 rounded ml-1">US</span>
                <span className="text-xs font-bold text-white bg-red-500 border border-red-500 px-1 rounded">UK</span>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={phoneticColor}
                  onChange={(e) => setPhoneticColor(e.target.value)}
                  className="text-sm border-2 border-yellow-400 text-yellow-500 rounded px-2 py-1 outline-none font-medium w-24"
                >
                  <option value="#eab308">Yellow</option>
                  <option value="#f97316">Orange</option>
                  <option value="#e02424">Red</option>
                </select>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-red-500 font-medium">Intensity</span>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.1" 
                    value={phoneticOpacity}
                    onChange={(e) => setPhoneticOpacity(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                  <span className="text-xs text-yellow-500">{Math.round(phoneticOpacity * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Mark & Save */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-yellow-500">Mark & Save</span>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={markSaveColor}
                  onChange={(e) => setMarkSaveColor(e.target.value)}
                  className="text-sm border-2 border-yellow-400 text-yellow-500 rounded px-2 py-1 outline-none font-medium w-24"
                >
                  <option value="#eab308">Yellow</option>
                  <option value="#22c55e">Green</option>
                </select>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-red-500 font-medium">Intensity</span>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.1" 
                    value={markSaveOpacity}
                    onChange={(e) => setMarkSaveOpacity(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <span className="text-xs text-red-500">{Math.round(markSaveOpacity * 100)}%</span>
                </div>
              </div>
            </div>

            <button className="flex items-center gap-2 text-blue-500 border border-blue-500 px-3 py-1 rounded text-sm hover:bg-blue-50 transition">
              <Save size={16} /> saved words
            </button>

          </div>
        </div>
      </div>

      {/* Diamond Toggle Button */}
      <div className="absolute left-0 -translate-x-1/2 bottom-32 z-20" style={{ transform: dictionaryOpen ? 'translate(-50%, -280px)' : 'translate(-50%, 0)' }}>
        <button 
          onClick={() => setDictionaryOpen(!dictionaryOpen)}
          className="w-12 h-16 relative group cursor-pointer transition-transform duration-300"
        >
          {/* Top Half of Diamond */}
          <div className={`absolute top-0 w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-b-[32px] transition-colors ${dictionaryOpen ? 'border-b-blue-300' : 'border-b-blue-500 group-hover:border-b-blue-600'}`}>
             <ChevronUp className="absolute top-[12px] -left-3 w-6 h-6 text-white" />
          </div>
          {/* Bottom Half of Diamond */}
          <div className={`absolute bottom-0 w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-t-[32px] transition-colors ${dictionaryOpen ? 'border-t-red-300' : 'border-t-red-400 group-hover:border-t-red-500'}`}>
             <ChevronDown className="absolute -top-[28px] -left-3 w-6 h-6 text-white" />
          </div>
        </button>
      </div>

      {/* Dictionary Bar */}
      <AnimatePresence>
        {dictionaryOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 260, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-green-50 border-t-2 border-red-500 rounded-t-lg overflow-hidden flex flex-col z-10 shadow-lg"
          >
            <div className="p-4 overflow-y-auto h-full text-black">
              <h4 className="text-red-500 font-bold mb-2">Dictionary Bar:</h4>
              
              {!selectedWord ? (
                <p className="text-sm text-gray-500">Click a word in the text to see its meaning.</p>
              ) : loadingDict ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : dictionaryData ? (
                <div>
                  <h5 className="font-bold text-lg">{dictionaryData.word}</h5>
                  {dictionaryData.phonetics?.[0]?.text && (
                    <span className="text-sm text-gray-500">{dictionaryData.phonetics[0].text}</span>
                  )}
                  
                  {dictionaryData.meanings?.map((meaning: any, i: number) => (
                    <div key={i} className="mt-3">
                      <span className="text-xs font-bold uppercase text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                        {meaning.partOfSpeech}
                      </span>
                      <p className="text-sm mt-1 text-gray-800">
                        {meaning.definitions[0]?.definition}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-red-500">Word not found in dictionary.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
