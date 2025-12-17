/**
 * Utilities for text selection and French text to number conversion
 * Used in verification forms to auto-fill fields from selected text
 */

const FRENCH_MONTHS: Record<string, string> = {
  janvier: "01",
  fevrier: "02",
  février: "02",
  mars: "03",
  avril: "04",
  mai: "05",
  juin: "06",
  juillet: "07",
  aout: "08",
  août: "08",
  septembre: "09",
  octobre: "10",
  novembre: "11",
  decembre: "12",
  décembre: "12"
};

const FRENCH_NUMBERS: Record<string, number> = {
  un: 1,
  premier: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  "dix-sept": 17,
  "dix-huit": 18,
  "dix-neuf": 19,
  vingt: 20,
  "vingt-et-un": 21,
  "vingt-un": 21,
  "vingt-deux": 22,
  "vingt-trois": 23,
  "vingt-quatre": 24,
  "vingt-cinq": 25,
  "vingt-six": 26,
  "vingt-sept": 27,
  "vingt-huit": 28,
  "vingt-neuf": 29,
  trente: 30,
  "trente-et-un": 31,
  "trente-un": 31,
  quarante: 40,
  cinquante: 50,
  soixante: 60,
  "soixante-dix": 70,
  "soixante-et-onze": 71,
  "soixante-onze": 71,
  "soixante-douze": 72,
  "soixante-treize": 73,
  "soixante-quatorze": 74,
  "soixante-quinze": 75,
  "soixante-seize": 76,
  "soixante-dix-sept": 77,
  "soixante-dix-huit": 78,
  "soixante-dix-neuf": 79,
  "quatre-vingt": 80,
  "quatre-vingts": 80,
  "quatre-vingt-un": 81,
  "quatre-vingt-et-un": 81,
  "quatre-vingt-deux": 82,
  "quatre-vingt-trois": 83,
  "quatre-vingt-quatre": 84,
  "quatre-vingt-cinq": 85,
  "quatre-vingt-six": 86,
  "quatre-vingt-sept": 87,
  "quatre-vingt-huit": 88,
  "quatre-vingt-neuf": 89,
  "quatre-vingt-dix": 90,
  "quatre-vingt-onze": 91,
  "quatre-vingt-douze": 92,
  "quatre-vingt-treize": 93,
  "quatre-vingt-quatorze": 94,
  "quatre-vingt-quinze": 95,
  "quatre-vingt-seize": 96,
  "quatre-vingt-dix-sept": 97,
  "quatre-vingt-dix-huit": 98,
  "quatre-vingt-dix-neuf": 99,
  cent: 100,
  cents: 100,
  mil: 1000,
  mille: 1000
};

/**
 * Cleans selected text by removing extra whitespace and normalizing line breaks
 */
export const cleanSelectedText = (text: string): string => {
  return text
    .replace(/(\r\n|\n|\r)/gm, " ")
    .replace(/\s+/g, " ")
    .replace(/_{2,}/g, "")
    .trim();
};

/**
 * Converts French month names to numeric format (01-12)
 */
export const convertFrenchMonthToNumber = (text: string): string => {
  const cleanText = text.toLowerCase().trim();
  
  // Check if it's already a number
  if (!isNaN(Number(cleanText)) && cleanText.length <= 2) {
    return cleanText.padStart(2, "0");
  }
  
  // Check for month names
  for (const [key, val] of Object.entries(FRENCH_MONTHS)) {
    if (cleanText.includes(key)) {
      return val;
    }
  }
  
  return text;
};

/**
 * Converts French number words to digits
 * Handles simple numbers (un, deux) and complex ones (vingt-quatre, mil neuf cent)
 */
export const convertFrenchNumberToDigit = (text: string): string => {
  const cleanText = text
    .toLowerCase()
    .trim()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
  
  // If it's already numeric, return as is
  if (/^\d+$/.test(cleanText)) {
    return cleanText;
  }
  
  const words = cleanText.split(" ");
  let total = 0;
  let currentAccumulator = 0;
  
  words.forEach(word => {
    const val = FRENCH_NUMBERS[word];
    if (val !== undefined) {
      if (val === 100 || val === 1000) {
        currentAccumulator = (currentAccumulator === 0 ? 1 : currentAccumulator) * val;
        total += currentAccumulator;
        currentAccumulator = 0;
      } else {
        currentAccumulator += val;
      }
    }
  });
  
  total += currentAccumulator;
  
  if (total > 0) {
    return total.toString();
  }
  
  // Fallback: return original text if conversion failed
  return text;
};

/**
 * Smart conversion function that detects field type and applies appropriate conversion
 */
export const convertFrenchTextToValue = (text: string, fieldType: "mois" | "jour" | "annee" | "nombre" | "text"): string => {
  const cleanedText = cleanSelectedText(text);
  
  if (fieldType === "mois") {
    return convertFrenchMonthToNumber(cleanedText);
  }
  
  if (fieldType === "jour" || fieldType === "annee" || fieldType === "nombre") {
    return convertFrenchNumberToDigit(cleanedText);
  }
  
  // For text fields, just return cleaned text
  return cleanedText;
};

/**
 * Detects field type from field name
 */
export const detectFieldType = (fieldName: string): "mois" | "jour" | "annee" | "nombre" | "text" => {
  const lowerFieldName = fieldName.toLowerCase();
  
  if (lowerFieldName.includes("_mois") || lowerFieldName.includes(".mois")) {
    return "mois";
  }
  
  if (lowerFieldName.includes("_jour") || lowerFieldName.includes(".jour")) {
    return "jour";
  }
  
  if (lowerFieldName.includes("_annee") || lowerFieldName.includes(".annee") || lowerFieldName.includes("_annee") || lowerFieldName.includes(".annee")) {
    return "annee";
  }
  
  if (lowerFieldName.includes("age") || lowerFieldName.includes("nombre")) {
    return "nombre";
  }
  
  return "text";
};

