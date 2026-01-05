import { CONFIG_GET_RESUME_ACTE } from "@api/configurations/etatCivil/acte/GetResumeActeConfigApi";
import TRAITEMENT_ABANDONNER_MISE_A_JOUR from "@api/traitements/TraitementAbandonnerMiseAJour";
import { FicheActe } from "@model/etatcivil/acte/FicheActe";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import PageChargeur from "../composants/commun/chargeurs/PageChargeur";
import CompteurTemps from "../composants/pages/requetesMiseAJour/compteurTemps/CompteurTemps";
import { verifierDroitsMiseAJourActe } from "../composants/pages/requetesMiseAJour/droitsMiseAJourUtils";
import { useCreateBlocker } from "../hooks/CreateBlocker";
import useFetchApi from "../hooks/api/FetchApiHook";
import useTraitementApi from "../hooks/api/TraitementApiHook";
import { URL_ACCUEIL } from "../router/infoPages/InfoPagesBase";
import AfficherMessage from "../utils/AfficherMessage";
import { RECEContextData } from "./RECEContextProvider";

export enum ECleOngletsMiseAJour {
  ACTE = "acte",
  ACTE_MIS_A_JOUR = "acte-mis-a-jour",
  ANALYSE_MARGINALE = "analyse-marginale",
  MENTIONS = "mentions",
  VERIFICATION_DONNEES = "verification-donnees"
}

export interface IEditionMiseAJourContext {
  idActe: string;
  idRequete: string;
  ongletsActifs: {
    actes: ECleOngletsMiseAJour;
    formulaires: ECleOngletsMiseAJour;
  };
  miseAJourEffectuee: boolean;
  composerActeMisAJour: boolean;
  estMiseAJourAvecMentions: boolean;
  estActeSigne: boolean;
}

interface IEditionMiseAJourContextActions {
  changerOnglet: (actes: ECleOngletsMiseAJour | null, formulaires: ECleOngletsMiseAJour | null) => void;
  activerOngletActeMisAJour: () => void;
  setComposerActeMisAJour: React.Dispatch<React.SetStateAction<boolean>>;
  desactiverBlocker: () => void;
  setEstActeSigne: React.Dispatch<React.SetStateAction<boolean>>;
  enregistrerGestionnaireTexte: (gestionnaire: ((texte: string) => void) | null) => void;
  extraireTexte: (texte: string) => void;
}

export const EditionMiseAJourContext = {
  Valeurs: createContext<IEditionMiseAJourContext>({} as IEditionMiseAJourContext),
  Actions: createContext<IEditionMiseAJourContextActions>({} as IEditionMiseAJourContextActions)
};

interface IEditionMiseAJourContextProviderProps {
  idActe: string;
  idRequete: string;
  estMiseAJourAvecMentions: boolean;
}

const EditionMiseAJourContextProvider: React.FC<React.PropsWithChildren<IEditionMiseAJourContextProviderProps>> = ({
  idActe,
  idRequete,
  estMiseAJourAvecMentions,
  children
}) => {
  const navigate = useNavigate();
  const { utilisateurConnecte } = useContext(RECEContextData);

  const [ongletsActifs, setOngletsActifs] = useState<{ actes: ECleOngletsMiseAJour; formulaires: ECleOngletsMiseAJour }>({
    actes: ECleOngletsMiseAJour.ACTE,
    formulaires: estMiseAJourAvecMentions ? ECleOngletsMiseAJour.MENTIONS : ECleOngletsMiseAJour.ANALYSE_MARGINALE
  });
  const [miseAJourEffectuee, setMiseAJourEffectuee] = useState<boolean>(false);
  const [composerActeMisAJour, setComposerActeMisAJour] = useState<boolean>(false);
  const [estActeSigne, setEstActeSigne] = useState<boolean>(false);
  const [gestionnaireExtractionTexte, setGestionnaireExtractionTexte] = useState<((texte: string) => void) | null>(null);

  const { appelApi: getResumeActe } = useFetchApi(CONFIG_GET_RESUME_ACTE);

  const { lancerTraitement: lancerTraitementAbandonner, traitementEnCours: abandonEnCours } =
    useTraitementApi(TRAITEMENT_ABANDONNER_MISE_A_JOUR);

  const { gestionBlocker, BlockerNavigation } = useCreateBlocker({
    titre: "Abandon du traitement",
    messages: ["La saisie en cours sera perdue.", "Voulez-vous continuer ?"],
    executerApresConfirmation: debloquer =>
      lancerTraitementAbandonner({
        parametres: {
          idActe: idActe,
          idRequete: idRequete,
          miseAJourEffectuee: miseAJourEffectuee,
          estMiseAJourAvecMentions: estMiseAJourAvecMentions
        },
        finalement: debloquer
      }),
    executerSiRedirectionAvecBlocageSansPopin: debloquer =>
      lancerTraitementAbandonner({
        parametres: {
          idActe: idActe,
          idRequete: idRequete,
          miseAJourEffectuee: miseAJourEffectuee,
          estMiseAJourAvecMentions: estMiseAJourAvecMentions
        },
        finalement: debloquer
      })
  });

  const abandonnerEtRedirigerAccueil = () =>
    lancerTraitementAbandonner({
      parametres: {
        idActe,
        idRequete,
        miseAJourEffectuee,
        estMiseAJourAvecMentions
      },
      finalement: () => navigate(URL_ACCUEIL, { replace: true })
    });

  // Vérification des droits au chargement du contexte
  useEffect(() => {
    getResumeActe({
      parametres: {
        path: { idActe },
        query: { remplaceIdentiteTitulaireParIdentiteTitulaireAM: true }
      },
      apresSucces: acteDto => {
        const ficheActe = FicheActe.depuisDto(acteDto);

        if (!ficheActe) {
          AfficherMessage.erreur("Impossible de récupérer les informations de l'acte", { fermetureAuto: true });
          abandonnerEtRedirigerAccueil();
          return;
        }

        const { autorise } = verifierDroitsMiseAJourActe(ficheActe, utilisateurConnecte);

        if (!autorise) {
          AfficherMessage.erreur("Vous n'avez pas les droits nécessaires pour accéder à cette mise à jour d'acte", { fermetureAuto: true });
          abandonnerEtRedirigerAccueil();
          return;
        }
      },
      apresErreur: erreurs => {
        AfficherMessage.erreur("Une erreur est survenue lors de la vérification des droits d'accès", { erreurs });
        abandonnerEtRedirigerAccueil();
      }
    });
  }, [idActe, utilisateurConnecte, navigate]);

  const valeursContext = useMemo<IEditionMiseAJourContext>(
    () => ({
      idActe,
      idRequete,
      ongletsActifs,
      miseAJourEffectuee,
      composerActeMisAJour,
      estMiseAJourAvecMentions,
      estActeSigne
    }),
    [idActe, idRequete, ongletsActifs, miseAJourEffectuee, composerActeMisAJour, estMiseAJourAvecMentions, estActeSigne]
  );

  const actionsContext = useMemo<IEditionMiseAJourContextActions>(
    () => ({
      changerOnglet: (actes: ECleOngletsMiseAJour | null, formulaires: ECleOngletsMiseAJour | null) => {
        setOngletsActifs(prec => ({
          ...prec,
          ...(actes ? { actes: actes } : {}),
          ...(formulaires ? { formulaires: formulaires } : {})
        }));
      },
      activerOngletActeMisAJour: () => {
        setMiseAJourEffectuee(true);
        gestionBlocker.activerBlockerAvecConfirmation();
      },
      setComposerActeMisAJour,
      desactiverBlocker: gestionBlocker.desactiverBlocker,
      setEstActeSigne,
      enregistrerGestionnaireTexte: (gestionnaire: ((texte: string) => void) | null) => {
        setGestionnaireExtractionTexte(() => gestionnaire);
      },
      extraireTexte: (texte: string) => {
        gestionnaireExtractionTexte?.(texte);
      }
    }),
    [gestionnaireExtractionTexte]
  );

  useEffect(() => gestionBlocker.activerBlockerSansConfirmation(), []);

  return (
    <EditionMiseAJourContext.Valeurs.Provider value={valeursContext}>
      <EditionMiseAJourContext.Actions.Provider value={actionsContext}>
        {abandonEnCours && <PageChargeur />}
        {children}
        <BlockerNavigation />
        <CompteurTemps
          idRequete={idRequete}
          abandonnerRequete={() => {
            gestionBlocker.desactiverBlocker();
            lancerTraitementAbandonner({
              parametres: {
                idActe: idActe,
                idRequete: idRequete,
                miseAJourEffectuee: miseAJourEffectuee,
                estMiseAJourAvecMentions: estMiseAJourAvecMentions
              }
            });
          }}
        />
      </EditionMiseAJourContext.Actions.Provider>
    </EditionMiseAJourContext.Valeurs.Provider>
  );
};

export default EditionMiseAJourContextProvider;
