"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import ControlsPane from "@/components/ControlsPane";
import ReaderPane from "@/components/ReaderPane";
import { getWordData } from "@/utils/stressEngine"; // 👈 আমাদের নতুন ইঞ্জিন কানেক্ট করলাম

const UploadArea = dynamic(() => import('@/components/UploadArea'), { ssr: false });

export default function Home() {
  const [extractedText, setExtractedText] = useState<string>("");
  const [phoneticsEnabled, setPhoneticsEnabled] = useState(true);
  const [syllableStressEnabled, setSyllableStressEnabled] = useState(true);
  const [stressColor, setStressColor] = useState("#22c55e"); // Green
  const [stressOpacity, setStressOpacity] = useState(1);
  const [phoneticColor, setPhoneticColor] = useState("#eab308"); // Yellow
  const [phoneticOpacity, setPhoneticOpacity] = useState(1);
  const [mainTextColor, setMainTextColor] = useState("#3b82f6"); // Blue
  const [mainTextOpacity, setMainTextOpacity] = useState(1);
  const [markSaveColor, setMarkSaveColor] = useState("#eab308"); // Yellow
  const [markSaveOpacity, setMarkSaveOpacity] = useState(1);
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [volume, setVolume] = useState(50);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // 🚀 এই অংশটুকু আমাদের ইঞ্জিনের জন্য নতুন যোগ করা হলো
  useEffect(() => {
    if (selectedWord) {
      console.log(`🔍 Searching engine for: "${selectedWord}"...`);
      
      // আপাতত "US" অ্যাকসেন্ট দিয়ে টেস্ট করছি
      getWordData(selectedWord, "US")
        .then((data) => {
          console.log("🎯 Engine Result:", data);
        })
        .catch((err) => {
          console.error("❌ Engine Error:", err);
        });
    }
  }, [selectedWord]);
  // 🚀 নতুন অংশ শেষ

  if (!extractedText) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <UploadArea onTextExtracted={setExtractedText} />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Pane - Reader */}
      <section className="flex-1 h-screen overflow-y-auto p-8 md:p-16 border-r-2 border-red-500">
        <ReaderPane 
          text={extractedText}
          phoneticsEnabled={phoneticsEnabled}
          syllableStressEnabled={syllableStressEnabled}
          stressColor={stressColor}
          stressOpacity={stressOpacity}
          phoneticColor={phoneticColor}
          phoneticOpacity={phoneticOpacity}
          mainTextColor={mainTextColor}
          mainTextOpacity={mainTextOpacity}
          audioSpeed={audioSpeed}
          volume={volume}
          onWordClick={setSelectedWord}
        />
      </section>

      {/* Right Pane - Controls */}
      <section className="w-full md:w-[350px] lg:w-[400px] h-screen overflow-y-auto bg-white p-6 flex flex-col shrink-0 relative">
        <ControlsPane 
          phoneticsEnabled={phoneticsEnabled}
          setPhoneticsEnabled={setPhoneticsEnabled}
          syllableStressEnabled={syllableStressEnabled}
          setSyllableStressEnabled={setSyllableStressEnabled}
          stressColor={stressColor}
          setStressColor={setStressColor}
          stressOpacity={stressOpacity}
          setStressOpacity={setStressOpacity}
          phoneticColor={phoneticColor}
          setPhoneticColor={setPhoneticColor}
          phoneticOpacity={phoneticOpacity}
          setPhoneticOpacity={setPhoneticOpacity}
          mainTextColor={mainTextColor}
          setMainTextColor={setMainTextColor}
          mainTextOpacity={mainTextOpacity}
          setMainTextOpacity={setMainTextOpacity}
          markSaveColor={markSaveColor}
          setMarkSaveColor={setMarkSaveColor}
          markSaveOpacity={markSaveOpacity}
          setMarkSaveOpacity={setMarkSaveOpacity}
          audioSpeed={audioSpeed}
          setAudioSpeed={setAudioSpeed}
          volume={volume}
          setVolume={setVolume}
          selectedWord={selectedWord}
        />
      </section>
    </main>
  );
}