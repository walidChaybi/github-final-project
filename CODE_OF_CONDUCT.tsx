import { CONFIG_PATCH_RECTIFICATIONS_INFOS_ACTE } from "@api/configurations/etatCivil/acte/PatchRectificationsInfosActeConfigApi";
import { Droit } from "@model/agent/enum/Droit";
import { FicheActe, IFicheActeDto } from "@model/etatcivil/acte/FicheActe";
import {
  IVerificationDonneesDecesForm,
  IVerificationDonneesMariageForm,
  IVerificationDonneesNaissanceForm,
  MiseAJourModificationForm
} from "@model/form/miseAJour/MiseAJourModificationForm";
import { useContext, useState } from "react";
import { ECleOngletsMiseAJour, EditionMiseAJourContext } from "../../../../contexts/EditionMiseAJourContextProvider";
import { RECEContextData } from "../../../../contexts/RECEContextProvider";
import useFetchApi from "../../../../hooks/api/FetchApiHook";
import AfficherMessage from "../../../../utils/AfficherMessage";
import Bouton from "../../../commun/bouton/Bouton";
import ConteneurModale from "../../../commun/conteneurs/modale/ConteneurModale";
import SignatureDocument from "../../../commun/signature/SignatureDocument";
import { estActeEligibleDoubleNumerique } from "../droitsMiseAJourUtils";

// Type union pour les valeurs de vérification
export type TValeursVerification =
  | IVerificationDonneesNaissanceForm
  | IVerificationDonneesMariageForm
  | IVerificationDonneesDecesForm
  | null;

interface IBoutonTerminerEtSignerProps {
  saisieMentionEnCours: boolean;
  acte: FicheActe;
  verificationDonneesEffectuee: boolean;
  verificationObligatoire: boolean;
  valeursVerification: TValeursVerification;
}

const BoutonTerminerEtSigner: React.FC<IBoutonTerminerEtSignerProps> = ({
  saisieMentionEnCours,
  acte,
  verificationDonneesEffectuee,
  verificationObligatoire,
  valeursVerification
}) => {
  const { utilisateurConnecte } = useContext(RECEContextData);
  const { idActe, idRequete, miseAJourEffectuee } = useContext(EditionMiseAJourContext.Valeurs);
  const { setEstActeSigne, desactiverBlocker, changerOnglet } = useContext(EditionMiseAJourContext.Actions);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enCoursEnvoi, setEnCoursEnvoi] = useState(false);

  const { appelApi: envoyerRectifications, enAttenteDeReponseApi: enAttenteEnvoiRectifications } = useFetchApi(
    CONFIG_PATCH_RECTIFICATIONS_INFOS_ACTE
  );

  const typeSignature = estActeEligibleDoubleNumerique(acte) ? "DOUBLE_NUMERIQUE" : "MISE_A_JOUR";
  const estDoubleNumerique = typeSignature === "DOUBLE_NUMERIQUE";
  const aDroitSigner = utilisateurConnecte.estHabilitePour({ tousLesDroits: [Droit.SIGNER_MENTION, Droit.METTRE_A_JOUR_ACTE] });
  const verificationManquante = verificationObligatoire && !verificationDonneesEffectuee;

  const construirePayload = (): Partial<IFicheActeDto> | null => {
    if (!valeursVerification) return null;

    switch (acte.nature) {
      case "NAISSANCE":
        return MiseAJourModificationForm.versDtoPatchNaissance(valeursVerification as IVerificationDonneesNaissanceForm, acte);
      case "MARIAGE":
      //return MiseAJourModificationForm.versDtoPatchMariage(valeursVerification as IVerificationDonneesMariageForm, acte);
      case "DECES":
      //return MiseAJourModificationForm.versDtoPatchDeces(valeursVerification as IVerificationDonneesDecesForm, acte);
      default:
        return null;
    }
  };

  const gererClicTerminerEtSigner = () => {
    if (estDoubleNumerique) {
      const payload = construirePayload();
      if (!payload) {
        AfficherMessage.erreur("Données du formulaire manquantes", { fermetureAuto: true });
        return;
      }

      setEnCoursEnvoi(true);
      envoyerRectifications({
        parametres: { body: payload },
        apresSucces: () => {
          setEnCoursEnvoi(false);
          setModaleOuverte(true);
        },
        apresErreur: erreurs => {
          setEnCoursEnvoi(false);
          AfficherMessage.erreur("Erreur lors de l'envoi des rectifications", { erreurs, fermetureAuto: true });
        }
      });
    } else {
      setModaleOuverte(true);
    }
  };

  if (!aDroitSigner) return null;

  return (
    <>
      <Bouton
        type="button"
        title={verificationManquante ? "Vous devez vérifier les données avant de signer" : "Terminer et signer"}
        disabled={saisieMentionEnCours || !miseAJourEffectuee || verificationManquante || enCoursEnvoi || enAttenteEnvoiRectifications}
        onClick={gererClicTerminerEtSigner}
      >
        {"Terminer et signer"}
      </Bouton>
      {modaleOuverte && (
        <ConteneurModale>
          <div className="border-3 w-[34rem] max-w-full rounded-xl border-solid border-bleu-sombre bg-blanc p-5">
            <h2 className="m-0 mb-4 text-center font-medium text-bleu-sombre">Signature des mentions</h2>
            <SignatureDocument
              typeSignature={typeSignature}
              idActe={idActe}
              idRequete={idRequete}
              apresSignature={succes => {
                setModaleOuverte(false);
                if (succes) {
                  changerOnglet(ECleOngletsMiseAJour.ACTE, null);
                  setEstActeSigne(true);
                  AfficherMessage.succes("L'acte a été mis à jour avec succès.", { fermetureAuto: true });
                  desactiverBlocker();
                }
              }}
            />
          </div>
        </ConteneurModale>
      )}
    </>
  );
};

export default BoutonTerminerEtSigner;
