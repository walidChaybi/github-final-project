import ChampDate from "@composants/commun/champs/ChampDate";
import ChampTexte from "@composants/commun/champs/ChampTexte";
import ChampsPrenoms from "@composants/commun/champs/ChampsPrenoms";
import ConteneurAvecBordure from "@composants/commun/conteneurs/formulaire/ConteneurAvecBordure";
import { FicheActe } from "@model/etatcivil/acte/FicheActe";
import { Mention } from "@model/etatcivil/acte/mention/Mention";
import { DateHeureFormUtils, IDateHeureForm } from "@model/form/commun/DateForm";
import { PrenomsForm, TPrenomsForm } from "@model/form/commun/PrenomsForm";
import { Formik } from "formik";
import React, { useEffect, useRef, useState } from "react";
import { VscUnlock } from "react-icons/vsc";
import { convertFrenchTextToValue, detectFieldType } from "../../../../../utils/textSelectionUtils";
import { CHAMPS_ORDRE_DECES, getNextField } from "./fieldMapping";
import VerifierCaseACocher from "./VerifierCaseACocher";

interface IVerificationDonneesDecesAmelioreProps {
  acte: FicheActe | null;
  verificationDonneesEffectuee: boolean;
  setVerificationDonneesEffectuee: (value: boolean) => void;
  miseAJourEffectuee: boolean;
  onActiveFieldChange?: (fieldName: string | null) => void;
  registerTextHandler?: (handler: (text: string) => void) => void;
}

interface ILieu {
  lieuReprise: string;
}

interface IParent {
  nom: string;
  prenoms: TPrenomsForm;
}

interface IVerificationDonneesDecesForm {
  evenement: {
    date: IDateHeureForm;
    lieu: ILieu;
  };
  defunt: {
    nom: string;
    prenoms: TPrenomsForm;
    dateNaissance: IDateHeureForm;
    lieu: ILieu;
    pere: IParent;
    mere: IParent;
  };
  dernierConjoint: {
    nom: string;
    prenoms: TPrenomsForm;
  };
  informationsComplementaires: {
    mentions: Mention[];
    dateCreation: string;
  };
  verificationEffectuee: boolean;
}

const initialiserDate = (jour?: number, mois?: number, annee?: number): IDateHeureForm => {
  return DateHeureFormUtils.valeursDefauts({
    jour: jour?.toString(),
    mois: mois?.toString(),
    annee: annee?.toString()
  });
};

const initialiserPrenoms = (prenoms: string[] | undefined): TPrenomsForm => {
  return PrenomsForm.depuisStringDto(prenoms || []);
};

const InfosParent: React.FC<{
  prefix: string;
  libelleNom: string;
  activeField: string | null;
  onFieldFocus: (fieldName: string) => void;
}> = ({ prefix, libelleNom, activeField, onFieldFocus }) => (
  <div>
    <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === `${prefix}.nom` ? "bg-blue-50 border border-blue-500" : ""}`}>
      <div className="flex justify-between items-center mb-1">
        <label className={`text-xs font-bold uppercase tracking-wider ${activeField === `${prefix}.nom` ? "text-blue-700" : "text-gray-500"}`}>
          {libelleNom}
        </label>
        {activeField === `${prefix}.nom` && <VscUnlock className="w-3 h-3 text-blue-400" />}
      </div>
      <ChampTexte
        name={`${prefix}.nom`}
        libelle=""
        estVerrouillable
        onFocus={() => onFieldFocus(`${prefix}.nom`)}
      />
    </div>
    <div className="mt-2">
      <ChampsPrenoms
        cheminPrenoms={`${prefix}.prenoms`}
        prefixePrenom="prenom"
        estVerrouillable
      />
    </div>
  </div>
);

const VerificationDonneesDecesAmeliore: React.FC<IVerificationDonneesDecesAmelioreProps> = ({
  acte,
  verificationDonneesEffectuee,
  setVerificationDonneesEffectuee,
  miseAJourEffectuee,
  onActiveFieldChange,
  registerTextHandler
}) => {
  if (!acte) return null;

  const [activeField, setActiveField] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const formikRef = useRef<any>(null);

  const defunt = acte.titulaires[0];
  const pere = defunt?.getPere();
  const mere = defunt?.getMere();

  const valeursInitiales: IVerificationDonneesDecesForm = {
    evenement: {
      date: initialiserDate(acte.evenement?.jour, acte.evenement?.mois, acte.evenement?.annee),
      lieu: {
        lieuReprise: acte.evenement?.lieuReprise || ""
      }
    },
    defunt: {
      nom: defunt?.nom || "",
      prenoms: initialiserPrenoms(defunt?.prenoms),
      dateNaissance: initialiserDate(defunt?.naissance?.jour, defunt?.naissance?.mois, defunt?.naissance?.annee),
      lieu: {
        lieuReprise: defunt?.naissance?.lieuReprise || ""
      },
      pere: {
        nom: pere?.nom || "",
        prenoms: initialiserPrenoms(pere?.prenoms)
      },
      mere: {
        nom: mere?.nom || "",
        prenoms: initialiserPrenoms(mere?.prenoms)
      }
    },
    dernierConjoint: {
      nom: defunt?.nomDernierConjoint || "",
      prenoms: initialiserPrenoms(defunt?.prenomsDernierConjoint ? [defunt.prenomsDernierConjoint] : [])
    },
    informationsComplementaires: {
      mentions: acte.mentions || [],
      dateCreation: acte.dateCreation?.format("JJ/MM/AAAA") ?? ""
    },
    verificationEffectuee: verificationDonneesEffectuee
  };

  const handleFieldFocus = (fieldName: string) => {
    setActiveField(fieldName);
    onActiveFieldChange?.(fieldName);
  };

  const handleTextExtracted = (text: string) => {
    if (!activeField || !formikRef.current) {
      setLastAction({ type: "error", message: "Sélectionnez un champ d'abord !" });
      return;
    }

    const fieldType = detectFieldType(activeField);
    let finalValue = convertFrenchTextToValue(text, fieldType);

    // Handle date fields specially
    if (activeField.includes("dateNaissance") || activeField.includes("date")) {
      const parts = activeField.split(".");
      const dateField = parts[parts.length - 1];
      
      if (dateField === "jour") {
        formikRef.current.setFieldValue(activeField, finalValue);
      } else if (dateField === "mois") {
        formikRef.current.setFieldValue(activeField, finalValue);
      } else if (dateField === "annee") {
        formikRef.current.setFieldValue(activeField, finalValue);
      }
    } else {
      formikRef.current.setFieldValue(activeField, finalValue);
    }

    const wasConverted = finalValue !== text;
    setLastAction({
      type: "success",
      message: wasConverted
        ? `Converti : "${text.substring(0, 10)}..." → ${finalValue}`
        : `Copié : "${finalValue.substring(0, 15)}..."`
    });

    // Auto-navigate to next field
    const nextField = getNextField(activeField, CHAMPS_ORDRE_DECES);
    if (nextField) {
      setTimeout(() => {
        const nextInput = document.getElementById(nextField);
        if (nextInput) {
          nextInput.focus();
          handleFieldFocus(nextField);
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => setLastAction(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  // Register text extraction handler with parent
  useEffect(() => {
    if (registerTextHandler) {
      registerTextHandler(handleTextExtracted);
    }
  }, [activeField]);

  return (
    <Formik<IVerificationDonneesDecesForm>
      innerRef={formikRef}
      enableReinitialize
      initialValues={valeursInitiales}
      onSubmit={() => {}}
    >
      {({ values }) => (
        <div className="flex h-[calc(100vh-18rem)] flex-col">
          <div className="space-y-8 overflow-y-auto border border-gray-200 py-6">
            {/* Section Événement */}
            <ConteneurAvecBordure titreEnTete="Événement - Décès">
              <div className="mt-4 space-y-4">
                <ChampDate
                  name="evenement.date"
                  libelle="Date du décès"
                  estVerrouillable
                />
                <div className="grid grid-cols-3 gap-4">
                  <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === "evenement.lieu.lieuReprise" ? "bg-blue-50 border border-blue-500" : ""}`}>
                    <div className="flex justify-between items-center mb-1">
                      <label className={`text-xs font-bold uppercase tracking-wider ${activeField === "evenement.lieu.lieuReprise" ? "text-blue-700" : "text-gray-500"}`}>
                        Lieu événement
                      </label>
                      {activeField === "evenement.lieu.lieuReprise" && <VscUnlock className="w-3 h-3 text-blue-400" />}
                    </div>
                    <ChampTexte
                      name="evenement.lieu.lieuReprise"
                      libelle=""
                      estVerrouillable
                      onFocus={() => handleFieldFocus("evenement.lieu.lieuReprise")}
                    />
                  </div>
                </div>
              </div>
            </ConteneurAvecBordure>
            
            {/* Section Défunt */}
            <ConteneurAvecBordure titreEnTete="Informations de la personne décédée">
              <div className="mt-4 space-y-4">
                <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === "defunt.nom" ? "bg-blue-50 border border-blue-500" : ""}`}>
                  <div className="flex justify-between items-center mb-1">
                    <label className={`text-xs font-bold uppercase tracking-wider ${activeField === "defunt.nom" ? "text-blue-700" : "text-gray-500"}`}>
                      Nom
                    </label>
                    {activeField === "defunt.nom" && <VscUnlock className="w-3 h-3 text-blue-400" />}
                  </div>
                  <ChampTexte
                    name="defunt.nom"
                    libelle=""
                    estVerrouillable
                    onFocus={() => handleFieldFocus("defunt.nom")}
                  />
                </div>
                <ChampsPrenoms
                  cheminPrenoms="defunt.prenoms"
                  prefixePrenom="prenom"
                  estVerrouillable
                />
                <ChampDate
                  name="defunt.dateNaissance"
                  libelle="Date de naissance"
                  estVerrouillable
                />
                <div className="grid grid-cols-3 gap-4">
                  <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === "defunt.lieu.lieuReprise" ? "bg-blue-50 border border-blue-500" : ""}`}>
                    <div className="flex justify-between items-center mb-1">
                      <label className={`text-xs font-bold uppercase tracking-wider ${activeField === "defunt.lieu.lieuReprise" ? "text-blue-700" : "text-gray-500"}`}>
                        Lieu de naissance
                      </label>
                      {activeField === "defunt.lieu.lieuReprise" && <VscUnlock className="w-3 h-3 text-blue-400" />}
                    </div>
                    <ChampTexte
                      name="defunt.lieu.lieuReprise"
                      libelle=""
                      estVerrouillable
                      onFocus={() => handleFieldFocus("defunt.lieu.lieuReprise")}
                    />
                  </div>
                </div>
              </div>
            </ConteneurAvecBordure>
            
            {/* Section Parents du défunt */}
            <ConteneurAvecBordure titreEnTete="Filiation de la personne décédée">
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfosParent
                    prefix="defunt.pere"
                    libelleNom="Nom du père"
                    activeField={activeField}
                    onFieldFocus={handleFieldFocus}
                  />
                  <InfosParent
                    prefix="defunt.mere"
                    libelleNom="Nom de la mère"
                    activeField={activeField}
                    onFieldFocus={handleFieldFocus}
                  />
                </div>
              </div>
            </ConteneurAvecBordure>
            
            {/* Section Dernier conjoint */}
            {(values.dernierConjoint.nom || values.dernierConjoint.prenoms.prenom1) && (
              <ConteneurAvecBordure titreEnTete="Dernier partenaire ou dernier conjoint">
                <div className="mt-4 space-y-4">
                  <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === "dernierConjoint.nom" ? "bg-blue-50 border border-blue-500" : ""}`}>
                    <div className="flex justify-between items-center mb-1">
                      <label className={`text-xs font-bold uppercase tracking-wider ${activeField === "dernierConjoint.nom" ? "text-blue-700" : "text-gray-500"}`}>
                        Nom
                      </label>
                      {activeField === "dernierConjoint.nom" && <VscUnlock className="w-3 h-3 text-blue-400" />}
                    </div>
                    <ChampTexte
                      name="dernierConjoint.nom"
                      libelle=""
                      estVerrouillable
                      onFocus={() => handleFieldFocus("dernierConjoint.nom")}
                    />
                  </div>
                  <ChampsPrenoms
                    cheminPrenoms="dernierConjoint.prenoms"
                    prefixePrenom="prenom"
                    estVerrouillable
                  />
                </div>
              </ConteneurAvecBordure>
            )}
            
            {/* Section Informations complémentaires */}
            <ConteneurAvecBordure titreEnTete="Informations complémentaires">
              <div className="mt-4 space-y-4">
                {values.informationsComplementaires.mentions.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {values.informationsComplementaires.mentions.map((mention, index) => (
                      <ChampTexte
                        key={mention.id}
                        name={`informationsComplementaires.mentionTexte${index}`}
                        libelle={`${index + 1}. ${mention.getTexteCopie()}`}
                        estVerrouillable
                      />
                    ))}
                  </div>
                )}

                <ChampTexte
                  name="informationsComplementaires.dateCreation"
                  libelle="Date de création de l'acte"
                  estVerrouillable
                />
              </div>
            </ConteneurAvecBordure>
            
            <VerifierCaseACocher
              miseAJourEffectuee={miseAJourEffectuee}
              verificationDonneesEffectuee={verificationDonneesEffectuee}
              setVerificationDonneesEffectuee={setVerificationDonneesEffectuee}
            />
          </div>
        </div>
      )}
    </Formik>
  );
};

export default VerificationDonneesDecesAmeliore;

