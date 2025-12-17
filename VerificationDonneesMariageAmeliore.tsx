import ChampDate from "@composants/commun/champs/ChampDate";
import ChampTexte from "@composants/commun/champs/ChampTexte";
import ChampsPrenoms from "@composants/commun/champs/ChampsPrenoms";
import ConteneurAvecBordure from "@composants/commun/conteneurs/formulaire/ConteneurAvecBordure";
import { FicheActe } from "@model/etatcivil/acte/FicheActe";
import { Mention } from "@model/etatcivil/acte/mention/Mention";
import { ELienParente } from "@model/etatcivil/enum/ELienParente";
import { DateHeureFormUtils, IDateHeureForm } from "@model/form/commun/DateForm";
import { PrenomsForm, TPrenomsForm } from "@model/form/commun/PrenomsForm";
import { Formik, FormikProps } from "formik";
import React, { useEffect, useRef, useState } from "react";
import { VscUnlock } from "react-icons/vsc";
import { convertFrenchTextToValue, detectFieldType } from "../../../../../utils/textSelectionUtils";
import { CHAMPS_ORDRE_MARIAGE, getNextField } from "./fieldMapping";
import VerifierCaseACocher from "./VerifierCaseACocher";

interface IVerificationDonneesMariageAmelioreProps {
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

interface IEpoux {
  nom: string;
  prenoms: TPrenomsForm;
  dateNaissance: IDateHeureForm;
  age: string;
  lieuReprise: ILieu;
  pere: IParent;
  mere: IParent;
  adoptePar: string;
}

interface IVerificationDonneesMariageForm {
  evenement: {
    date: IDateHeureForm;
    lieu: ILieu;
  };
  epoux1: IEpoux;
  epoux2: IEpoux;
  contratMariage: {
    existenceContrat: string;
    enonciations: string;
  };
  informationsComplementaires: {
    mentions: Mention[];
    dateCreation: string;
  };
  verificationEffectuee: boolean;
}

const EpouxSection: React.FC<{
  titre: string;
  prefix: "epoux1" | "epoux2";
  values: FormikProps<IVerificationDonneesMariageForm>["values"];
  activeField: string | null;
  onFieldFocus: (fieldName: string) => void;
}> = ({ titre, prefix, values, activeField, onFieldFocus }) => (
  <ConteneurAvecBordure titreEnTete={titre}>
    <div className="mt-4 space-y-4">
      <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === `${prefix}.nom` ? "bg-blue-50 border border-blue-500" : ""}`}>
        <div className="flex justify-between items-center mb-1">
          <label className={`text-xs font-bold uppercase tracking-wider ${activeField === `${prefix}.nom` ? "text-blue-700" : "text-gray-500"}`}>
            Nom
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
      <ChampsPrenoms
        cheminPrenoms={`${prefix}.prenoms`}
        prefixePrenom="prenom"
        estVerrouillable
      />
      <div className="grid grid-cols-2 gap-4">
        <ChampDate
          name={`${prefix}.dateNaissance`}
          libelle="Date de naissance"
          estVerrouillable
        />
        <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === `${prefix}.age` ? "bg-blue-50 border border-blue-500" : ""}`}>
          <div className="flex justify-between items-center mb-1">
            <label className={`text-xs font-bold uppercase tracking-wider ${activeField === `${prefix}.age` ? "text-blue-700" : "text-gray-500"}`}>
              Âge
            </label>
            {activeField === `${prefix}.age` && <VscUnlock className="w-3 h-3 text-blue-400" />}
          </div>
          <ChampTexte
            name={`${prefix}.age`}
            libelle=""
            estVerrouillable
            onFocus={() => onFieldFocus(`${prefix}.age`)}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === `${prefix}.lieuReprise.lieuReprise` ? "bg-blue-50 border border-blue-500" : ""}`}>
          <div className="flex justify-between items-center mb-1">
            <label className={`text-xs font-bold uppercase tracking-wider ${activeField === `${prefix}.lieuReprise.lieuReprise` ? "text-blue-700" : "text-gray-500"}`}>
              Lieu de naissance
            </label>
            {activeField === `${prefix}.lieuReprise.lieuReprise` && <VscUnlock className="w-3 h-3 text-blue-400" />}
          </div>
          <ChampTexte
            name={`${prefix}.lieuReprise.lieuReprise`}
            libelle=""
            estVerrouillable
            onFocus={() => onFieldFocus(`${prefix}.lieuReprise.lieuReprise`)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === `${prefix}.pere.nom` ? "bg-blue-50 border border-blue-500" : ""}`}>
            <div className="flex justify-between items-center mb-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${activeField === `${prefix}.pere.nom` ? "text-blue-700" : "text-gray-500"}`}>
                Nom du père
              </label>
              {activeField === `${prefix}.pere.nom` && <VscUnlock className="w-3 h-3 text-blue-400" />}
            </div>
            <ChampTexte
              name={`${prefix}.pere.nom`}
              libelle=""
              estVerrouillable
              onFocus={() => onFieldFocus(`${prefix}.pere.nom`)}
            />
          </div>
          <div className="mt-2">
            <ChampsPrenoms
              cheminPrenoms={`${prefix}.pere.prenoms`}
              prefixePrenom="prenom"
              estVerrouillable
            />
          </div>
        </div>
        <div>
          <div className={`transition-all duration-200 rounded-lg p-3 ${activeField === `${prefix}.mere.nom` ? "bg-blue-50 border border-blue-500" : ""}`}>
            <div className="flex justify-between items-center mb-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${activeField === `${prefix}.mere.nom` ? "text-blue-700" : "text-gray-500"}`}>
                Nom de la mère
              </label>
              {activeField === `${prefix}.mere.nom` && <VscUnlock className="w-3 h-3 text-blue-400" />}
            </div>
            <ChampTexte
              name={`${prefix}.mere.nom`}
              libelle=""
              estVerrouillable
              onFocus={() => onFieldFocus(`${prefix}.mere.nom`)}
            />
          </div>
          <div className="mt-2">
            <ChampsPrenoms
              cheminPrenoms={`${prefix}.mere.prenoms`}
              prefixePrenom="prenom"
              estVerrouillable
            />
          </div>
        </div>
      </div>
      {values[prefix].adoptePar && (
        <ChampTexte
          name={`${prefix}.adoptePar`}
          libelle="Adopté par"
          estVerrouillable
        />
      )}
    </div>
  </ConteneurAvecBordure>
);

const VerificationDonneesMariageAmeliore: React.FC<IVerificationDonneesMariageAmelioreProps> = ({
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
  const formikRef = useRef<FormikProps<IVerificationDonneesMariageForm> | null>(null);

  const epoux1 = acte.titulaires[0];
  const epoux2 = acte.titulaires[1];

  const getParentInfo = (titulaire: typeof epoux1, isMere: boolean) => {
    const parent = isMere ? titulaire?.getMere() : titulaire?.getPere();
    return {
      nom: parent?.nom || "",
      prenoms: PrenomsForm.depuisStringDto(parent?.prenoms || [])
    };
  };

  const getAdoptePar = (titulaire: typeof epoux1) => {
    const parentsAdoptants = titulaire?.filiations.filter(
      f => f.lienParente === ELienParente.PARENT_ADOPTANT || f.lienParente === ELienParente.ADOPTANT_CONJOINT_DU_PARENT
    );
    if (!parentsAdoptants || parentsAdoptants.length === 0) return "";
    return parentsAdoptants.map(p => `${p.prenoms.join(" ")} ${p.nom || ""}`.trim()).join(", ");
  };

  const getEpouxInfo = (titulaire: typeof epoux1): IEpoux => ({
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
    pere: getParentInfo(titulaire, false),
    mere: getParentInfo(titulaire, true),
    adoptePar: getAdoptePar(titulaire)
  });

  const valeursInitiales: IVerificationDonneesMariageForm = {
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
    const nextField = getNextField(activeField, CHAMPS_ORDRE_MARIAGE);
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
    <Formik<IVerificationDonneesMariageForm>
      innerRef={formikRef}
      enableReinitialize
      initialValues={valeursInitiales}
      onSubmit={() => {}}
    >
      {({ values }) => (
        <div className="flex h-[calc(100vh-18rem)] flex-col">
          <div className="space-y-8 overflow-y-auto border border-gray-200 py-6">
            {/* Section Événement */}
            <ConteneurAvecBordure titreEnTete="Événement - Mariage">
              <div className="mt-4 space-y-4">
                <ChampDate
                  name="evenement.date"
                  libelle="Date du mariage"
                  estVerrouillable
                  avecHeure
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

            <EpouxSection
              titre="Informations de l'époux 1"
              prefix="epoux1"
              values={values}
              activeField={activeField}
              onFieldFocus={handleFieldFocus}
            />

            <EpouxSection
              titre="Informations de l'époux 2"
              prefix="epoux2"
              values={values}
              activeField={activeField}
              onFieldFocus={handleFieldFocus}
            />

            {/* Section Contrat de mariage */}
            {(values.contratMariage.existenceContrat || values.contratMariage.enonciations) && (
              <ConteneurAvecBordure titreEnTete="Contrat de mariage">
                <div className="mt-4 space-y-4">
                  {values.contratMariage.existenceContrat && (
                    <ChampTexte
                      name="contratMariage.existenceContrat"
                      libelle="Existence d'un contrat"
                      estVerrouillable
                    />
                  )}
                  {values.contratMariage.enonciations && (
                    <ChampTexte
                      name="contratMariage.enonciations"
                      libelle="Énonciations relatives au contrat de mariage"
                      estVerrouillable
                    />
                  )}
                </div>
              </ConteneurAvecBordure>
            )}

            {/* Section Informations complémentaires */}
            <ConteneurAvecBordure titreEnTete="Informations complémentaires">
              <div className="mt-4 space-y-4">
                <ChampTexte
                  name="informationsComplementaires.dateCreation"
                  libelle="Date de création de l'acte"
                  estVerrouillable
                />
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

export default VerificationDonneesMariageAmeliore;

