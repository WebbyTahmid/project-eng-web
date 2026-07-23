// Dynamically load JSON dictionaries
import cmuDict from '../../cmu_dict.json';
import beepDict from '../../beep_dict.json'; 

/**
 * Helper: Generate syllables manually (No external plugins needed)
 */
function getSyllables(word) {
    let w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return [word];
    if (w.length <= 3) return [w];
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    w = w.replace(/^y/, '');
    const syls = w.match(/[aeiouy]{1,2}/g);
    return syls ? syls : [word];
}

/**
 * Layer 3: Suffix-Rule Engine (Fallback)
 */
function applySuffixRules(word, syllables) {
    if (word.endsWith('ic') && syllables.length > 1) {
        return syllables.length - 2; 
    }
    return 0; 
}

/**
 * Layer 2: Local Dictionary Parser (US = CMU, UK = Britfone)
 */
function getLocalStress(word, accent, syllables) {
    const dict = accent === 'US' ? cmuDict : beepDict;
    const phonemes = dict[word];

    if (!phonemes) return null; 

    let stressIndex = 0;

    if (accent === 'US') {
        const parts = phonemes.split(' ');
        let vowelCount = 0;
        for (const p of parts) {
            if (/\d/.test(p)) {
                if (p.includes('1')) stressIndex = vowelCount;
                vowelCount++;
            }
        }
    } else {
        const parts = phonemes.split(' ');
        let vowelCount = 0;
        const ipaVowels = /[aeiouæɑɒɔəɛɜɪiuxʌ]/i; 
        
        for (const p of parts) {
            if (p.includes('ˈ')) {
                stressIndex = vowelCount;
            }
            if (ipaVowels.test(p)) {
                vowelCount++;
            }
        }
    }

    return Math.min(stressIndex, syllables.length - 1);
}

/**
 * Main Controller: The 3-Layer Architecture
 */
export async function getWordData(word, accent = 'US') {
    const cleanWord = word.toLowerCase().trim().replace(/[^a-z]/g, '');
    const syllables = getSyllables(cleanWord);
    
    let result = {
        word: cleanWord,
        accent: accent,
        syllables: syllables,
        stressIndex: 0,
        source: ''
    };

    try {
        const apiResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
        
        if (apiResponse.ok) {
            const data = await apiResponse.json();
            throw new Error("API doesn't provide explicit index, fallback to local");
        } else {
            throw new Error("404 API Fail");
        }
    } catch (error) {
        const localStress = getLocalStress(cleanWord, accent, syllables);
        
        if (localStress !== null) {
            result.stressIndex = localStress;
            result.source = `Local Dictionary (${accent})`;
        } else {
            result.stressIndex = applySuffixRules(cleanWord, syllables);
            result.source = 'Suffix Fallback Engine';
        }
    }

    return result;
}