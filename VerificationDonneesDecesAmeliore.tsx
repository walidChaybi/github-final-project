import ChampDate from "@composants/commun/champs/ChampDate";
import ChampsPrenoms from "@composants/commun/champs/ChampsPrenoms";
import ChampTexte from "@composants/commun/champs/ChampTexte";
import ConteneurAvecBordure from "@composants/commun/conteneurs/formulaire/ConteneurAvecBordure";
import { FicheActe } from "@model/etatcivil/acte/FicheActe";
import { Mention } from "@model/etatcivil/acte/mention/Mention";
import { DateHeureFormUtils, IDateHeureForm } from "@model/form/commun/DateForm";
import { PrenomsForm, TPrenomsForm } from "@model/form/commun/PrenomsForm";
import { Formik } from "formik";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { EditionMiseAJourContext } from "../../../../../contexts/EditionMiseAJourContextProvider";
import { convertirTexteFrancaisEnValeur, detecterTypeChamp } from "../../../../../utils/textSelectionUtils";
import { getFieldOrder, getNextFieldSmart } from "./fieldMapping";
import VerifierCaseACocher from "./VerifierCaseACocher";

interface IVerificationDonneesDecesProps {
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
    profession: string;
    domicile: {
      adresse: string;
    };
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

const InfosParent: React.FC<{
  prefixe: string;
  libelleNom: string;
  onFocusChamp: (nomChamp: string) => void;
}> = ({ prefixe, libelleNom, onFocusChamp }) => (
  <div className="space-y-4">
    <ChampTexte
      name={`${prefixe}.nom`}
      libelle={libelleNom}
      estVerrouillable
      onFocus={() => onFocusChamp(`${prefixe}.nom`)}
    />
    <ChampsPrenoms
      cheminPrenoms={`${prefixe}.prenoms`}
      prefixePrenom="prenom"
      estVerrouillable
      onFocus={e => onFocusChamp(e.target.id)}
    />
    <ChampTexte
      name={`${prefixe}.domicile.adresse`}
      libelle="Domicile"
      estVerrouillable
      onFocus={() => onFocusChamp(`${prefixe}.domicile.adresse`)}
    />
    <ChampTexte
      name={`${prefixe}.profession`}
      libelle="Profession"
      estVerrouillable
      onFocus={() => onFocusChamp(`${prefixe}.profession`)}
    />
  </div>
);

const VerificationDonneesDeces: React.FC<IVerificationDonneesDecesProps> = ({
  acte,
  verificationDonneesEffectuee,
  setVerificationDonneesEffectuee,
  miseAJourEffectuee
}) => {
  const { enregistrerGestionnaireTexte } = useContext(EditionMiseAJourContext.Actions);
  const [champActif, setChampActif] = useState<string | null>(null);
  const [derniereAction, setDerniereAction] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const refFormulaire = useRef<any>(null);

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
        const valeursCourantes = refFormulaire.current.values;
        const champSuivant = getNextFieldSmart(champActif, "DECES", valeursCourantes);

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
      const ordreChamps = getFieldOrder("DECES");
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

  const defunt = acte.titulaires[0];
  const pere = defunt?.getPere();
  const mere = defunt?.getMere();

  const valeursInitiales: IVerificationDonneesDecesForm = useMemo(
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
        domicile: {
          adresse: [defunt?.domicile?.voie, defunt?.domicile?.ville, defunt?.domicile?.region, defunt?.domicile?.pays]
            .filter(Boolean)
            .join(", ")
        },
        pere: {
          nom: pere?.nom || "",
          prenoms: PrenomsForm.depuisStringDto(pere?.prenoms || []),
          profession: pere?.profession || "",
          domicile: {
            adresse: [pere?.domicile?.voie, pere?.domicile?.ville, pere?.domicile?.region, pere?.domicile?.pays].filter(Boolean).join(", ")
          }
        },
        mere: {
          nom: mere?.nom || "",
          prenoms: PrenomsForm.depuisStringDto(mere?.prenoms || []),
          profession: mere?.profession || "",
          domicile: {
            adresse: [mere?.domicile?.voie, mere?.domicile?.ville, mere?.domicile?.region, mere?.domicile?.pays].filter(Boolean).join(", ")
          }
        }
      },
      dernierConjoint: {
        nom: defunt?.nomDernierConjoint || "",
        prenoms: PrenomsForm.depuisStringDto(defunt?.prenomsDernierConjoint ? [defunt.prenomsDernierConjoint] : [])
      },
      informationsComplementaires: {
        mentions: acte.mentions || [],
        dateCreation: acte.dateCreation?.format("JJ/MM/AAAA") ?? ""
      },
      verificationEffectuee: verificationDonneesEffectuee
    }),
    [acte, defunt, pere, mere, verificationDonneesEffectuee]
  );

  return (
    <Formik<IVerificationDonneesDecesForm>
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
            <ConteneurAvecBordure titreEnTete="Événement - Décès">
              <div className="mt-4 space-y-4">
                <ChampDate
                  name="evenement.date"
                  libelle="Date du décès"
                  estVerrouillable
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

            {/* Section Défunt */}
            <ConteneurAvecBordure titreEnTete="Informations de la personne décédée">
              <div className="mt-4 space-y-4">
                <ChampTexte
                  name="defunt.nom"
                  libelle="Nom"
                  estVerrouillable
                  onFocus={() => gererFocusChamp("defunt.nom")}
                />
                <ChampsPrenoms
                  cheminPrenoms="defunt.prenoms"
                  prefixePrenom="prenom"
                  estVerrouillable
                  onFocus={e => gererFocusChamp(e.target.id)}
                />
                <ChampDate
                  name="defunt.dateNaissance"
                  libelle="Date de naissance"
                  estVerrouillable
                  onFocus={e => gererFocusChamp(e.target.id)}
                />
                <ChampTexte
                  name="defunt.lieu.lieuReprise"
                  libelle="Lieu de naissance"
                  estVerrouillable
                  onFocus={() => gererFocusChamp("defunt.lieu.lieuReprise")}
                />
                <div className="grid grid-cols-2 gap-4">
                  <ChampTexte
                    name="defunt.profession"
                    libelle="Profession"
                    estVerrouillable
                    onFocus={() => gererFocusChamp("defunt.profession")}
                  />
                  <ChampTexte
                    name="defunt.domicile.adresse"
                    libelle="Domicile"
                    estVerrouillable
                    onFocus={() => gererFocusChamp("defunt.domicile.adresse")}
                  />
                </div>
              </div>
            </ConteneurAvecBordure>

            {/* Section Parents du défunt */}
            <ConteneurAvecBordure titreEnTete="Filiation de la personne décédée">
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfosParent
                    prefixe="defunt.pere"
                    libelleNom="Nom du père"
                    onFocusChamp={gererFocusChamp}
                  />
                  <InfosParent
                    prefixe="defunt.mere"
                    libelleNom="Nom de la mère"
                    onFocusChamp={gererFocusChamp}
                  />
                </div>
              </div>
            </ConteneurAvecBordure>

            {/* Section Dernier conjoint */}
            {(values.dernierConjoint.nom || values.dernierConjoint.prenoms.prenom1) && (
              <ConteneurAvecBordure titreEnTete="Dernier partenaire ou dernier conjoint">
                <div className="mt-4 space-y-4">
                  <ChampTexte
                    name="dernierConjoint.nom"
                    libelle="Nom"
                    estVerrouillable
                    onFocus={() => gererFocusChamp("dernierConjoint.nom")}
                  />
                  <ChampsPrenoms
                    cheminPrenoms="dernierConjoint.prenoms"
                    prefixePrenom="prenom"
                    estVerrouillable
                    onFocus={e => gererFocusChamp(e.target.id)}
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
                        onFocus={() => gererFocusChamp(`informationsComplementaires.mentionTexte${index}`)}
                      />
                    ))}
                  </div>
                )}

                <ChampTexte
                  name="informationsComplementaires.dateCreation"
                  libelle="Date de création de l'acte"
                  estVerrouillable
                  onFocus={() => gererFocusChamp("informationsComplementaires.dateCreation")}
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

export default VerificationDonneesDeces;
