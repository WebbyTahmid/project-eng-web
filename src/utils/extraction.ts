import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export const extractTextFromImage = async (file: File): Promise<string> => {
  try {
    const result = await Tesseract.recognize(file, 'eng');
    return result.data.text;
  } catch (error) {
    console.error("Tesseract error:", error);
    throw new Error("Failed to extract text from image.");
  }
};

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText;
  } catch (error) {
    console.error("PDF.js error:", error);
    throw new Error("Failed to extract text from PDF.");
  }
};
