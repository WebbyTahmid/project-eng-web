import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon } from 'lucide-react';
import { extractTextFromImage, extractTextFromPDF } from '@/utils/extraction';

interface UploadAreaProps {
  onTextExtracted: (text: string) => void;
}

export default function UploadArea({ onTextExtracted }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      let extracted = '';
      if (file.type.startsWith('image/')) {
        extracted = await extractTextFromImage(file);
      } else if (file.type === 'application/pdf') {
        extracted = await extractTextFromPDF(file);
      } else if (file.type === 'text/plain') {
        extracted = await file.text();
      } else {
        alert("Unsupported file format. Please upload PDF, Image, or Text.");
        setIsProcessing(false);
        return;
      }
      onTextExtracted(extracted);
    } catch (error) {
      console.error(error);
      alert("Failed to process file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div className="w-full max-w-3xl flex flex-col items-center gap-8">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`w-full p-12 border-4 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors
          ${isDragging ? 'border-primary-red bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}
      >
        <UploadCloud className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Upload or Drag & Drop</h2>
        <p className="text-gray-500 mb-6">Supports PDF, Image, or plain text files</p>
        
        <label className="bg-primary-red text-white px-6 py-3 rounded-full cursor-pointer hover:bg-red-700 transition font-medium">
          Choose File
          <input 
            type="file" 
            className="hidden" 
            accept="application/pdf,image/*,.txt"
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          />
        </label>
        
        {isProcessing && (
          <div className="mt-6 flex items-center gap-2 text-primary-red">
            <div className="w-4 h-4 rounded-full border-2 border-primary-red border-t-transparent animate-spin" />
            <span>Processing document...</span>
          </div>
        )}
      </div>

      <div className="w-full flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-gray-400 font-medium">OR POUROUR TEXT</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="w-full">
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Paste your English text here to start practicing..."
          className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl focus:border-primary-red focus:ring-0 resize-none"
        />
        <button
          onClick={() => textInput.trim() && onTextExtracted(textInput)}
          disabled={!textInput.trim()}
          className="mt-4 w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          Start Reading
        </button>
      </div>
    </div>
  );
}
