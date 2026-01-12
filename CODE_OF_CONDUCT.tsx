import ChampDate from "@composants/commun/champs/ChampDate";
import ChampsPrenoms from "@composants/commun/champs/ChampsPrenoms";
import ChampTexte from "@composants/commun/champs/ChampTexte";
import ConteneurAvecBordure from "@composants/commun/conteneurs/formulaire/ConteneurAvecBordure";
import { FicheActe } from "@model/etatcivil/acte/FicheActe";
import { IVerificationDonneesNaissanceForm, MiseAJourModificationForm } from "@model/form/miseAJour/MiseAJourModificationForm";
import { Formik } from "formik";
import React, { useEffect, useMemo } from "react";
import { useVerificationFormulaire } from "../../../../../hooks/requetesMiseAJour/VerificationFormulaireHook";
import BarreStatutVerification from "./BarreStatutVerification";
import VerifierCaseACocher from "./VerifierCaseACocher";

interface IVerificationDonneesNaissanceProps {
  acte: FicheActe;
  miseAJourEffectuee: boolean;
  verificationDonneesEffectuee: boolean;
  setVerificationDonneesEffectuee: (value: boolean) => void;
  onValeursChange: (valeurs: IVerificationDonneesNaissanceForm) => void;
}

const VerificationDonneesNaissance: React.FC<IVerificationDonneesNaissanceProps> = ({
  acte,
  miseAJourEffectuee,
  verificationDonneesEffectuee,
  setVerificationDonneesEffectuee,
  onValeursChange
}) => {
  const { champActif, derniereAction, gererFocusChamp } = useVerificationFormulaire();

  const valeursInitiales = useMemo(
    () => MiseAJourModificationForm.valeursInitiales(acte, verificationDonneesEffectuee).naissance,
    [acte, verificationDonneesEffectuee]
  );

  return (
    <Formik<IVerificationDonneesNaissanceForm>
      enableReinitialize
      initialValues={valeursInitiales}
      onSubmit={() => {}}
    >
      {({ values }) => {
        // Synchroniser les valeurs avec le parent
        useEffect(() => {
          onValeursChange(values);
        }, [values]);

        return (
          <div
            className="flex h-[calc(100vh-18rem)] flex-col"
            onFocus={e => gererFocusChamp(e.target.id)}
          >
            <BarreStatutVerification
              champActif={champActif}
              derniereAction={derniereAction}
            />

            <div className="space-y-8 overflow-y-auto border border-gray-200 py-6">
              <ConteneurAvecBordure titreEnTete="Titulaire">
                <div className="mt-4 space-y-4">
                  <ChampTexte
                    name="titulaire.nom"
                    libelle="Nom du titulaire"
                  />
                  <ChampsPrenoms
                    cheminPrenoms="titulaire.prenoms"
                    prefixePrenom="prenom"
                  />
                  <ChampTexte
                    name="titulaire.sexe"
                    libelle="Sexe"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <ChampDate
                      libelle="Date et heure de naissance"
                      name="titulaire.dateNaissance"
                      avecHeure
                    />
                    <ChampTexte
                      name="titulaire.lieuNaissance.lieuReprise"
                      libelle="Lieu naissance"
                    />
                  </div>
                </div>
              </ConteneurAvecBordure>

              <ConteneurAvecBordure titreEnTete="Informations du parent 1">
                <div className="mt-4 space-y-4">
                  <ChampTexte
                    name="parent1.nom"
                    libelle="Nom"
                  />
                  <ChampsPrenoms
                    cheminPrenoms="parent1.prenoms"
                    prefixePrenom="prenom"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <ChampDate
                      name="parent1.dateNaissance"
                      libelle="Date de naissance"
                    />
                    <ChampTexte
                      name="parent1.age"
                      libelle="Âge"
                      placeholder="Ex: 25 ans"
                      numerique
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <ChampTexte
                      name="parent1.lieuNaissance.lieuReprise"
                      libelle="Lieu naissance"
                    />
                    <ChampTexte
                      name="parent1.profession"
                      libelle="Profession"
                    />
                  </div>
                </div>
              </ConteneurAvecBordure>

              <ConteneurAvecBordure titreEnTete="Informations du parent 2">
                <div className="mt-4 space-y-4">
                  <ChampTexte
                    name="parent2.nom"
                    libelle="Nom"
                  />
                  <ChampsPrenoms
                    cheminPrenoms="parent2.prenoms"
                    prefixePrenom="prenom"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <ChampDate
                      name="parent2.dateNaissance"
                      libelle="Date de naissance"
                    />
                    <ChampTexte
                      name="parent2.age"
                      libelle="Âge"
                      placeholder="Ex: 30 ans"
                      numerique
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <ChampTexte
                      name="parent2.lieuNaissance.lieuReprise"
                      libelle="Lieu naissance"
                    />
                    <ChampTexte
                      name="parent2.profession"
                      libelle="Profession"
                    />
                  </div>
                </div>
              </ConteneurAvecBordure>

              <ConteneurAvecBordure titreEnTete="Déclarant">
                <div className="mt-4 space-y-4">
                  <ChampTexte
                    name="declarant.identiteDeclarant"
                    libelle="Déclarant"
                  />
                </div>
              </ConteneurAvecBordure>

              <ConteneurAvecBordure titreEnTete="Adresse du titulaire">
                <div className="mt-4 space-y-4">
                  <ChampTexte
                    name="adresseTitulaire.adresse"
                    libelle="Adresse"
                  />
                </div>
              </ConteneurAvecBordure>

              <ConteneurAvecBordure titreEnTete="Informations complémentaires">
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <ChampTexte
                      name="informationsComplementaires.francaisPar"
                      libelle={values.titulaire.sexe === "FEMININ" ? "Française Par" : "Français Par"}
                    />
                    <ChampTexte
                      name="informationsComplementaires.dateCreation"
                      libelle="Date de création de l'acte"
                    />
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
        );
      }}
    </Formik>
  );
};

export default VerificationDonneesNaissance;
