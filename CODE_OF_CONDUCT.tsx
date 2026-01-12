import { FicheActe, IFicheActeDto } from "@model/etatcivil/acte/FicheActe";
import { IFiliationDto } from "@model/etatcivil/acte/Filiation";
import { IEvenementDto } from "@model/etatcivil/acte/IEvenement";
import { ITitulaireActeDto } from "@model/etatcivil/acte/TitulaireActe";
import { ELienParente } from "@model/etatcivil/enum/ELienParente";
import { ENatureActe } from "@model/etatcivil/enum/NatureActe";
import { ESexe } from "@model/etatcivil/enum/Sexe";
import { DateHeureFormUtils, IDateHeureForm } from "@model/form/commun/DateForm";
import { PrenomsForm, TPrenomsForm } from "@model/form/commun/PrenomsForm";

enum EActionFormulaireMiseAJour {
  VERIFIER_DONNEES = "VERIFIER_DONNEES",
  TERMINER_SIGNER = "TERMINER_SIGNER"
}

export interface IVerificationDonneesForm {
  typeActe: keyof typeof ENatureActe;
  naissance: IVerificationDonneesNaissanceForm;
  mariage: IVerificationDonneesMariageForm;
  deces: IVerificationDonneesDecesForm;
  verificationEffectuee: boolean;
}

export interface IVerificationDonneesNaissanceForm {
  titulaire: {
    nom: string;
    prenoms: TPrenomsForm;
    dateNaissance: IDateHeureForm;
    lieuNaissance: {
      lieuReprise: string;
    };
    sexe: keyof typeof ESexe;
  };
  parent1: {
    nom: string;
    prenoms: TPrenomsForm;
    dateNaissance: IDateHeureForm;
    age: string;
    lieuNaissance: {
      lieuReprise: string;
    };
    profession: string;
  };
  parent2: {
    nom: string;
    prenoms: TPrenomsForm;
    dateNaissance: IDateHeureForm;
    age: string;
    lieuNaissance: {
      lieuReprise: string;
    };
    profession: string;
  };
  declarant: {
    identiteDeclarant: string;
  };

  informationsComplementaires: {
    francaisPar: string;
    dateCreation: string;
  };
}

export interface IVerificationDonneesMariageForm {
  evenement: {
    date: IDateHeureForm;
    lieu: {
      lieuReprise: string;
    };
  };
  epoux1: IEpouxForm;
  epoux2: IEpouxForm;
  contratMariage: {
    existenceContrat: string;
    enonciations: string;
  };
  informationsComplementaires: {
    mentions: any[];
    dateCreation: string;
  };
  verificationEffectuee: boolean;
}

interface IEpouxForm {
  nom: string;
  prenoms: TPrenomsForm;
  dateNaissance: IDateHeureForm;
  age: string;
  lieuReprise: {
    lieuReprise: string;
  };
  profession: string;
  pere: IParentForm;
  mere: IParentForm;
  adoptePar: string;
}

export interface IVerificationDonneesDecesForm {
  evenement: {
    date: IDateHeureForm;
    lieu: {
      lieuReprise: string;
    };
  };
  defunt: {
    nom: string;
    prenoms: TPrenomsForm;
    dateNaissance: IDateHeureForm;
    lieu: {
      lieuReprise: string;
    };
    profession: string;
    pere: IParentForm;
    mere: IParentForm;
  };
  dernierConjoint: {
    nom: string;
    prenoms: TPrenomsForm;
  };
  informationsComplementaires: {
    mentions: any[];
    dateCreation: string;
  };
}

interface IParentForm {
  nom: string;
  prenoms: TPrenomsForm;
  profession: string;
}

export const MiseAJourModificationForm = {
  valeursInitiales: (acte: FicheActe, verificationDonneesEffectuee: boolean = false): IVerificationDonneesForm => {
    const typeActe = acte.nature;

    return {
      typeActe,
      naissance: genererVerificationNaissance(acte),
      mariage: genererVerificationMariage(acte),
      deces: genererVerificationDeces(acte),
      verificationEffectuee: verificationDonneesEffectuee
    };
  },

  versDtoPatchNaissance: (valeursSaisies: IVerificationDonneesNaissanceForm, acte: FicheActe): Partial<IFicheActeDto> => {
    const titulaireActe = acte.titulaires[0];
    const parent1Acte = titulaireActe?.getParent1();
    const parent2Acte = titulaireActe?.getParent2();

    // Mapper l'événement (naissance du titulaire)
    const evenement: IEvenementDto = {
      id: acte.evenement?.id,
      minute: valeursSaisies.titulaire.dateNaissance.minute
        ? Number(valeursSaisies.titulaire.dateNaissance.minute)
        : acte.evenement?.minute,
      heure: valeursSaisies.titulaire.dateNaissance.heure ? Number(valeursSaisies.titulaire.dateNaissance.heure) : acte.evenement?.heure,
      jour: valeursSaisies.titulaire.dateNaissance.jour ? Number(valeursSaisies.titulaire.dateNaissance.jour) : acte.evenement?.jour,
      mois: valeursSaisies.titulaire.dateNaissance.mois ? Number(valeursSaisies.titulaire.dateNaissance.mois) : acte.evenement?.mois,
      annee: valeursSaisies.titulaire.dateNaissance.annee ? Number(valeursSaisies.titulaire.dateNaissance.annee) : acte.evenement?.annee,
      ville: acte.evenement?.ville,
      region: acte.evenement?.region,
      pays: acte.evenement?.pays ?? "",
      lieuReprise: valeursSaisies.titulaire.lieuNaissance.lieuReprise || acte.evenement?.lieuReprise,
      lieuFormate: acte.evenement?.lieuFormate
    };

    // Mapper les filiations (parents)
    const filiations: IFiliationDto[] = [];

    // Parent 1
    if (valeursSaisies.parent1.nom || parent1Acte) {
      filiations.push({
        lienParente: parent1Acte?.lienParente || "PARENT",
        ordre: parent1Acte?.ordre ?? 1,
        nom: valeursSaisies.parent1.nom || parent1Acte?.nom || undefined,
        sexe: parent1Acte?.sexe || "INCONNU",
        profession: valeursSaisies.parent1.profession || parent1Acte?.profession || undefined,
        domicile: parent1Acte?.domicile
          ? {
              voie: parent1Acte.domicile.voie,
              ville: parent1Acte.domicile.ville,
              region: parent1Acte.domicile.region,
              pays: parent1Acte.domicile.pays
            }
          : undefined,
        prenoms: PrenomsForm.versPrenomsStringDto(valeursSaisies.parent1.prenoms)
      });
    }

    // Parent 2
    if (valeursSaisies.parent2.nom || parent2Acte) {
      filiations.push({
        lienParente: parent2Acte?.lienParente || "PARENT",
        ordre: parent2Acte?.ordre ?? 2,
        nom: valeursSaisies.parent2.nom || parent2Acte?.nom || undefined,
        sexe: parent2Acte?.sexe || "INCONNU",
        profession: valeursSaisies.parent2.profession || parent2Acte?.profession || undefined,
        domicile: parent2Acte?.domicile
          ? {
              voie: parent2Acte.domicile.voie,
              ville: parent2Acte.domicile.ville,
              region: parent2Acte.domicile.region,
              pays: parent2Acte.domicile.pays
            }
          : undefined,
        prenoms: PrenomsForm.versPrenomsStringDto(valeursSaisies.parent2.prenoms)
      });
    }

    // Mapper le titulaire
    const titulaire: ITitulaireActeDto = {
      nom: valeursSaisies.titulaire.nom || titulaireActe?.nom || undefined,
      prenoms: PrenomsForm.versPrenomsStringDto(valeursSaisies.titulaire.prenoms),
      ordre: titulaireActe?.ordre ?? 1,
      sexe: valeursSaisies.titulaire.sexe || titulaireActe?.sexe || "INCONNU",
      naissance: {
        jour: valeursSaisies.titulaire.dateNaissance.jour
          ? Number(valeursSaisies.titulaire.dateNaissance.jour)
          : titulaireActe?.naissance?.jour,
        mois: valeursSaisies.titulaire.dateNaissance.mois
          ? Number(valeursSaisies.titulaire.dateNaissance.mois)
          : titulaireActe?.naissance?.mois,
        annee: valeursSaisies.titulaire.dateNaissance.annee
          ? Number(valeursSaisies.titulaire.dateNaissance.annee)
          : titulaireActe?.naissance?.annee,
        heure: valeursSaisies.titulaire.dateNaissance.heure
          ? Number(valeursSaisies.titulaire.dateNaissance.heure)
          : titulaireActe?.naissance?.heure,
        minute: valeursSaisies.titulaire.dateNaissance.minute
          ? Number(valeursSaisies.titulaire.dateNaissance.minute)
          : titulaireActe?.naissance?.minute,
        ville: titulaireActe?.naissance?.ville,
        region: titulaireActe?.naissance?.region,
        pays: titulaireActe?.naissance?.pays ?? "",
        lieuReprise: valeursSaisies.titulaire.lieuNaissance.lieuReprise || titulaireActe?.naissance?.lieuReprise,
        lieuFormate: titulaireActe?.naissance?.lieuFormate
      },
      profession: titulaireActe?.profession || undefined,
      domicile: titulaireActe?.domicile
        ? {
            voie: titulaireActe.domicile.voie,
            ville: titulaireActe.domicile.ville,
            region: titulaireActe.domicile.region,
            pays: titulaireActe.domicile.pays
          }
        : undefined,
      filiations
    };

    // Mapper les analyses marginales
    const analyseMarginales = acte.analysesMarginales.map(am => ({
      id: am.id,
      dateDebut: am.dateDebut.versTimestamp(),
      titulaires: am.titulaires.map(t => ({
        nom: t.nom || undefined,
        prenoms: t.prenoms,
        ordre: t.ordre,
        typeDeclarationConjointe: t.typeDeclarationConjointe || undefined
      })),
      estValide: am.estValide
    }));

    // Construire le DTO complet (utilise Partial<IFicheActeDto>)
    return {
      id: acte.id,
      dateCreation: acte.dateCreation?.versTimestamp(),
      statut: acte.statut,
      nature: acte.nature,
      numero: acte.numero || undefined,
      dateDerniereDelivrance: acte.dateDerniereDelivrance?.versTimestamp(),
      dateDerniereMaj: acte.dateDerniereMaj?.versDateArrayDTO(),
      visibiliteArchiviste: acte.visibiliteArchiviste,
      evenement,
      mentions: [],
      titulaires: [titulaire],
      alerteActes: [],
      personnes: [],
      registre: acte.registre
        ? {
            famille: acte.registre.famille,
            annee: acte.registre.annee,
            support1: acte.registre.support1 || undefined,
            support2: acte.registre.support2 || undefined,
            type: acte.registre.type
              ? {
                  id: acte.registre.type.id,
                  estOuvert: acte.registre.type.estOuvert,
                  poste: acte.registre.type.poste,
                  pocopa: acte.registre.type.pocopa
                }
              : undefined
          }
        : undefined,
      corpsExtraitRectifications: [],
      analyseMarginales,
      type: acte.type,
      referenceActe: acte.referenceActe,
      origine: acte.origine
    };
  }
};

const genererVerificationNaissance = (acte: FicheActe): IVerificationDonneesNaissanceForm => {
  const titulaire = acte.titulaires[0];
  const parent1 = titulaire?.getParent1();
  const parent2 = titulaire?.getParent2();

  return {
    titulaire: {
      nom: titulaire?.nom || "",
      prenoms: PrenomsForm.depuisStringDto(titulaire?.prenoms || []),
      dateNaissance: DateHeureFormUtils.valeursDefauts(
        {
          jour: titulaire?.naissance?.jour?.toString(),
          mois: titulaire?.naissance?.mois?.toString(),
          annee: titulaire?.naissance?.annee?.toString(),
          heure: titulaire?.naissance?.heure?.toString(),
          minute: titulaire?.naissance?.minute?.toString()
        },
        true
      ),
      lieuNaissance: {
        lieuReprise: titulaire?.naissance?.lieuReprise || ""
      },
      sexe: (titulaire?.sexe as keyof typeof ESexe) || "INCONNU"
    },
    parent1: {
      nom: parent1?.nom || "",
      prenoms: PrenomsForm.depuisStringDto(parent1?.prenoms || []),
      dateNaissance: DateHeureFormUtils.valeursDefauts({
        jour: parent1?.naissance?.jour?.toString(),
        mois: parent1?.naissance?.mois?.toString(),
        annee: parent1?.naissance?.annee?.toString()
      }),
      age: parent1?.age?.toString() || "",
      lieuNaissance: {
        lieuReprise: parent1?.naissance?.lieuReprise || ""
      },
      profession: parent1?.profession || ""
    },
    parent2: {
      nom: parent2?.nom || "",
      prenoms: PrenomsForm.depuisStringDto(parent2?.prenoms || []),
      dateNaissance: DateHeureFormUtils.valeursDefauts({
        jour: parent2?.naissance?.jour?.toString(),
        mois: parent2?.naissance?.mois?.toString(),
        annee: parent2?.naissance?.annee?.toString()
      }),
      age: parent2?.age?.toString() || "",
      lieuNaissance: {
        lieuReprise: parent2?.naissance?.lieuReprise || ""
      },
      profession: parent2?.profession || ""
    },
    declarant: {
      identiteDeclarant: ""
    },
    informationsComplementaires: {
      francaisPar: "",
      dateCreation: acte.dateCreation?.format("JJ/MM/AAAA") ?? ""
    }
  };
};

const genererVerificationMariage = (acte: FicheActe): IVerificationDonneesMariageForm => {
  const epoux1 = acte.titulaires[0];
  const epoux2 = acte.titulaires[1];

  const getParentInfo = (titulaire: typeof epoux1, estMere: boolean): IParentForm => {
    const parent = estMere ? titulaire?.getMere() : titulaire?.getPere();
    return {
      nom: parent?.nom || "",
      prenoms: PrenomsForm.depuisStringDto(parent?.prenoms || []),
      profession: parent?.profession || ""
    };
  };

  const getAdoptePar = (titulaire: typeof epoux1): string => {
    const parentsAdoptants = titulaire?.filiations.filter(
      f => f.lienParente === ELienParente.PARENT_ADOPTANT || f.lienParente === ELienParente.ADOPTANT_CONJOINT_DU_PARENT
    );
    if (!parentsAdoptants || parentsAdoptants.length === 0) return "";
    return parentsAdoptants.map(p => `${p.prenoms.join(" ")} ${p.nom || ""}`.trim()).join(", ");
  };

  const getEpouxInfo = (titulaire: typeof epoux1): IEpouxForm => ({
    nom: titulaire?.nom || "",
    prenoms: PrenomsForm.depuisStringDto(titulaire?.prenoms || []),
    dateNaissance: DateHeureFormUtils.valeursDefauts({
      jour: titulaire?.naissance?.jour?.toString(),
      mois: titulaire?.naissance?.mois?.toString(),
      annee: titulaire?.naissance?.annee?.toString()
    }),
    age: titulaire?.age?.toString() || "",
    lieuReprise: {
      lieuReprise: titulaire?.naissance?.lieuReprise || ""
    },
    profession: titulaire?.profession || "",
    pere: getParentInfo(titulaire, false),
    mere: getParentInfo(titulaire, true),
    adoptePar: getAdoptePar(titulaire)
  });

  return {
    evenement: {
      date: DateHeureFormUtils.valeursDefauts(
        {
          jour: acte.evenement?.jour?.toString(),
          mois: acte.evenement?.mois?.toString(),
          annee: acte.evenement?.annee?.toString(),
          heure: acte.evenement?.heure?.toString(),
          minute: acte.evenement?.minute?.toString()
        },
        true
      ),
      lieu: {
        lieuReprise: acte.evenement?.lieuReprise || ""
      }
    },
    epoux1: getEpouxInfo(epoux1),
    epoux2: getEpouxInfo(epoux2),
    contratMariage: {
      existenceContrat: acte.detailMariage?.existenceContrat || "",
      enonciations: acte.detailMariage?.contrat || ""
    },
    informationsComplementaires: {
      mentions: acte.mentions || [],
      dateCreation: acte.dateCreation?.format("JJ/MM/AAAA") ?? ""
    },
    verificationEffectuee: false
  };
};

const genererVerificationDeces = (acte: FicheActe): IVerificationDonneesDecesForm => {
  const defunt = acte.titulaires[0];
  const pere = defunt?.getPere();
  const mere = defunt?.getMere();

  return {
    evenement: {
      date: DateHeureFormUtils.valeursDefauts({
        jour: acte.evenement?.jour?.toString(),
        mois: acte.evenement?.mois?.toString(),
        annee: acte.evenement?.annee?.toString()
      }),
      lieu: {
        lieuReprise: acte.evenement?.lieuReprise || ""
      }
    },
    defunt: {
      nom: defunt?.nom || "",
      prenoms: PrenomsForm.depuisStringDto(defunt?.prenoms || []),
      dateNaissance: DateHeureFormUtils.valeursDefauts({
        jour: defunt?.naissance?.jour?.toString(),
        mois: defunt?.naissance?.mois?.toString(),
        annee: defunt?.naissance?.annee?.toString()
      }),
      lieu: {
        lieuReprise: defunt?.naissance?.lieuReprise || ""
      },
      profession: defunt?.profession || "",
      pere: {
        nom: pere?.nom || "",
        prenoms: PrenomsForm.depuisStringDto(pere?.prenoms || []),
        profession: pere?.profession || ""
      },
      mere: {
        nom: mere?.nom || "",
        prenoms: PrenomsForm.depuisStringDto(mere?.prenoms || []),
        profession: mere?.profession || ""
      }
    },
    dernierConjoint: {
      nom: defunt?.nomDernierConjoint || "",
      prenoms: PrenomsForm.depuisStringDto(defunt?.prenomsDernierConjoint ? [defunt.prenomsDernierConjoint] : [])
    },
    informationsComplementaires: {
      mentions: acte.mentions || [],
      dateCreation: acte.dateCreation?.format("JJ/MM/AAAA") ?? ""
    }
  };
};
