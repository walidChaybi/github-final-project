import ChampDate from "@composants/commun/champs/ChampDate";
import ChampTexte from "@composants/commun/champs/ChampTexte";
import ChampsPrenoms from "@composants/commun/champs/ChampsPrenoms";
import ConteneurAvecBordure from "@composants/commun/conteneurs/formulaire/ConteneurAvecBordure";
import { FicheActe } from "@model/etatcivil/acte/FicheActe";
import { Mention } from "@model/etatcivil/acte/mention/Mention";
import { ESexe } from "@model/etatcivil/enum/Sexe";
import { DateHeureFormUtils, IDateHeureForm } from "@model/form/commun/DateForm";
import { PrenomsForm, TPrenomsForm } from "@model/form/commun/PrenomsForm";
import { Formik } from "formik";
import React, { useEffect, useRef, useState } from "react";
import { VscUnlock } from "react-icons/vsc";
import { convertFrenchTextToValue, detectFieldType } from "../../../../../utils/textSelectionUtils";
import { CHAMPS_ORDRE_NAISSANCE, getNextField } from "./fieldMapping";
import VerifierCaseACocher from "./VerifierCaseACocher";

interface IVerificationDonneesNaissanceAmelioreProps {
  acte: FicheActe | null;
  verificationDonneesEffectuee: boolean;
  setVerificationDonneesEffectuee: (value: boolean) => void;
  miseAJourEffectuee: boolean;
  onActiveFieldChange?: (fieldName: string | null) => void;
  registerTextHandler?: (handler: (text: string) => void) => void;
}

interface ILieuNaissance {
  lieuReprise: string;
}

interface IVerificationDonneesForm {
  titulaire: {
    nom: string;
    nomPartie1: string;
    nomPartie2: string;
    prenoms: TPrenomsForm;
    dateNaissance: IDateHeureForm;
    lieuNaissance: ILieuNaissance;
    sexe: keyof typeof ESexe;
  };
  parent1: {
    nom: string;
    prenoms: TPrenomsForm;
    dateNaissance: IDateHeureForm;
    age: string;
    lieuNaissance: ILieuNaissance;
  };
  parent2: {
    nom: string;
    prenoms: TPrenomsForm;
    dateNaissance: IDateHeureForm;
    age: string;
    lieuNaissance: ILieuNaissance;
  };
  informationsComplementaires: {
    nationalite: string;
    mentions: Mention[];
    dateCreation: string;
  };
  verificationEffectuee: boolean;
}

const VerificationDonneesNaissanceAmeliore: React.FC<IVerificationDonneesNaissanceAmelioreProps> = ({
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

  const titulaire = acte.titulaires[0];
  const parent1 = titulaire?.getParent1();
  const parent2 = titulaire?.getParent2();

  const valeursInitiales: IVerificationDonneesForm = {
    titulaire: {
      nom: titulaire?.nom || "",
      nomPartie1: titulaire?.nomPartie1 || "",
      nomPartie2: titulaire?.nomPartie2 || "",
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
      sexe: (titulaire?.sexe as keyof typeof ESexe) || ""
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
      }
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
      }
    },
    informationsComplementaires: {
      nationalite: "Français",
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
    const nextField = getNextField(activeField, CHAMPS_ORDRE_NAISSANCE);
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
    <Formik<IVerificationDonneesForm>
      innerRef={formikRef}
      enableReinitialize
      initialValues={valeursInitiales}
      onSubmit={() => {}}
    >
      {({ values }) => (
        <div className="flex h-[calc(100vh-18rem)] flex-col">
          <div className="space-y-8 overflow-y-auto border border-gray-200 py-6">
            {/* Section Titulaire */}
            <ConteneurAvecBordure titreEnTete="Titulaire">
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === "titulaire.nom" ? "bg-blue-50 border border-blue-500" : ""}`}>
                    <div className="flex justify-between items-center mb-1">
                      <label className={`text-xs font-bold uppercase tracking-wider ${activeField === "titulaire.nom" ? "text-blue-700" : "text-gray-500"}`}>
                        Nom du titulaire
                      </label>
                      {activeField === "titulaire.nom" && <VscUnlock className="w-3 h-3 text-blue-400" />}
                    </div>
                    <ChampTexte
                      name="titulaire.nom"
                      libelle=""
                      estVerrouillable
                      onFocus={() => handleFieldFocus("titulaire.nom")}
                    />
                  </div>
                  <ChampTexte
                    name="titulaire.sexe"
                    libelle="Sexe"
                    estVerrouillable
                  />
                </div>

                <ChampsPrenoms
                  cheminPrenoms="titulaire.prenoms"
                  prefixePrenom="prenom"
                  estVerrouillable
                />

                <div className="grid grid-cols-2 gap-4">
                  <ChampDate
                    name="titulaire.dateNaissance"
                    libelle="Date et heure de naissance"
                    avecHeure
                    estVerrouillable
                  />
                  <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === "titulaire.lieuNaissance.lieuReprise" ? "bg-blue-50 border border-blue-500" : ""}`}>
                    <div className="flex justify-between items-center mb-1">
                      <label className={`text-xs font-bold uppercase tracking-wider ${activeField === "titulaire.lieuNaissance.lieuReprise" ? "text-blue-700" : "text-gray-500"}`}>
                        Lieu naissance
                      </label>
                      {activeField === "titulaire.lieuNaissance.lieuReprise" && <VscUnlock className="w-3 h-3 text-blue-400" />}
                    </div>
                    <ChampTexte
                      name="titulaire.lieuNaissance.lieuReprise"
                      libelle=""
                      estVerrouillable
                      onFocus={() => handleFieldFocus("titulaire.lieuNaissance.lieuReprise")}
                    />
                  </div>
                </div>
              </div>
            </ConteneurAvecBordure>

            {/* Section Parent 1 */}
            {parent1 && (
              <ConteneurAvecBordure titreEnTete="Informations du parent 1">
                <div className="mt-4 space-y-4">
                  <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === "parent1.nom" ? "bg-blue-50 border border-blue-500" : ""}`}>
                    <div className="flex justify-between items-center mb-1">
                      <label className={`text-xs font-bold uppercase tracking-wider ${activeField === "parent1.nom" ? "text-blue-700" : "text-gray-500"}`}>
                        Nom
                      </label>
                      {activeField === "parent1.nom" && <VscUnlock className="w-3 h-3 text-blue-400" />}
                    </div>
                    <ChampTexte
                      name="parent1.nom"
                      libelle=""
                      estVerrouillable
                      onFocus={() => handleFieldFocus("parent1.nom")}
                    />
                  </div>

                  <ChampsPrenoms
                    cheminPrenoms="parent1.prenoms"
                    prefixePrenom="prenom"
                    estVerrouillable
                  />

                  <div className="grid grid-cols-2 items-start gap-4">
                    <ChampDate
                      name="parent1.dateNaissance"
                      libelle="Date de naissance"
                      estVerrouillable
                    />

                    <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === "parent1.age" ? "bg-blue-50 border border-blue-500" : ""}`}>
                      <div className="flex justify-between items-center mb-1">
                        <label className={`text-xs font-bold uppercase tracking-wider ${activeField === "parent1.age" ? "text-blue-700" : "text-gray-500"}`}>
                          Âge
                        </label>
                        {activeField === "parent1.age" && <VscUnlock className="w-3 h-3 text-blue-400" />}
                      </div>
                      <ChampTexte
                        name="parent1.age"
                        libelle=""
                        estVerrouillable
                        onFocus={() => handleFieldFocus("parent1.age")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === "parent1.lieuNaissance.lieuReprise" ? "bg-blue-50 border border-blue-500" : ""}`}>
                      <div className="flex justify-between items-center mb-1">
                        <label className={`text-xs font-bold uppercase tracking-wider ${activeField === "parent1.lieuNaissance.lieuReprise" ? "text-blue-700" : "text-gray-500"}`}>
                          Lieu naissance
                        </label>
                        {activeField === "parent1.lieuNaissance.lieuReprise" && <VscUnlock className="w-3 h-3 text-blue-400" />}
                      </div>
                      <ChampTexte
                        name="parent1.lieuNaissance.lieuReprise"
                        libelle=""
                        estVerrouillable
                        onFocus={() => handleFieldFocus("parent1.lieuNaissance.lieuReprise")}
                      />
                    </div>
                  </div>
                </div>
              </ConteneurAvecBordure>
            )}

            {/* Section Parent 2 */}
            {parent2 && (
              <ConteneurAvecBordure titreEnTete="Informations du parent 2">
                <div className="mt-4 space-y-4">
                  <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === "parent2.nom" ? "bg-blue-50 border border-blue-500" : ""}`}>
                    <div className="flex justify-between items-center mb-1">
                      <label className={`text-xs font-bold uppercase tracking-wider ${activeField === "parent2.nom" ? "text-blue-700" : "text-gray-500"}`}>
                        Nom
                      </label>
                      {activeField === "parent2.nom" && <VscUnlock className="w-3 h-3 text-blue-400" />}
                    </div>
                    <ChampTexte
                      name="parent2.nom"
                      libelle=""
                      estVerrouillable
                      onFocus={() => handleFieldFocus("parent2.nom")}
                    />
                  </div>

                  <ChampsPrenoms
                    cheminPrenoms="parent2.prenoms"
                    prefixePrenom="prenom"
                    estVerrouillable
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <ChampDate
                      name="parent2.dateNaissance"
                      libelle="Date de naissance"
                      estVerrouillable
                    />

                    <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === "parent2.age" ? "bg-blue-50 border border-blue-500" : ""}`}>
                      <div className="flex justify-between items-center mb-1">
                        <label className={`text-xs font-bold uppercase tracking-wider ${activeField === "parent2.age" ? "text-blue-700" : "text-gray-500"}`}>
                          Âge
                        </label>
                        {activeField === "parent2.age" && <VscUnlock className="w-3 h-3 text-blue-400" />}
                      </div>
                      <ChampTexte
                        name="parent2.age"
                        libelle=""
                        estVerrouillable
                        onFocus={() => handleFieldFocus("parent2.age")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === "parent2.lieuNaissance.lieuReprise" ? "bg-blue-50 border border-blue-500" : ""}`}>
                      <div className="flex justify-between items-center mb-1">
                        <label className={`text-xs font-bold uppercase tracking-wider ${activeField === "parent2.lieuNaissance.lieuReprise" ? "text-blue-700" : "text-gray-500"}`}>
                          Lieu naissance
                        </label>
                        {activeField === "parent2.lieuNaissance.lieuReprise" && <VscUnlock className="w-3 h-3 text-blue-400" />}
                      </div>
                      <ChampTexte
                        name="parent2.lieuNaissance.lieuReprise"
                        libelle=""
                        estVerrouillable
                        onFocus={() => handleFieldFocus("parent2.lieuNaissance.lieuReprise")}
                      />
                    </div>
                  </div>
                </div>
              </ConteneurAvecBordure>
            )}

            {/* Section Informations complémentaires */}
            <ConteneurAvecBordure titreEnTete="Informations complémentaires">
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ChampTexte
                    name="informationsComplementaires.nationalite"
                    libelle="Nationalité"
                    estVerrouillable
                  />
                  <ChampTexte
                    name="informationsComplementaires.dateCreation"
                    libelle="Date de création de l'acte"
                    estVerrouillable
                  />
                </div>

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

export default VerificationDonneesNaissanceAmeliore;

