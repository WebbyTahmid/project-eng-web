"use client";
import React, { useEffect, useState } from 'react';
import { ParsedWord, processTextAsync } from '@/utils/nlp';
import { playBritishAudio } from '@/utils/audio';

interface ReaderPaneProps {
  text: string;
  phoneticsEnabled: boolean;
  syllableStressEnabled: boolean;
  stressColor: string;
  stressOpacity: number;
  phoneticColor: string;
  phoneticOpacity: number;
  mainTextColor: string;
  mainTextOpacity: number;
  audioSpeed: number;
  volume: number;
  onWordClick: (word: string) => void;
}

export default function ReaderPane({
  text,
  phoneticsEnabled,
  syllableStressEnabled,
  stressColor,
  stressOpacity,
  phoneticColor,
  phoneticOpacity,
  mainTextColor,
  mainTextOpacity,
  audioSpeed,
  volume,
  onWordClick
}: ReaderPaneProps) {
  
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let isMounted = true;
    
    const loadText = async () => {
      if (!text) {
        setParsedWords([]);
        return;
      }
      setIsProcessing(true);
      const words = await processTextAsync(text);
      if (isMounted) {
        setParsedWords(words);
        setIsProcessing(false);
      }
    };
    
    loadText();
    
    return () => {
      isMounted = false;
    };
  }, [text]);

  const handleWordClick = (word: ParsedWord) => {
    if (word.cleanWord) {
      onWordClick(word.cleanWord);
      playBritishAudio(word.cleanWord, audioSpeed, volume);
    }
  };

  const getHexOpacity = (opacity: number) => {
    return Math.round(opacity * 255).toString(16).padStart(2, '0');
  };

  const renderWordWithStress = (word: ParsedWord) => {
    if (!word.cleanWord) {
      return (
        <span key={`${word.id}-raw`} className="whitespace-pre-wrap">
          {word.original}
        </span>
      );
    }
    
    if (!syllableStressEnabled || word.syllables.length === 0) {
      return (
        <span key={`${word.id}-full`}>
          {word.original}
        </span>
      );
    }

    const stressStyle = { color: `${stressColor}${getHexOpacity(stressOpacity)}`, fontWeight: '600' };
    
    const parts = word.original.split(word.cleanWord);
    const prefix = parts[0] || '';
    const suffix = parts.slice(1).join(word.cleanWord) || '';

    return (
      <span key={`${word.id}-stressed-container`}>
        {prefix && <React.Fragment key={`${word.id}-prefix`}>{prefix}</React.Fragment>}
        {word.syllables.map((syl, i) => (
          <span 
            key={`${word.id}-syl-${i}-${syl}`} 
            style={i === word.stressedIndex ? stressStyle : {}} 
          >
            {syl}
          </span>
        ))}
        {suffix && <React.Fragment key={`${word.id}-suffix`}>{suffix}</React.Fragment>}
      </span>
    );
  };

  if (!mounted) {
    return <div className="w-full h-full pb-32 bg-white"></div>;
  }

  return (
    <div className="w-full h-full pb-32">
      <div className="border border-green-400 rounded w-fit mx-auto px-4 py-1 mb-8">
        <h2 className="text-green-500 font-bold text-center">Syllable Stress</h2>
      </div>

      {isProcessing ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p className="animate-pulse">Analyzing linguistic patterns...</p>
        </div>
      ) : (
        <div 
          className="text-lg md:text-xl lg:text-2xl font-medium leading-[3.5rem] flex flex-wrap gap-x-2 gap-y-4"
          style={{ color: `${mainTextColor}${getHexOpacity(mainTextOpacity)}` }}
        >
          {parsedWords.map((word) => (
            <div 
              key={word.id} 
              className="inline-flex flex-col items-center cursor-pointer group"
              onClick={() => handleWordClick(word)}
            >
              {/* Main Text */}
              <div key={`${word.id}-main-text`} className="hover:opacity-80 transition-opacity">
                {renderWordWithStress(word)}
              </div>
              
              {/* Phonetics */}
              {phoneticsEnabled && word.phonetic && (
                <span 
                  key={`${word.id}-phonetic-text`}
                  className="text-sm font-normal font-sans tracking-wide leading-none -mt-1"
                  style={{ color: `${phoneticColor}${getHexOpacity(phoneticOpacity)}` }}
                >
                  {word.phonetic}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
