import ChampDate from "@composants/commun/champs/ChampDate";
import ChampsPrenoms from "@composants/commun/champs/ChampsPrenoms";
import ChampTexte from "@composants/commun/champs/ChampTexte";
import ConteneurAvecBordure from "@composants/commun/conteneurs/formulaire/ConteneurAvecBordure";
import { FicheActe } from "@model/etatcivil/acte/FicheActe";
import { Mention } from "@model/etatcivil/acte/mention/Mention";
import { ELienParente } from "@model/etatcivil/enum/ELienParente";
import { DateHeureFormUtils, IDateHeureForm } from "@model/form/commun/DateForm";
import { PrenomsForm, TPrenomsForm } from "@model/form/commun/PrenomsForm";
import { Formik, FormikProps } from "formik";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { EditionMiseAJourContext } from "../../../../../contexts/EditionMiseAJourContextProvider";
import { convertirTexteFrancaisEnValeur, detecterTypeChamp } from "../../../../../utils/textSelectionUtils";
import { getFieldOrder, getNextFieldSmart } from "./fieldMapping";
import VerifierCaseACocher from "./VerifierCaseACocher";

interface IVerificationDonneesMariageProps {
  acte: FicheActe | null;
  verificationDonneesEffectuee: boolean;
  setVerificationDonneesEffectuee: (value: boolean) => void;
  miseAJourEffectuee: boolean;
}

interface ILieu {
  lieuReprise: string;
}

interface IParent {
  nom: string;
  prenoms: TPrenomsForm;
  profession: string;
  domicile: {
    adresse: string;
  };
}

interface IEpoux {
  nom: string;
  prenoms: TPrenomsForm;
  dateNaissance: IDateHeureForm;
  age: string;
  lieuReprise: ILieu;
  profession: string;
  domicile: {
    adresse: string;
  };
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

const SectionEpoux: React.FC<{
  titre: string;
  prefixe: "epoux1" | "epoux2";
  valeurs: FormikProps<IVerificationDonneesMariageForm>["values"];
  onFocusChamp: (nomChamp: string) => void;
}> = ({ titre, prefixe, valeurs, onFocusChamp }) => (
  <ConteneurAvecBordure titreEnTete={titre}>
    <div className="mt-4 space-y-4">
      <ChampTexte
        name={`${prefixe}.nom`}
        libelle="Nom"
        estVerrouillable
        onFocus={() => onFocusChamp(`${prefixe}.nom`)}
      />
      <ChampsPrenoms
        cheminPrenoms={`${prefixe}.prenoms`}
        prefixePrenom="prenom"
        estVerrouillable
        onFocus={e => onFocusChamp(e.target.id)}
      />
      <div className="grid grid-cols-2 gap-4">
        <ChampDate
          name={`${prefixe}.dateNaissance`}
          libelle="Date de naissance"
          estVerrouillable
          onFocus={e => onFocusChamp(e.target.id)}
        />
        <ChampTexte
          name={`${prefixe}.age`}
          libelle="Âge"
          estVerrouillable
          onFocus={() => onFocusChamp(`${prefixe}.age`)}
        />
      </div>
      <ChampTexte
        name={`${prefixe}.lieuReprise.lieuReprise`}
        libelle="Lieu de naissance"
        estVerrouillable
        onFocus={() => onFocusChamp(`${prefixe}.lieuReprise.lieuReprise`)}
      />
      <div className="grid grid-cols-2 gap-4">
        <ChampTexte
          name={`${prefixe}.profession`}
          libelle="Profession"
          estVerrouillable
          onFocus={() => onFocusChamp(`${prefixe}.profession`)}
        />
        <ChampTexte
          name={`${prefixe}.domicile.adresse`}
          libelle="Domicile"
          estVerrouillable
          onFocus={() => onFocusChamp(`${prefixe}.domicile.adresse`)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* PERE */}
        <div className="space-y-4">
          <ChampTexte
            name={`${prefixe}.pere.nom`}
            libelle="Nom du père"
            estVerrouillable
            onFocus={() => onFocusChamp(`${prefixe}.pere.nom`)}
          />
          <ChampsPrenoms
            cheminPrenoms={`${prefixe}.pere.prenoms`}
            prefixePrenom="prenom"
            estVerrouillable
            onFocus={e => onFocusChamp(e.target.id)}
          />
          <ChampTexte
            name={`${prefixe}.pere.domicile.adresse`}
            libelle="Domicile père"
            estVerrouillable
            onFocus={() => onFocusChamp(`${prefixe}.pere.domicile.adresse`)}
          />
          <ChampTexte
            name={`${prefixe}.pere.profession`}
            libelle="Profession père"
            estVerrouillable
            onFocus={() => onFocusChamp(`${prefixe}.pere.profession`)}
          />
        </div>

        {/* MERE */}
        <div className="space-y-4">
          <ChampTexte
            name={`${prefixe}.mere.nom`}
            libelle="Nom de la mère"
            estVerrouillable
            onFocus={() => onFocusChamp(`${prefixe}.mere.nom`)}
          />
          <ChampsPrenoms
            cheminPrenoms={`${prefixe}.mere.prenoms`}
            prefixePrenom="prenom"
            estVerrouillable
            onFocus={e => onFocusChamp(e.target.id)}
          />
          <ChampTexte
            name={`${prefixe}.mere.domicile.adresse`}
            libelle="Domicile mère"
            estVerrouillable
            onFocus={() => onFocusChamp(`${prefixe}.mere.domicile.adresse`)}
          />
          <ChampTexte
            name={`${prefixe}.mere.profession`}
            libelle="Profession mère"
            estVerrouillable
            onFocus={() => onFocusChamp(`${prefixe}.mere.profession`)}
          />
        </div>
      </div>
      {valeurs[prefixe].adoptePar && (
        <ChampTexte
          name={`${prefixe}.adoptePar`}
          libelle="Adopté par"
          estVerrouillable
          onFocus={() => onFocusChamp(`${prefixe}.adoptePar`)}
        />
      )}
    </div>
  </ConteneurAvecBordure>
);

const VerificationDonneesMariage: React.FC<IVerificationDonneesMariageProps> = ({
  acte,
  verificationDonneesEffectuee,
  setVerificationDonneesEffectuee,
  miseAJourEffectuee
}) => {
  const { enregistrerGestionnaireTexte } = useContext(EditionMiseAJourContext.Actions);
  const [champActif, setChampActif] = useState<string | null>(null);
  const [derniereAction, setDerniereAction] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const refFormulaire = useRef<FormikProps<IVerificationDonneesMariageForm> | null>(null);

  const gererFocusChamp = useCallback((nomChamp: string) => {
    setChampActif(nomChamp);
  }, []);

  const gererExtractionTexte = useCallback(
    (texte: string) => {
      if (!champActif || !refFormulaire.current) {
        setDerniereAction({ type: "error", message: "Sélectionnez un champ d'abord !" });
        return;
      }

      const typeChamp = detecterTypeChamp(champActif);
      let valeurFinale = convertirTexteFrancaisEnValeur(texte, typeChamp);

      refFormulaire.current.setFieldValue(champActif, valeurFinale);

      const aEteConverti = valeurFinale !== texte;
      setDerniereAction({
        type: "success",
        message: aEteConverti ? `Converti : "${texte.substring(0, 10)}" → ${valeurFinale}` : `Copié : "${valeurFinale.substring(0, 15)}"`
      });

      setTimeout(() => {
        const valeursCourantes = refFormulaire.current?.values;
        const champSuivant = getNextFieldSmart(champActif, "MARIAGE", valeursCourantes);

        if (champSuivant) {
          const element = document.getElementById(champSuivant);
          if (element) {
            element.focus();
            gererFocusChamp(champSuivant);
          }
        } else {
          setDerniereAction({
            type: "success",
            message: "✅ Dernier champ atteint !"
          });
        }
      }, 100);
    },
    [champActif, gererFocusChamp]
  );

  useEffect(() => {
    if (!derniereAction) return;

    const timer = setTimeout(() => setDerniereAction(null), 3000);
    return () => clearTimeout(timer);
  }, [derniereAction]);

  useEffect(() => {
    if (enregistrerGestionnaireTexte) {
      enregistrerGestionnaireTexte(gererExtractionTexte);
    }
  }, [enregistrerGestionnaireTexte, gererExtractionTexte]);

  useEffect(() => {
    setTimeout(() => {
      const ordreChamps = getFieldOrder("MARIAGE");
      const premierChamp = ordreChamps[0];
      if (premierChamp) {
        const element = document.getElementById(premierChamp);
        if (element) {
          element.focus();
          gererFocusChamp(premierChamp);
        }
      }
    }, 500);
  }, [gererFocusChamp]);

  if (!acte) return null;

  const epoux1 = acte.titulaires[0];
  const epoux2 = acte.titulaires[1];

  const getParentInfo = (titulaire: typeof epoux1, estMere: boolean) => {
    const parent = estMere ? titulaire?.getMere() : titulaire?.getPere();
    return {
      nom: parent?.nom || "",
      prenoms: PrenomsForm.depuisStringDto(parent?.prenoms || []),
      profession: parent?.profession || "",
      domicile: {
        adresse: [parent?.domicile?.voie, parent?.domicile?.ville, parent?.domicile?.region, parent?.domicile?.pays]
          .filter(Boolean)
          .join(", ")
      }
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
    profession: titulaire?.profession || "",
    domicile: {
      adresse: [titulaire?.domicile?.voie, titulaire?.domicile?.ville, titulaire?.domicile?.region, titulaire?.domicile?.pays]
        .filter(Boolean)
        .join(", ")
    },
    pere: getParentInfo(titulaire, false),
    mere: getParentInfo(titulaire, true),
    adoptePar: getAdoptePar(titulaire)
  });

  const valeursInitiales: IVerificationDonneesMariageForm = useMemo(
    () => ({
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
    }),
    [acte, epoux1, epoux2, verificationDonneesEffectuee]
  );

  return (
    <Formik<IVerificationDonneesMariageForm>
      innerRef={refFormulaire}
      enableReinitialize
      initialValues={valeursInitiales}
      onSubmit={() => {}}
    >
      {({ values }) => (
        <div className="flex h-[calc(100vh-18rem)] flex-col">
          {/* Status bar */}
          <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${champActif ? "animate-pulse bg-green-500" : "bg-gray-400"}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {champActif ? (
                    <>
                      Champ actif: <span className="text-blue-600">{champActif.split(".").pop()}</span>
                    </>
                  ) : (
                    "Cliquez sur un champ pour commencer"
                  )}
                </span>
              </div>
              {derniereAction && (
                <div className={`text-xs font-medium ${derniereAction.type === "success" ? "text-green-600" : "text-red-600"}`}>
                  {derniereAction.message}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8 overflow-y-auto border border-gray-200 py-6">
            {/* Section Événement */}
            <ConteneurAvecBordure titreEnTete="Événement - Mariage">
              <div className="mt-4 space-y-4">
                <ChampDate
                  name="evenement.date"
                  libelle="Date du mariage"
                  estVerrouillable
                  avecHeure
                  onFocus={e => gererFocusChamp(e.target.id)}
                />
                <ChampTexte
                  name="evenement.lieu.lieuReprise"
                  libelle="Lieu événement"
                  estVerrouillable
                  onFocus={() => gererFocusChamp("evenement.lieu.lieuReprise")}
                />
              </div>
            </ConteneurAvecBordure>

            <SectionEpoux
              titre="Informations de l'époux 1"
              prefixe="epoux1"
              valeurs={values}
              onFocusChamp={gererFocusChamp}
            />

            <SectionEpoux
              titre="Informations de l'époux 2"
              prefixe="epoux2"
              valeurs={values}
              onFocusChamp={gererFocusChamp}
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
                      onFocus={() => gererFocusChamp("contratMariage.existenceContrat")}
                    />
                  )}
                  {values.contratMariage.enonciations && (
                    <ChampTexte
                      name="contratMariage.enonciations"
                      libelle="Énonciations relatives au contrat de mariage"
                      estVerrouillable
                      onFocus={() => gererFocusChamp("contratMariage.enonciations")}
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
                  onFocus={() => gererFocusChamp("informationsComplementaires.dateCreation")}
                />
                {values.informationsComplementaires.mentions.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {values.informationsComplementaires.mentions.map((mention, index) => (
                      <ChampTexte
                        key={mention.id}
                        name={`informationsComplementaires.mentionTexte${index}`}
                        libelle={`${index + 1}. ${mention.getTexteCopie()}`}
                        estVerrouillable
                        onFocus={() => gererFocusChamp(`informationsComplementaires.mentionTexte${index}`)}
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

export default VerificationDonneesMariage;
