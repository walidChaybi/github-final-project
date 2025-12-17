/**
 * Field mapping configuration for verification forms
 * Defines field order for auto-navigation and conversion rules
 */

export type FieldOrder = string[];

/**
 * Field order for Mariage act verification
 */
export const CHAMPS_ORDRE_MARIAGE: FieldOrder = [
  // Événement
  "evenement.date.jour",
  "evenement.date.mois",
  "evenement.date.annee",
  "evenement.lieu.lieuReprise",
  
  // Époux 1
  "epoux1.nom",
  "epoux1.prenoms.prenom1",
  "epoux1.prenoms.prenom2",
  "epoux1.dateNaissance.jour",
  "epoux1.dateNaissance.mois",
  "epoux1.dateNaissance.annee",
  "epoux1.age",
  "epoux1.lieuReprise.lieuReprise",
  "epoux1.pere.nom",
  "epoux1.pere.prenoms.prenom1",
  "epoux1.mere.nom",
  "epoux1.mere.prenoms.prenom1",
  
  // Époux 2
  "epoux2.nom",
  "epoux2.prenoms.prenom1",
  "epoux2.prenoms.prenom2",
  "epoux2.dateNaissance.jour",
  "epoux2.dateNaissance.mois",
  "epoux2.dateNaissance.annee",
  "epoux2.age",
  "epoux2.lieuReprise.lieuReprise",
  "epoux2.pere.nom",
  "epoux2.pere.prenoms.prenom1",
  "epoux2.mere.nom",
  "epoux2.mere.prenoms.prenom1",
  
  // Contrat de mariage
  "contratMariage.existenceContrat",
  "contratMariage.enonciations",
  
  // Informations complémentaires
  "informationsComplementaires.dateCreation"
];

/**
 * Field order for Naissance act verification
 */
export const CHAMPS_ORDRE_NAISSANCE: FieldOrder = [
  // Titulaire
  "titulaire.nom",
  "titulaire.nomPartie1",
  "titulaire.nomPartie2",
  "titulaire.prenoms.prenom1",
  "titulaire.prenoms.prenom2",
  "titulaire.dateNaissance.jour",
  "titulaire.dateNaissance.mois",
  "titulaire.dateNaissance.annee",
  "titulaire.lieuNaissance.lieuReprise",
  "titulaire.sexe",
  
  // Parent 1
  "parent1.nom",
  "parent1.prenoms.prenom1",
  "parent1.prenoms.prenom2",
  "parent1.dateNaissance.jour",
  "parent1.dateNaissance.mois",
  "parent1.dateNaissance.annee",
  "parent1.age",
  "parent1.lieuNaissance.lieuReprise",
  
  // Parent 2
  "parent2.nom",
  "parent2.prenoms.prenom1",
  "parent2.prenoms.prenom2",
  "parent2.dateNaissance.jour",
  "parent2.dateNaissance.mois",
  "parent2.dateNaissance.annee",
  "parent2.age",
  "parent2.lieuNaissance.lieuReprise",
  
  // Informations complémentaires
  "informationsComplementaires.nationalite",
  "informationsComplementaires.dateCreation"
];

/**
 * Field order for Décès act verification
 */
export const CHAMPS_ORDRE_DECES: FieldOrder = [
  // Événement
  "evenement.date.jour",
  "evenement.date.mois",
  "evenement.date.annee",
  "evenement.lieu.lieuReprise",
  
  // Défunt
  "defunt.nom",
  "defunt.prenoms.prenom1",
  "defunt.prenoms.prenom2",
  "defunt.dateNaissance.jour",
  "defunt.dateNaissance.mois",
  "defunt.dateNaissance.annee",
  "defunt.lieu.lieuReprise",
  
  // Parents
  "defunt.pere.nom",
  "defunt.pere.prenoms.prenom1",
  "defunt.mere.nom",
  "defunt.mere.prenoms.prenom1",
  
  // Dernier conjoint
  "dernierConjoint.nom",
  "dernierConjoint.prenoms.prenom1",
  
  // Informations complémentaires
  "informationsComplementaires.dateCreation"
];

/**
 * Get field order based on act nature
 */
export const getFieldOrder = (nature: "NAISSANCE" | "MARIAGE" | "DECES"): FieldOrder => {
  switch (nature) {
    case "MARIAGE":
      return CHAMPS_ORDRE_MARIAGE;
    case "NAISSANCE":
      return CHAMPS_ORDRE_NAISSANCE;
    case "DECES":
      return CHAMPS_ORDRE_DECES;
    default:
      return [];
  }
};

/**
 * Get next field name in sequence
 */
export const getNextField = (currentField: string, fieldOrder: FieldOrder): string | null => {
  const currentIndex = fieldOrder.indexOf(currentField);
  if (currentIndex !== -1 && currentIndex < fieldOrder.length - 1) {
    return fieldOrder[currentIndex + 1];
  }
  return null;
};

