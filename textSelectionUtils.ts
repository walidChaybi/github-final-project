/**
 * Utilities for text selection and French text conversion
 * Used in verification forms to auto-fill fields from selected text
 * Works in conjunction with DateRECE for date formatting
 */

const MOIS_FRANCAIS: Record<string, string> = {
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

const NOMBRES_FRANCAIS: Record<string, number> = {
  zéro: 0,
  zero: 0,
  un: 1,
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
  vingt: 20,
  trente: 30,
  quarante: 40,
  cinquante: 50,
  soixante: 60,
  cent: 100,
  cents: 100,
  mil: 1000,
  mille: 1000
};

/**
 * Cleans selected text by removing extra whitespace and normalizing line breaks
 */
export const nettoyerTexteSelectionne = (texte: string | undefined | null): string => {
  return texte?.replace(/\s+/g, " ").replace(/_{2,}/g, "").trim() || "";
};

/**
 * Converts French month names to numeric format (01-12)
 */
export const convertirMoisFrancaisEnNombre = (texte: string): string => {
  const texteNettoye = texte.toLowerCase().trim();

  // Check if it's already a number
  if (!isNaN(Number(texteNettoye)) && texteNettoye.length <= 2) {
    const num = parseInt(texteNettoye);
    if (num >= 1 && num <= 12) {
      return texteNettoye.padStart(2, "0");
    }
  }

  // Check for month names
  for (const [cle, val] of Object.entries(MOIS_FRANCAIS)) {
    if (texteNettoye.includes(cle)) {
      return val;
    }
  }

  return texte;
};

/**
 * Converts French number words to digits
 */
export const convertirNombreEnChiffre = (texte: string): string => {
  const texteNettoye = texte.toLowerCase().trim();

  // Already a number? Return as is
  if (/^\d+$/.test(texteNettoye)) {
    return texteNettoye;
  }

  // Normalize: remove hyphens, ordinal suffixes, and split into words
  const mots = texteNettoye
    .replace(/[\s-]+/g, " ")
    .replace(/et/g, "")
    .replace(/ième|ieme|ier|iere|ère|ere/g, "")
    .trim()
    .split(" ")
    .filter(mot => mot.length > 0);

  let total = 0;
  let current = 0;

  for (const mot of mots) {
    const valeur = NOMBRES_FRANCAIS[mot];
    if (valeur === undefined) continue;

    // Handle large multipliers (>=1000): add to total and reset
    if (valeur >= 1000) {
      current = (current || 1) * valeur;
      total += current;
      current = 0;
    }
    // Handle "cent" (100): multiply current
    else if (valeur === 100) {
      current = (current || 1) * 100;
    }
    // Everything else: add to current
    else {
      current += valeur;
    }
  }

  const resultat = total + current;
  return resultat > 0 ? resultat.toString() : texte;
};

/**
 * Converts French sex/gender terms to ESexe enum keys
 */
export const convertirSexeFrancaisEnEnum = (texte: string): string => {
  const normalized = texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const correspondances: Record<string, string> = {
    feminin: "FEMININ",
    masculin: "MASCULIN",
    indetermine: "INDETERMINE",
    "non renseigne": "INCONNU",
    inconnu: "INCONNU"
  };

  // Check if it's in the map
  if (correspondances[normalized]) {
    return correspondances[normalized];
  }

  // Check if already a valid enum key
  if (["MASCULIN", "FEMININ", "INDETERMINE", "INCONNU"].includes(texte.toUpperCase())) {
    return texte.toUpperCase();
  }

  // Default fallback
  return "INCONNU";
};

/**
 * Smart conversion function that detects field type and applies appropriate conversion
 */
export const convertirTexteFrancaisEnValeur = (
  texte: string | undefined | null,
  typeChamp: "mois" | "jour" | "annee" | "heure" | "minute" | "nombre" | "sexe" | "text"
): string => {
  const texteNettoye = nettoyerTexteSelectionne(texte);

  // If text was null/undefined, return empty string
  if (!texteNettoye) {
    return "";
  }

  if (typeChamp === "mois") {
    return convertirMoisFrancaisEnNombre(texteNettoye);
  }

  if (typeChamp === "jour" || typeChamp === "annee" || typeChamp === "heure" || typeChamp === "minute" || typeChamp === "nombre") {
    return convertirNombreEnChiffre(texteNettoye);
  }

  if (typeChamp === "sexe") {
    return convertirSexeFrancaisEnEnum(texteNettoye);
  }

  // For text fields, just return cleaned text
  return texteNettoye;
};

/**
 * Detects field type from field name
 */
export const detecterTypeChamp = (nomChamp: string): "mois" | "jour" | "annee" | "heure" | "minute" | "nombre" | "sexe" | "text" => {
  const nomChampMinuscule = nomChamp.toLowerCase();

  // Extract last segment (e.g., "jour" from "evenement.date.jour")
  const dernierSegment = nomChampMinuscule.split(/[._]/).pop() || "";

  // Map of last segment to type
  const typesParSegment: Record<string, "mois" | "jour" | "annee" | "heure" | "minute"> = {
    mois: "mois",
    jour: "jour",
    annee: "annee",
    heure: "heure",
    minute: "minute"
  };

  // Check last segment first (most specific)
  if (typesParSegment[dernierSegment]) {
    return typesParSegment[dernierSegment];
  }

  // Check full field name for special cases
  if (nomChampMinuscule.includes("age") || nomChampMinuscule.includes("nombre")) {
    return "nombre";
  }

  if (nomChampMinuscule.includes("sexe")) {
    return "sexe";
  }

  return "text";
};
