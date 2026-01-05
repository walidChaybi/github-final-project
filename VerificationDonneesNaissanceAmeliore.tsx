import ChampCaseACocher from "@composants/commun/champs/ChampCaseACocher";
import ChampDate from "@composants/commun/champs/ChampDate";
import ChampsPrenoms from "@composants/commun/champs/ChampsPrenoms";
import ChampTexte from "@composants/commun/champs/ChampTexte";
import ConteneurAvecBordure from "@composants/commun/conteneurs/formulaire/ConteneurAvecBordure";
import { FicheActe } from "@model/etatcivil/acte/FicheActe";
import { Mention } from "@model/etatcivil/acte/mention/Mention";
import { ESexe } from "@model/etatcivil/enum/Sexe";
import { DateHeureFormUtils, IDateHeureForm } from "@model/form/commun/DateForm";
import { PrenomsForm, TPrenomsForm } from "@model/form/commun/PrenomsForm";
import { Formik } from "formik";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { EditionMiseAJourContext } from "../../../../../contexts/EditionMiseAJourContextProvider";
import { convertirTexteFrancaisEnValeur, detecterTypeChamp } from "../../../../../utils/textSelectionUtils";
import { getFieldOrder, getNextFieldSmart } from "./fieldMapping";
import VerifierCaseACocher from "./VerifierCaseACocher";

interface IVerificationDonneesNaissanceProps {
  acte: FicheActe;
  verificationDonneesEffectuee: boolean;
  setVerificationDonneesEffectuee: (value: boolean) => void;
  miseAJourEffectuee: boolean;
}

interface IVerificationDonneesNaissanceForm {
  titulaire: {
    nom: string;
    prenoms: TPrenomsForm;
    dateNaissance: IDateHeureForm;
    lieuNaissance: {
      lieuReprise: string;
    };
    sexe: keyof typeof ESexe;
    profession: string;
    domicile: {
      adresse: string;
    };
  };
  parent1: {
    nom: string;
    prenoms: TPrenomsForm;
    dateNaissance: IDateHeureForm;
    age: string;
    lieuNaissance: {
      lieuReprise: string;
    };
    afficherAge: boolean;
    profession: string;
    domicile: {
      adresse: string;
    };
  };
  parent2: {
    nom: string;
    prenoms: TPrenomsForm;
    dateNaissance: IDateHeureForm;
    age: string;
    lieuNaissance: {
      lieuReprise: string;
    };
    afficherAge: boolean;
    profession: string;
    domicile: {
      adresse: string;
    };
  };
  declarant: {
    identiteDeclarant: string;
  };
  adresseTitulaire: {
    adresse: string;
  };
  informationsComplementaires: {
    francaisPar: string;
    mentions: Mention[];
    dateCreation: string;
  };
  verificationEffectuee: boolean;
}

const VerificationDonneesNaissance: React.FC<IVerificationDonneesNaissanceProps> = ({
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
        const champSuivant = getNextFieldSmart(champActif, "NAISSANCE", valeursCourantes);

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
      const ordreChamps = getFieldOrder("NAISSANCE");
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

  const titulaire = acte.titulaires[0];
  const parent1 = titulaire?.getParent1();
  const parent2 = titulaire?.getParent2();

  const valeursInitiales: IVerificationDonneesNaissanceForm = useMemo(
    () => ({
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
        sexe: (titulaire?.sexe as keyof typeof ESexe) || "",
        profession: titulaire?.profession || "",
        domicile: {
          adresse: [titulaire?.domicile?.voie, titulaire?.domicile?.ville, titulaire?.domicile?.region, titulaire?.domicile?.pays]
            .filter(Boolean)
            .join(", ")
        }
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
        domicile: {
          adresse: [parent1?.domicile?.voie, parent1?.domicile?.ville, parent1?.domicile?.region, parent1?.domicile?.pays]
            .filter(Boolean)
            .join(", ")
        },
        afficherAge: !!parent1?.age,
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
        afficherAge: !!parent2?.age,
        profession: parent2?.profession || "",
        domicile: {
          adresse: [parent2?.domicile?.voie, parent2?.domicile?.ville, parent2?.domicile?.region, parent2?.domicile?.pays]
            .filter(Boolean)
            .join(", ")
        }
      },
      declarant: {
        identiteDeclarant: ""
      },
      adresseTitulaire: {
        adresse: ""
      },
      informationsComplementaires: {
        francaisPar: "",
        mentions: acte.mentions || [],
        dateCreation: acte.dateCreation?.format("JJ/MM/AAAA") ?? ""
      },
      verificationEffectuee: verificationDonneesEffectuee
    }),
    [acte, titulaire, parent1, parent2, verificationDonneesEffectuee]
  );

  return (
    <Formik<IVerificationDonneesNaissanceForm>
      innerRef={refFormulaire}
      enableReinitialize
      initialValues={valeursInitiales}
      onSubmit={() => {}}
    >
      {({ values, setFieldValue }) => (
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
            {/* Section Titulaire */}
            <ConteneurAvecBordure titreEnTete="Titulaire">
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ChampTexte
                    name="titulaire.nom"
                    libelle="Nom du titulaire"
                    onFocus={() => gererFocusChamp("titulaire.nom")}
                  />
                  <ChampTexte
                    name="titulaire.sexe"
                    libelle="Sexe"
                    onFocus={() => gererFocusChamp("titulaire.sexe")}
                  />
                </div>

                <ChampsPrenoms
                  cheminPrenoms="titulaire.prenoms"
                  prefixePrenom="prenom"
                  onFocus={e => gererFocusChamp(e.target.id)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <ChampDate
                    libelle="Date et heure de naissance"
                    name="titulaire.dateNaissance"
                    avecHeure
                    onFocus={e => gererFocusChamp(e.target.id)}
                  />
                  <ChampTexte
                    name="titulaire.lieuNaissance.lieuReprise"
                    libelle="Lieu naissance"
                    onFocus={() => gererFocusChamp("titulaire.lieuNaissance.lieuReprise")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ChampTexte
                    name="titulaire.profession"
                    libelle="Profession"
                    onFocus={() => gererFocusChamp("titulaire.profession")}
                  />
                  <ChampTexte
                    name="titulaire.domicile.adresse"
                    libelle="Domicile"
                    onFocus={() => gererFocusChamp("titulaire.domicile.adresse")}
                  />
                </div>
              </div>
            </ConteneurAvecBordure>

            {/* Section Parent 1 */}
            {parent1 && (
              <ConteneurAvecBordure titreEnTete="Informations du parent 1">
                <div className="mt-4 space-y-4">
                  <ChampTexte
                    name="parent1.nom"
                    libelle="Nom"
                    onFocus={() => gererFocusChamp("parent1.nom")}
                  />

                  <ChampsPrenoms
                    cheminPrenoms="parent1.prenoms"
                    prefixePrenom="prenom"
                    onFocus={e => gererFocusChamp(e.target.id)}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Age/Date Toggle Section */}
                    <div
                      className={`rounded-lg p-4 transition-all duration-200 ${
                        champActif?.includes("parent1.dateNaissance") || champActif === "parent1.age"
                          ? "border-2 border-blue-500 bg-blue-50 shadow-lg"
                          : "border border-gray-200"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          {values.parent1.afficherAge ? "Âge" : "Date de naissance"}
                        </label>
                        <ChampCaseACocher
                          name="parent1.afficherAge"
                          libelle="Âge"
                          apresChangement={() => {
                            setFieldValue("parent1.dateNaissance.jour", "");
                            setFieldValue("parent1.dateNaissance.mois", "");
                            setFieldValue("parent1.dateNaissance.annee", "");
                            setFieldValue("parent1.age", "");
                          }}
                        />
                      </div>

                      {values.parent1.afficherAge ? (
                        <ChampTexte
                          name="parent1.age"
                          placeholder="Ex: 25 ans"
                          onFocus={() => gererFocusChamp("parent1.age")}
                        />
                      ) : (
                        <ChampDate
                          libelle=""
                          name="parent1.dateNaissance"
                          onFocus={e => gererFocusChamp(e.target.id)}
                        />
                      )}
                    </div>

                    <ChampTexte
                      name="parent1.lieuNaissance.lieuReprise"
                      libelle="Lieu naissance"
                      onFocus={() => gererFocusChamp("parent1.lieuNaissance.lieuReprise")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <ChampTexte
                      name="parent1.profession"
                      libelle="Profession"
                      onFocus={() => gererFocusChamp("parent1.profession")}
                    />
                    <ChampTexte
                      name="parent1.domicile.adresse"
                      libelle="Domicile"
                      onFocus={() => gererFocusChamp("parent1.domicile.adresse")}
                    />
                  </div>
                </div>
              </ConteneurAvecBordure>
            )}

            {/* Section Parent 2 */}
            <ConteneurAvecBordure titreEnTete="Informations du parent 2">
              <div className="mt-4 space-y-4">
                <ChampTexte
                  name="parent2.nom"
                  libelle="Nom"
                  onFocus={() => gererFocusChamp("parent2.nom")}
                />
                <ChampsPrenoms
                  cheminPrenoms="parent2.prenoms"
                  prefixePrenom="prenom"
                  onFocus={e => gererFocusChamp(e.target.id)}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Age/Date Toggle Section */}
                  <div
                    className={`rounded-lg p-4 transition-all duration-200 ${
                      champActif?.includes("parent2.dateNaissance") || champActif === "parent2.age"
                        ? "border-2 border-blue-500 bg-blue-50 shadow-lg"
                        : "border border-gray-200"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {values.parent2.afficherAge ? "Âge" : "Date de naissance"}
                      </label>
                      <ChampCaseACocher
                        name="parent2.afficherAge"
                        libelle="Âge"
                        className="!mb-0"
                        apresChangement={() => {
                          setFieldValue("parent2.dateNaissance.jour", "");
                          setFieldValue("parent2.dateNaissance.mois", "");
                          setFieldValue("parent2.dateNaissance.annee", "");
                          setFieldValue("parent2.age", "");
                        }}
                      />
                    </div>

                    {values.parent2.afficherAge ? (
                      <ChampTexte
                        name="parent2.age"
                        placeholder="Ex: 30 ans"
                        onFocus={() => gererFocusChamp("parent2.age")}
                      />
                    ) : (
                      <ChampDate
                        libelle=""
                        name="parent2.dateNaissance"
                        onFocus={e => gererFocusChamp(e.target.id)}
                      />
                    )}
                  </div>

                  <ChampTexte
                    name="parent2.lieuNaissance.lieuReprise"
                    libelle="Lieu naissance"
                    onFocus={() => gererFocusChamp("parent2.lieuNaissance.lieuReprise")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ChampTexte
                    name="parent2.profession"
                    libelle="Profession"
                    onFocus={() => gererFocusChamp("parent2.profession")}
                  />
                  <ChampTexte
                    name="parent2.domicile.adresse"
                    libelle="Domicile"
                    onFocus={() => gererFocusChamp("parent2.domicile.adresse")}
                  />
                </div>
              </div>
            </ConteneurAvecBordure>

            {/* Section Déclarant */}
            <ConteneurAvecBordure titreEnTete="Déclarant">
              <div className="mt-4 space-y-4">
                <ChampTexte
                  name="declarant.identiteDeclarant"
                  libelle="Déclarant"
                  onFocus={() => gererFocusChamp("declarant.identiteDeclarant")}
                />
              </div>
            </ConteneurAvecBordure>

            {/* Section Adresse du Titulaire */}
            <ConteneurAvecBordure titreEnTete="Adresse du titulaire">
              <div className="mt-4 space-y-4">
                <ChampTexte
                  name="adresseTitulaire.adresse"
                  libelle="Adresse"
                  onFocus={() => gererFocusChamp("adresseTitulaire.adresse")}
                />
              </div>
            </ConteneurAvecBordure>

            {/* Section Informations complémentaires */}
            <ConteneurAvecBordure titreEnTete="Informations complémentaires">
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ChampTexte
                    name="informationsComplementaires.francaisPar"
                    libelle={values.titulaire.sexe === "FEMININ" ? "Française Par" : "Français Par"}
                    onFocus={() => gererFocusChamp("informationsComplementaires.francaisPar")}
                  />
                  <ChampTexte
                    name="informationsComplementaires.dateCreation"
                    libelle="Date de création de l'acte"
                    onFocus={() => gererFocusChamp("informationsComplementaires.dateCreation")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {values.informationsComplementaires.mentions.map((mention, index) => (
                    <ChampTexte
                      key={mention.id}
                      name={`informationsComplementaires.mentionTexte${index}`}
                      libelle={`${index + 1}. ${mention.getTexteCopie()}`}
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

export default VerificationDonneesNaissance;
