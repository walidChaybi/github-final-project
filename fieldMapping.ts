/**
 * Configuration du mapping des champs pour les formulaires de vérification
 * Définit l'ordre des champs pour la navigation automatique et les règles de conversion
 */

export type OrdreChamps = string[];

const CHAMPS_ORDRE_NAISSANCE_BASE = [
  // Titulaire
  "titulaire.nom",
  "titulaire.sexe",
  "titulaire.prenoms",
  "titulaire.dateNaissance.jour",
  "titulaire.dateNaissance.mois",
  "titulaire.dateNaissance.annee",
  "titulaire.dateNaissance.heure",
  "titulaire.dateNaissance.minute",
  "titulaire.lieuNaissance.lieuReprise",
  "titulaire.domicile.adresse", // Ajout
  "titulaire.profession", // Ajout
  // Parent 1
  "parent1.nom",
  "parent1.prenoms",
  "parent1.dateNaissance.jour",
  "parent1.dateNaissance.mois",
  "parent1.dateNaissance.annee",
  "parent1.afficherAge",
  "parent1.age",
  "parent1.lieuNaissance.lieuReprise",
  "parent1.domicile.adresse", // Ajout
  "parent1.profession", // Ajout
  // Parent 2
  "parent2.nom",
  "parent2.prenoms",
  "parent2.dateNaissance.jour",
  "parent2.dateNaissance.mois",
  "parent2.dateNaissance.annee",
  "parent2.afficherAge",
  "parent2.age",
  "parent2.lieuNaissance.lieuReprise",
  "parent2.domicile.adresse", // Ajout
  "parent2.profession", // Ajout
  // Déclarant
  "declarant.identiteDeclarant",
  "declarant.nom",
  "declarant.prenoms",
  "declarant.dateNaissance.jour",
  "declarant.dateNaissance.mois",
  "declarant.dateNaissance.annee",
  // Adresse du titulaire (doublon possible avec titulaire.domicile, mais gardé pour compatibilité)
  "adresseTitulaire.adresse",
  // Informations complémentaires
  "informationsComplementaires.francaisPar",
  "informationsComplementaires.dateCreation"
];

const CHAMPS_ORDRE_MARIAGE_BASE = [
  // Événement
  "evenement.date.jour",
  "evenement.date.mois",
  "evenement.date.annee",
  "evenement.lieu.lieuReprise",
  // Époux 1
  "epoux1.nom",
  "epoux1.prenoms",
  "epoux1.dateNaissance.jour",
  "epoux1.dateNaissance.mois",
  "epoux1.dateNaissance.annee",
  "epoux1.age",
  "epoux1.lieuNaissance.lieuReprise",
  "epoux1.domicile.adresse", // Ajout
  "epoux1.profession", // Ajout
  "epoux1.pere.nom",
  "epoux1.pere.prenoms",
  "epoux1.pere.domicile.adresse", // Ajout
  "epoux1.pere.profession", // Ajout
  "epoux1.mere.nom",
  "epoux1.mere.prenoms",
  "epoux1.mere.domicile.adresse", // Ajout
  "epoux1.mere.profession", // Ajout
  // Époux 2
  "epoux2.nom",
  "epoux2.prenoms",
  "epoux2.dateNaissance.jour",
  "epoux2.dateNaissance.mois",
  "epoux2.dateNaissance.annee",
  "epoux2.age",
  "epoux2.lieuNaissance.lieuReprise",
  "epoux2.domicile.adresse", // Ajout
  "epoux2.profession", // Ajout
  "epoux2.pere.nom",
  "epoux2.pere.prenoms",
  "epoux2.pere.domicile.adresse", // Ajout
  "epoux2.pere.profession", // Ajout
  "epoux2.mere.nom",
  "epoux2.mere.prenoms",
  "epoux2.mere.domicile.adresse", // Ajout
  "epoux2.mere.profession", // Ajout
  // Contrat de mariage
  "contratMariage.existenceContrat",
  "contratMariage.enonciations",
  // Informations complémentaires
  "informationsComplementaires.dateCreation"
];

const CHAMPS_ORDRE_DECES_BASE = [
  // Événement
  "evenement.date.jour",
  "evenement.date.mois",
  "evenement.date.annee",
  "evenement.lieu.lieuReprise",
  // Défunt
  "defunt.nom",
  "defunt.prenoms",
  "defunt.dateNaissance.jour",
  "defunt.dateNaissance.mois",
  "defunt.dateNaissance.annee",
  "defunt.lieu.lieuReprise",
  "defunt.domicile.adresse", // Ajout
  "defunt.profession", // Ajout
  // Parents
  "defunt.pere.nom",
  "defunt.pere.prenoms",
  "defunt.pere.domicile.adresse", // Ajout
  "defunt.pere.profession", // Ajout
  "defunt.mere.nom",
  "defunt.mere.prenoms",
  "defunt.mere.domicile.adresse", // Ajout
  "defunt.mere.profession", // Ajout
  // Dernier conjoint
  "dernierConjoint.nom",
  "dernierConjoint.prenoms",
  // Informations complémentaires
  "informationsComplementaires.dateCreation"
];

/**
 * Récupère l'ordre des champs basé sur la nature de l'acte
 */
export const getFieldOrder = (nature: "NAISSANCE" | "MARIAGE" | "DECES"): OrdreChamps => {
  let baseOrder: OrdreChamps;

  switch (nature) {
    case "MARIAGE":
      baseOrder = CHAMPS_ORDRE_MARIAGE_BASE;
      break;
    case "NAISSANCE":
      baseOrder = CHAMPS_ORDRE_NAISSANCE_BASE;
      break;
    case "DECES":
      baseOrder = CHAMPS_ORDRE_DECES_BASE;
      break;
    default:
      return [];
  }

  // Retourne l'ordre avec le premier prénom par défaut
  return baseOrder.flatMap(field => (field.endsWith(".prenoms") ? [`${field}.prenom1`] : [field]));
};

/**
 * Vérifie si les champs du déclarant doivent être inclus
 */
const inclureChampsDeclarant = (valeurs: any): boolean => {
  return valeurs?.declarant?.identiteDeclarant === "TIERS";
};

/**
 * Vérifie si le champ âge doit être inclus
 */
const inclureChampAge = (valeurs: any, champParent: "parent1" | "parent2"): boolean => {
  return valeurs?.[champParent]?.afficherAge === true;
};

/**
 * Navigation intelligente entre les champs
 * Gère les prénoms dynamiques, les champs conditionnels et les cases à cocher pour l'âge
 */
export const getNextFieldSmart = (
  champCourant: string,
  nature: "NAISSANCE" | "MARIAGE" | "DECES",
  valeursFormulaire?: any
): string | null => {
  // Si le champ courant est un prénom, essayer le prénom suivant
  const matchPrenom = champCourant.match(/^(.+\.prenoms)\.prenom(\d+)$/);
  if (matchPrenom) {
    const [, cheminPrenom, numeroCourant] = matchPrenom;
    const numeroSuivant = parseInt(numeroCourant) + 1;
    const champPrenomSuivant = `${cheminPrenom}.prenom${numeroSuivant}`;

    // Vérifier si le prénom suivant existe dans le DOM
    const elementSuivant = document.getElementById(champPrenomSuivant);
    if (elementSuivant) {
      return champPrenomSuivant;
    }
  }

  // Gestion spéciale pour la case à cocher afficherAge
  if (champCourant === "parent1.afficherAge" && valeursFormulaire?.parent1?.afficherAge) {
    const elementAge = document.getElementById("parent1.age");
    if (elementAge) return "parent1.age";
  }
  if (champCourant === "parent2.afficherAge" && valeursFormulaire?.parent2?.afficherAge) {
    const elementAge = document.getElementById("parent2.age");
    if (elementAge) return "parent2.age";
  }

  // Déterminer l'ordre de base selon le type de formulaire
  const ordreBase: OrdreChamps = getFieldOrder(nature);

  // Trouver la base du champ courant
  const baseCourante = matchPrenom ? matchPrenom[1] : champCourant;

  // Trouver l'index de la base courante
  const indexBaseCourante = ordreBase.findIndex(field => field === baseCourante || champCourant.startsWith(field + "."));

  if (indexBaseCourante === -1 || indexBaseCourante >= ordreBase.length - 1) {
    return null;
  }

  const inclureDeclarant = valeursFormulaire ? inclureChampsDeclarant(valeursFormulaire) : true;
  const inclureAgeParent1 = valeursFormulaire ? inclureChampAge(valeursFormulaire, "parent1") : true;
  const inclureAgeParent2 = valeursFormulaire ? inclureChampAge(valeursFormulaire, "parent2") : true;

  // Chercher le prochain champ existant dans le DOM
  for (let i = indexBaseCourante + 1; i < ordreBase.length; i++) {
    const baseSuivante = ordreBase[i];

    // Sauter les champs du déclarant si non requis
    if (!inclureDeclarant) {
      if (baseSuivante === "declarant.nom" || baseSuivante === "declarant.prenoms" || baseSuivante.startsWith("declarant.dateNaissance")) {
        continue;
      }
    }

    // Sauter l'âge si non coché
    if (baseSuivante === "parent1.age" && !inclureAgeParent1) continue;
    if (baseSuivante === "parent2.age" && !inclureAgeParent2) continue;

    // Si c'est un champ prénoms, essayer le premier prénom
    if (baseSuivante.endsWith(".prenoms")) {
      const champPrenomSuivant = `${baseSuivante}.prenom1`;
      const element = document.getElementById(champPrenomSuivant);
      if (element) {
        return champPrenomSuivant;
      }
      continue;
    }

    // Pour les champs normaux
    const element = document.getElementById(baseSuivante);
    if (element) {
      return baseSuivante;
    }
  }

  return null;
};
