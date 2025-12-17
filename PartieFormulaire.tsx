import { CONFIG_GET_RESUME_ACTE } from "@api/configurations/etatCivil/acte/GetResumeActeConfigApi";
import CONFIG_GET_FORMULE_INTEGRATION_RECE, {
  IFormuleIntegrationDto
} from "@api/configurations/etatCivil/nomenclature/GetFormuleIntegrationRECEApi";
import { CONFIG_PUT_ANALYSE_MARGINALE_ET_MENTIONS } from "@api/configurations/etatCivil/PutAnalyseMarginaleEtMentionsConfigApi";
import { CONFIG_PUT_MISE_A_JOUR_ANALYSE_MARGINALE } from "@api/configurations/etatCivil/PutMiseAJourAnalyseMarginaleConfigApi";
import { Droit } from "@model/agent/enum/Droit";
import { TErreurApi } from "@model/api/Api";
import { FicheActe } from "@model/etatcivil/acte/FicheActe";
import { Filiation } from "@model/etatcivil/acte/Filiation";
import { ESexe } from "@model/etatcivil/enum/Sexe";
import AnalyseMarginaleForm from "@model/form/AnalyseMarginale/AnalyseMarginaleForm";
import { TObjetFormulaire } from "@model/form/commun/ObjetFormulaire";
import { TPrenomsForm } from "@model/form/commun/PrenomsForm";
import MiseAJourForm from "@model/form/miseAJour/MiseAJourForm";
import { Formik } from "formik";
import { useContext, useEffect, useMemo, useState } from "react";
import { Form } from "react-router";
import { ECleOngletsMiseAJour, EditionMiseAJourContext } from "../../../contexts/EditionMiseAJourContextProvider";
import { RECEContextData } from "../../../contexts/RECEContextProvider";
import useFetchApi from "../../../hooks/api/FetchApiHook";
import AfficherMessage from "../../../utils/AfficherMessage";
import DateRECE from "../../../utils/DateRECE";
import Bouton from "../../commun/bouton/Bouton";
import { ConteneurBoutonBasDePage } from "../../commun/bouton/conteneurBoutonBasDePage/ConteneurBoutonBasDePage";
import PageChargeur from "../../commun/chargeurs/PageChargeur";
import ConteneurAvecBordure from "../../commun/conteneurs/formulaire/ConteneurAvecBordure";
import ConteneurModale from "../../commun/conteneurs/modale/ConteneurModale";
import OngletsBouton from "../../commun/onglets/OngletsBouton";
import OngletsContenu from "../../commun/onglets/OngletsContenu";
import { estActeEligibleDoubleNumerique } from "./droitsMiseAJourUtils";
import BoutonTerminerEtSigner from "./formulaires/BoutonTerminerEtSigner";
import BoutonValiderEtTerminer from "./formulaires/BoutonValiderEtTerminer";
import MentionForm, { ITitulaireMention } from "./formulaires/MentionForm";
import AnalyseMarginaleFormulaire from "./formulaires/mentions/AnalyseMarginaleFormulaire/AnalyseMarginaleFormulaire";
import TableauMentions from "./formulaires/mentions/ListeMentionsFormulaire/TableauMentions";
import VerificationDonneesDeces from "./formulaires/VerificationDonnees/VerificationDonneesDeces";
import VerificationDonneesDecesAmeliore from "./formulaires/VerificationDonnees/VerificationDonneesDecesAmeliore";
import VerificationDonneesMariage from "./formulaires/VerificationDonnees/VerificationDonneesMariage";
import VerificationDonneesMariageAmeliore from "./formulaires/VerificationDonnees/VerificationDonneesMariageAmeliore";
import VerificationDonneesNaissance from "./formulaires/VerificationDonnees/VerificationDonneesNaissance";
import VerificationDonneesNaissanceAmeliore from "./formulaires/VerificationDonnees/VerificationDonneesNaissanceAmeliore";

interface IDonneesAideSaisie {
  champs: TObjetFormulaire;
  textesEdites: { [cle: string]: { edite: string; original: string } };
}

export interface IMentionMiseAJour {
  texte: string;
  idTypeMention: string;
  affecteAnalyseMarginale: boolean;
  donneesAideSaisie?: IDonneesAideSaisie;
}

export interface IMentionEnCours {
  index: number | null;
  mention: IMentionMiseAJour;
}

export interface IAnalyseMarginaleMiseAJour extends TObjetFormulaire {
  motif: string;
  titulaires: {
    nom: string;
    nomSecable: boolean;
    nomPartie1: string;
    nomPartie2: string;
    prenoms: TPrenomsForm;
  }[];
}

export interface IMiseAJourForm {
  mentions: IMentionMiseAJour[];
  analyseMarginale: IAnalyseMarginaleMiseAJour;
}

export interface IMiseAJourMentionsForm {
  mentions: IMentionMiseAJour[];
}

interface IPartieFormulaireProps {
  onActiveFieldChange?: (fieldName: string | null) => void;
  onTextHandlerChange?: (handler: ((text: string) => void) | null) => void;
}

const PartieFormulaire: React.FC<IPartieFormulaireProps> = ({
  onActiveFieldChange,
  onTextHandlerChange
}) => {
  const { estMiseAJourAvecMentions, ongletsActifs, idActe, miseAJourEffectuee } = useContext(EditionMiseAJourContext.Valeurs);
  const { changerOnglet, activerOngletActeMisAJour, setComposerActeMisAJour } = useContext(EditionMiseAJourContext.Actions);
  
  const [activeFieldName, setActiveFieldName] = useState<string | null>(null);
  const [textExtractionHandler, setTextExtractionHandler] = useState<((text: string) => void) | null>(null);

  const handleActiveFieldChange = (fieldName: string | null) => {
    setActiveFieldName(fieldName);
    onActiveFieldChange?.(fieldName);
  };

  const handleTextHandlerChange = (handler: ((text: string) => void) | null) => {
    setTextExtractionHandler(() => handler);
    onTextHandlerChange?.(handler);
  };

  const { appelApi: mettreAJourAnalyseMarginaleEtMentions, enAttenteDeReponseApi: enAttenteMiseAJourAnalyseMarginaleEtMention } =
    useFetchApi(CONFIG_PUT_ANALYSE_MARGINALE_ET_MENTIONS);
  const { appelApi: mettreAJourAnalyseMarginale, enAttenteDeReponseApi: enAttenteMiseAJourAnalyseMarginale } = useFetchApi(
    CONFIG_PUT_MISE_A_JOUR_ANALYSE_MARGINALE
  );
  const [afficherAnalyseMarginale, setAfficherAnalyseMarginale] = useState(!estMiseAJourAvecMentions);

  const [formulaireMentionEnCoursDeSaisie, setFormulaireMentionEnCoursDeSaisie] = useState<boolean>(false);

  const [afficherModaleAnalyseMarginale, setAfficherModaleAnalyseMarginale] = useState<boolean>(false);
  const [donneesAnalyseMarginale, setDonneesAnalyseMarginale] = useState<IAnalyseMarginaleMiseAJour | null>(null);
  const [mentionsDeLActe, setMentionsDeLActe] = useState<IMentionMiseAJour[]>([]);
  const [mentionsDuTableau, setMentionsDuTableau] = useState<IMentionMiseAJour[]>([]);
  const [mentionEnCoursDeSaisie, setMentionEnCoursDeSaisie] = useState<IMentionEnCours | null>(null);
  const [motif, setMotif] = useState<string | null>(null);
  const [verificationDonneesEffectuee, setVerificationDonneesEffectuee] = useState<boolean>(false);

  const [acte, setActe] = useState<FicheActe | null>(null);
  const { appelApi: getResumeActe } = useFetchApi(CONFIG_GET_RESUME_ACTE);
  const { appelApi: getFormuleIntegrationRece } = useFetchApi(CONFIG_GET_FORMULE_INTEGRATION_RECE);
  const [valeursInitialesFormulaireAnalyseMarginale, setValeursInitialesFormulaireAnalyseMarginale] =
    useState<IAnalyseMarginaleMiseAJour | null>(null);
  const { utilisateurConnecte } = useContext(RECEContextData);

  const [formuleDIntegration, setFormuleDIntegration] = useState<IFormuleIntegrationDto | null>(null);

  const acteEstEligibleFormuleDIntegrationEtUtilisateurALesDroits = useMemo(() => {
    if (acte !== null) {
      const aLesDroits = utilisateurConnecte.estHabilitePour({
        tousLesDroits: [Droit.METTRE_A_JOUR_ACTE, Droit.MISE_A_JOUR_CREER_DOUBLE_NUMERIQUE]
      });

      return estActeEligibleDoubleNumerique(acte) && aLesDroits;
    }
    return false;
  }, [acte, utilisateurConnecte]);

  const verificationDonneesObligatoire = estMiseAJourAvecMentions && acteEstEligibleFormuleDIntegrationEtUtilisateurALesDroits;
  const verificationDonneesDisponible = verificationDonneesObligatoire && miseAJourEffectuee;
  const recupererMentions = (analyseMarginaleEstMiseAJour: boolean): IMentionMiseAJour[] => {
    // Mention saisie dans le formulaire de saisie
    if (mentionEnCoursDeSaisie?.mention) {
      // Mention modifiée
      if (
        typeof mentionEnCoursDeSaisie.index === "number" &&
        mentionsDeLActe[mentionEnCoursDeSaisie.index] !== mentionEnCoursDeSaisie.mention
      ) {
        return mentionsDeLActe.map((mention, index) => (index === mentionEnCoursDeSaisie.index ? mentionEnCoursDeSaisie.mention : mention));

        // Mention ajoutée
      } else {
        return [...mentionsDeLActe, mentionEnCoursDeSaisie.mention];
      }

      // Analyse marginale modifiée
    } else if (analyseMarginaleEstMiseAJour) {
      return mentionsDeLActe;

      // Ordre des mentions modifié ou mention supprimée
    } else {
      return mentionsDuTableau;
    }
  };

  const gererAffichageModaleAnalyseMarginale = (mentions: IMentionMiseAJour[]) => {
    if (mentionEnCoursDeSaisie?.mention && mentionEnCoursDeSaisie.index === null) {
      setAfficherModaleAnalyseMarginale(mentions[mentionEnCoursDeSaisie?.index ?? mentions.length - 1].affecteAnalyseMarginale);
    }
  };

  useEffect(() => {
    if (acteEstEligibleFormuleDIntegrationEtUtilisateurALesDroits && formuleDIntegration === null) {
      getFormuleIntegrationRece({
        parametres: {},
        apresSucces: formuleDIntegration => {
          setFormuleDIntegration(formuleDIntegration);
        },
        apresErreur: erreurs =>
          AfficherMessage.erreur("Une erreur est survenue lors de la récupération des informations de la formule d'intégration au RECE", {
            erreurs
          })
      });
    }
  }, [acteEstEligibleFormuleDIntegrationEtUtilisateurALesDroits]);

  useEffect(() => {
    if (estMiseAJourAvecMentions) {
      const analyseMarginaleEstMiseAJour = afficherAnalyseMarginale && donneesAnalyseMarginale !== null;

      const mentions = recupererMentions(analyseMarginaleEstMiseAJour);

      if (!mentions.length) return;

      mettreAJourAnalyseMarginaleEtMentions({
        parametres: {
          body: MiseAJourForm.versDto(
            idActe,
            [
              ...mentions,
              ...(acteEstEligibleFormuleDIntegrationEtUtilisateurALesDroits && formuleDIntegration !== null
                ? [
                    {
                      idTypeMention: formuleDIntegration.idTypeMention,
                      affecteAnalyseMarginale: formuleDIntegration.affecteAnalyseMarginale,
                      texte: formuleDIntegration.texteFormule
                    }
                  ]
                : [])
            ],
            donneesAnalyseMarginale,
            analyseMarginaleEstMiseAJour
          )
        },
        apresSucces: () => {
          setMentionsDeLActe(mentions);
          activerMiseAJourActe();
          resetModificationMention();
          gererAffichageModaleAnalyseMarginale(mentions);
        },
        apresErreur: (erreurs: TErreurApi[]) => {
          const messageErreur = (() => {
            switch (true) {
              case Boolean(erreurs?.find(erreur => erreur.code === "FCT_16136")):
                return "Aucune modification de l'analyse marginale n'a été détectée";
              case Boolean(erreurs?.find(erreur => erreur.code === "FCT_160168")):
                return "La personne liée ne peut pas être le titulaire de l'acte";
              default:
                return "Impossible de mettre à jour l'acte";
            }
          })();

          AfficherMessage.erreur(messageErreur, { erreurs, fermetureAuto: true });
        }
      });
    }

    if (!estMiseAJourAvecMentions && donneesAnalyseMarginale !== null) {
      mettreAJourAnalyseMarginale({
        parametres: {
          path: { idActe: idActe },
          body: AnalyseMarginaleForm.versDto(donneesAnalyseMarginale)
        },
        apresSucces: () => {
          activerOngletActeMisAJour();
          setComposerActeMisAJour(true);
          changerOnglet(ECleOngletsMiseAJour.ACTE_MIS_A_JOUR, null);
          setVerificationDonneesEffectuee(!verificationDonneesObligatoire);
        },
        apresErreur: (erreurs: TErreurApi[]) => {
          const messageErreur = erreurs.find(erreur => erreur.code === "FCT_16136")
            ? "Aucune modification de l'analyse marginale n'a été détectée"
            : "Impossible de mettre à jour l'analyse marginale";

          AfficherMessage.erreur(messageErreur, { erreurs, fermetureAuto: true });
        }
      });
    }
  }, [donneesAnalyseMarginale, mentionEnCoursDeSaisie, mentionsDuTableau]);

  useEffect(() => {
    getResumeActe({
      parametres: {
        path: { idActe },
        query: { remplaceIdentiteTitulaireParIdentiteTitulaireAM: true }
      },
      apresSucces: acteDto => {
        setActe(FicheActe.depuisDto(acteDto));
      },
      apresErreur: erreurs =>
        AfficherMessage.erreur("Une erreur est survenue lors de la récupération des informations de l'acte", { erreurs })
    });
  }, []);

  useEffect(() => {
    if (!acte) return;

    setValeursInitialesFormulaireAnalyseMarginale(
      AnalyseMarginaleForm.genererValeursDefautFormulaire(acte.getTitulairesPourAnalyseMarginale(), motif)
    );
  }, [motif, acte]);

  const resetModificationMention = () => {
    setMentionEnCoursDeSaisie(mention => (mention ? null : mention));
    setMentionsDuTableau(mentions => (mentions.length > 0 ? [] : mentions));
    setFormulaireMentionEnCoursDeSaisie(false);
  };

  const activerMiseAJourActe = () => {
    activerOngletActeMisAJour();
    setComposerActeMisAJour(true);
    changerOnglet(ECleOngletsMiseAJour.ACTE_MIS_A_JOUR, null);
  };

  const recupererFiliationsTitulaire = (filiations: Filiation[]) =>
    filiations.map(filiation => ({
      dateNaissance: filiation.naissance
        ? DateRECE.depuisObjetDate({
            annee: filiation.naissance.annee,
            mois: filiation.naissance.mois,
            jour: filiation.naissance.jour,
            heure: filiation.naissance.heure,
            minute: filiation.naissance.minute
          }).format("JJ mois AAAA", "AVEC_PREFIXE")
        : "",
      prenoms: Object.fromEntries(filiation.prenoms.map((prenom, i) => [`prenom${i + 1}`, prenom])) ?? {},
      nom: filiation.nom ?? "",
      lieuFormate: filiation.naissance?.lieuFormate ?? "",
      sexe: ESexe[filiation.sexe] ?? ""
    }));

  const titulairesMention: ITitulaireMention[] = useMemo(() => {
    if (!acte) return [];

    return [...Array(acte.getNombreTitulairesSelonNature()).keys()].map(index => {
      return {
        nom: acte?.titulaires?.[index].nom ?? "",
        nomPartie1: acte?.titulaires?.[index].nomPartie1 ?? "",
        nomPartie2: acte?.titulaires?.[index].nomPartie2 ?? "",
        nomSecable: Boolean(acte?.titulaires?.[index].nomPartie1 && acte?.titulaires?.[index].nomPartie2),
        prenoms: Object.fromEntries(acte?.titulaires?.[index].prenoms.map((prenom, i) => [`prenom${i + 1}`, prenom])) ?? {},
        sexe: ESexe[acte?.titulaires?.[index].sexe] ?? "",
        dateNaissance: acte?.titulaires?.[index].getDateNaissance("JJ mois AAAA", "AVEC_PREFIXE") ?? "",
        lieuFormate: acte?.titulaires?.[index].naissance?.lieuFormate ?? "",
        filiations: acte?.titulaires?.[index].filiations ? recupererFiliationsTitulaire(acte?.titulaires?.[index].filiations) : []
      };
    });
  }, [acte]);

  return (
    <>
      {(enAttenteMiseAJourAnalyseMarginale || enAttenteMiseAJourAnalyseMarginaleEtMention) && <PageChargeur />}
      <div className="w-1/2">
        <OngletsBouton<ECleOngletsMiseAJour>
          onglets={[
            ...(estMiseAJourAvecMentions
              ? [
                  {
                    cle: ECleOngletsMiseAJour.MENTIONS,
                    libelle: "Mentions"
                  }
                ]
              : []),

            ...(afficherAnalyseMarginale
              ? [
                  {
                    cle: ECleOngletsMiseAJour.ANALYSE_MARGINALE,
                    libelle: "Analyse Marginale"
                  }
                ]
              : []),

            ...(verificationDonneesDisponible
              ? [
                  {
                    cle: ECleOngletsMiseAJour.VERIFICATION_DONNEES,
                    libelle: "Vérification des données"
                  }
                ]
              : [])
          ]}
          cleOngletActif={ongletsActifs.formulaires}
          changerOnglet={valeur => changerOnglet(null, valeur)}
        />

        <div className="mt-4 flex h-[calc(100vh-16rem)] flex-col overflow-y-auto">
          {estMiseAJourAvecMentions && (
            <OngletsContenu estActif={ongletsActifs.formulaires === ECleOngletsMiseAJour.MENTIONS}>
              {acteEstEligibleFormuleDIntegrationEtUtilisateurALesDroits && (
                <div className="pb-4 text-left">
                  <ConteneurAvecBordure titreEnTete="Formule intégration dans RECE">
                    <div className="mt-3 bg-slate-100">{formuleDIntegration?.texteFormule}</div>
                  </ConteneurAvecBordure>
                </div>
              )}

              <Formik<IMiseAJourMentionsForm>
                initialValues={{ mentions: [] }}
                onSubmit={values => {
                  setMentionsDuTableau(values.mentions);
                }}
              >
                <Form>
                  <TableauMentions
                    setAfficherOngletAnalyseMarginale={setAfficherAnalyseMarginale}
                    setMotif={setMotif}
                    setMentionsDuTableau={setMentionsDuTableau}
                    formulaireMentionEnCoursDeSaisie={formulaireMentionEnCoursDeSaisie}
                    donneesMentions={mentionsDeLActe}
                    donneesAnalyseMarginale={donneesAnalyseMarginale}
                  />
                </Form>
              </Formik>
              <MentionForm
                titulaires={titulairesMention}
                setEnCoursDeSaisie={setFormulaireMentionEnCoursDeSaisie}
                enCoursDeSaisie={formulaireMentionEnCoursDeSaisie}
                setMentionEnCoursDeSaisie={setMentionEnCoursDeSaisie}
                natureActe={acte?.nature}
              />
            </OngletsContenu>
          )}

          {afficherAnalyseMarginale && (
            <OngletsContenu estActif={ongletsActifs.formulaires === ECleOngletsMiseAJour.ANALYSE_MARGINALE}>
              <AnalyseMarginaleFormulaire
                setDonneesAnalyseMarginale={setDonneesAnalyseMarginale}
                valeursInitiales={valeursInitialesFormulaireAnalyseMarginale}
                motif={motif}
              />
            </OngletsContenu>
          )}

          {verificationDonneesObligatoire && (
            <OngletsContenu estActif={ongletsActifs.formulaires === ECleOngletsMiseAJour.VERIFICATION_DONNEES}>
              {(() => {
                switch (acte?.nature) {
                  case "NAISSANCE":
                    return (
                      <VerificationDonneesNaissanceAmeliore
                        acte={acte}
                        verificationDonneesEffectuee={verificationDonneesEffectuee}
                        setVerificationDonneesEffectuee={setVerificationDonneesEffectuee}
                        miseAJourEffectuee={miseAJourEffectuee}
                        onActiveFieldChange={handleActiveFieldChange}
                        registerTextHandler={handleTextHandlerChange}
                      />
                    );
                  case "MARIAGE":
                    return (
                      <VerificationDonneesMariageAmeliore
                        acte={acte}
                        verificationDonneesEffectuee={verificationDonneesEffectuee}
                        setVerificationDonneesEffectuee={setVerificationDonneesEffectuee}
                        miseAJourEffectuee={miseAJourEffectuee}
                        onActiveFieldChange={handleActiveFieldChange}
                        registerTextHandler={handleTextHandlerChange}
                      />
                    );
                  case "DECES":
                    return (
                      <VerificationDonneesDecesAmeliore
                        acte={acte}
                        verificationDonneesEffectuee={verificationDonneesEffectuee}
                        setVerificationDonneesEffectuee={setVerificationDonneesEffectuee}
                        miseAJourEffectuee={miseAJourEffectuee}
                        onActiveFieldChange={handleActiveFieldChange}
                        registerTextHandler={handleTextHandlerChange}
                      />
                    );
                  default:
                    return null;
                }
              })()}
            </OngletsContenu>
          )}

          <ConteneurBoutonBasDePage position="droite">
            {verificationDonneesDisponible && (
              <Bouton
                type="button"
                title="Vérifier les données"
                disabled={ongletsActifs.formulaires === ECleOngletsMiseAJour.VERIFICATION_DONNEES}
                onClick={() => changerOnglet(null, ECleOngletsMiseAJour.VERIFICATION_DONNEES)}
              >
                {"Vérifier les données"}
              </Bouton>
            )}
            {estMiseAJourAvecMentions ? (
              <BoutonTerminerEtSigner
                saisieMentionEnCours={formulaireMentionEnCoursDeSaisie}
                acte={acte}
                verificationDonneesEffectuee={verificationDonneesEffectuee}
                verificationObligatoire={verificationDonneesObligatoire}
              />
            ) : (
              <BoutonValiderEtTerminer disabled={!miseAJourEffectuee} />
            )}
          </ConteneurBoutonBasDePage>
        </div>
      </div>
      {afficherModaleAnalyseMarginale && (
        <ConteneurModale>
          <div className="rounded-md border-[2px] border-solid border-bleu-sombre bg-blanc p-6 shadow-lg">
            <div className="p-6">{"Veuillez vérifier s'il y a lieu de mettre à jour l'analyse marginale"}</div>
            <Bouton
              title="J'ai lu ce message"
              onClick={() => {
                setAfficherModaleAnalyseMarginale(false);
              }}
            >
              {"OK"}
            </Bouton>
          </div>
        </ConteneurModale>
      )}
    </>
  );
};

export default PartieFormulaire;
