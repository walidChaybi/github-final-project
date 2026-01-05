import { compositionApi } from "@api/appels/compositionApi";
import { CONFIG_GET_DONNEES_POUR_COMPOSITION_ACTE_TEXTE_MIS_A_JOUR } from "@api/configurations/etatCivil/acte/GetDonneesPourCompositionActeTexteMisAJourConfigApi";
import AffichageDocument from "@composants/commun/affichageDocument/AffichageDocument";
import OngletsContenu from "@composants/commun/onglets/OngletsContenu";
import React, { useContext, useEffect, useState } from "react";
import { FiEye, FiFileText } from "react-icons/fi";
import { HiCursorClick } from "react-icons/hi";
import { EditionMiseAJourContext } from "../../../../contexts/EditionMiseAJourContextProvider";
import useFetchApi from "../../../../hooks/api/FetchApiHook";
import { EMimeType } from "../../../../ressources/EMimeType";
import AfficherMessage from "../../../../utils/AfficherMessage";
import { nettoyerTexteSelectionne } from "../../../../utils/textSelectionUtils";

interface IOngletActeMisAJourProps {
  estActif: boolean;
}

interface IActeData {
  reference_registre_papier?: string;
  nature_acte?: string;
  titulaires?: string;
  texte_corps_acte?: string;
  mentions?: string;
}

type ModeAffichage = "pdf" | "texte";

const OngletActeMisAJour: React.FC<IOngletActeMisAJourProps> = ({ estActif }) => {
  const { idActe, composerActeMisAJour } = useContext(EditionMiseAJourContext.Valeurs);
  const { setComposerActeMisAJour, extraireTexte } = useContext(EditionMiseAJourContext.Actions);
  const [contenuActeMisAJour, setContenuActeMisAJour] = useState<string | null>(null);
  const [donneesActe, setDonneesActe] = useState<IActeData | null>(null);
  const [modeAffichage, setModeAffichage] = useState<ModeAffichage>("pdf");

  const { appelApi: recupererDonneesPourCompositionActeTexteMisAJour } = useFetchApi(
    CONFIG_GET_DONNEES_POUR_COMPOSITION_ACTE_TEXTE_MIS_A_JOUR
  );

  useEffect(() => {
    if (!composerActeMisAJour) return;

    recupererDonneesPourCompositionActeTexteMisAJour({
      parametres: { path: { idActe } },
      apresSucces: donneesComposition => {
        // 1. Generate PDF
        compositionApi.getCompositionActeTexte(donneesComposition).then(retour => {
          setContenuActeMisAJour(retour.body.data.contenu ?? "");
          setComposerActeMisAJour(false);
        });

        // 2. Parse Text content
        try {
          let racineAnalyse: any = donneesComposition;

          if (typeof donneesComposition === "string") {
            try {
              racineAnalyse = JSON.parse(donneesComposition);
            } catch (e) {
              console.error("Failed to parse root response:", e);
              return;
            }
          }

          let donneesInternes = racineAnalyse?.data || racineAnalyse;

          if (typeof donneesInternes === "string") {
            try {
              donneesInternes = JSON.parse(donneesInternes);
            } catch (e) {
              console.error("Failed to parse nested data string:", e);
            }
          }

          // Map to state
          setDonneesActe({
            reference_registre_papier: donneesInternes?.reference_registre_papier,
            nature_acte: donneesInternes?.nature_acte,
            titulaires: donneesInternes?.titulaires,
            texte_corps_acte: donneesInternes?.texte_corps_acte,
            mentions: donneesInternes?.mentions
          });
        } catch (error) {
          console.error("Error extracting acte data:", error);
        }
      },
      apresErreur: erreurs => AfficherMessage.erreur("Impossible de composer le document", { erreurs })
    });
  }, [composerActeMisAJour]);

  const gererSourisRelachee = () => {
    if (modeAffichage !== "texte" || !extraireTexte) return;

    const selection = window.getSelection();
    const texte = selection?.toString();
    if (!texte) return;

    const texteNettoye = nettoyerTexteSelectionne(texte);
    if (texteNettoye.length > 0) {
      extraireTexte(texteNettoye);
      selection?.removeAllRanges();
    }
  };

  return (
    <OngletsContenu estActif={estActif}>
      <div className="flex h-[calc(100vh-16rem)] flex-col">
        {/* Only show alerts if needed, or keep generic layout */}

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
          <h2 className="text-sm font-semibold text-gray-700">Acte Mis à Jour</h2>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setModeAffichage("pdf")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                modeAffichage === "pdf" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FiEye className="h-3.5 w-3.5" />
              PDF
            </button>
            <button
              onClick={() => setModeAffichage("texte")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                modeAffichage === "texte" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <HiCursorClick className="h-3.5 w-3.5" />
              Texte
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {modeAffichage === "pdf" ? (
            <AffichageDocument
              contenuBase64={contenuActeMisAJour}
              typeZoom={90}
              typeMime={EMimeType.APPLI_PDF}
            />
          ) : (
            <div className="relative h-full w-full overflow-y-auto bg-gray-100 py-8">
              <div
                className="mx-auto min-h-[842px] w-[595px] bg-white px-12 py-16 shadow-xl transition-colors selection:bg-emerald-200 selection:text-emerald-900"
                onMouseUp={gererSourisRelachee}
              >
                {donneesActe ? (
                  <div className="flex h-full flex-col font-mono text-sm text-gray-900">
                    <pre className="w-full whitespace-pre-wrap text-justify font-mono leading-relaxed">{donneesActe.texte_corps_acte}</pre>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <div className="text-center">
                      <FiFileText className="mx-auto mb-2 h-12 w-12" />
                      <p>Aucune donnée textuelle disponible</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </OngletsContenu>
  );
};

export default OngletActeMisAJour;
