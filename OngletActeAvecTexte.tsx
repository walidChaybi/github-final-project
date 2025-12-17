import { compositionApi } from "@api/appels/compositionApi";
import {
  CONFIG_GET_DONNEES_POUR_COMPOSITION_ACTE_TEXTE_MIS_A_JOUR,
  IDonneesCompositionActeTexteResponse,
  parseDonneesCompositionActeTexte
} from "@api/configurations/etatCivil/acte/GetDonneesPourCompositionActeTexteMisAJourConfigApi";
import AffichageDocument from "@composants/commun/affichageDocument/AffichageDocument";
import OngletsContenu from "@composants/commun/onglets/OngletsContenu";
import React, { useContext, useEffect, useState } from "react";
import { FiFileText, FiEye } from "react-icons/fi";
import { HiCursorClick } from "react-icons/hi";
import { EditionMiseAJourContext } from "../../../../contexts/EditionMiseAJourContextProvider";
import useFetchApi from "../../../../hooks/api/FetchApiHook";
import { EMimeType } from "../../../../ressources/EMimeType";
import AfficherMessage from "../../../../utils/AfficherMessage";
import { cleanSelectedText } from "../../../../utils/textSelectionUtils";
import { AlertesActes } from "../../../../views/common/composant/alertesActe/AlertesActes";

interface IOngletActeAvecTexteProps {
  estActif: boolean;
  onTextExtracted?: (text: string) => void;
  activeFieldName?: string | null;
}

type ViewMode = "pdf" | "text";

const OngletActeAvecTexte: React.FC<IOngletActeAvecTexteProps> = ({
  estActif,
  onTextExtracted,
  activeFieldName
}) => {
  const { idActe, estActeSigne } = useContext(EditionMiseAJourContext.Valeurs);
  const [contenuActe, setContenuActe] = useState<string | null>(null);
  const [corpTexte, setCorpTexte] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("pdf");
  const [highlight, setHighlight] = useState(false);

  const { appelApi: recupererDonneesCompositionActeTexte } = useFetchApi(
    CONFIG_GET_DONNEES_POUR_COMPOSITION_ACTE_TEXTE_MIS_A_JOUR
  );

  useEffect(() => {
    if (!idActe || (contenuActe !== null && !estActeSigne)) return;

    recupererDonneesCompositionActeTexte({
      parametres: { path: { idActe } },
      apresSucces: donneesPourCompositionActeTexte => {
        // First, get PDF content
        compositionApi
          .getCompositionActeTexte(donneesPourCompositionActeTexte)
          .then(dataComposition => {
            setContenuActe(dataComposition.body.data.contenu ?? "");
          });

        // Then, parse the nested JSON to extract texte_corps_acte
        // The response might be a string or an object with errors/data structure
        try {
          let parsedResponse: IDonneesCompositionActeTexteResponse;
          
          if (typeof donneesPourCompositionActeTexte === "string") {
            // If it's already a string, try to parse it as JSON
            try {
              parsedResponse = JSON.parse(donneesPourCompositionActeTexte);
            } catch {
              // If parsing fails, it might be the data field directly
              parsedResponse = { errors: [], data: donneesPourCompositionActeTexte };
            }
          } else {
            // If it's an object, use it directly
            parsedResponse = donneesPourCompositionActeTexte as unknown as IDonneesCompositionActeTexteResponse;
          }

          const parsedData = parseDonneesCompositionActeTexte(parsedResponse);
          if (parsedData?.texte_corps_acte) {
            setCorpTexte(parsedData.texte_corps_acte);
          }
        } catch (error) {
          console.error("Error extracting texte_corps_acte:", error);
        }
      },
      apresErreur: erreurs =>
        AfficherMessage.erreur("Une erreur est survenue lors de la récupération de l'acte texte.", {
          erreurs
        })
    });
  }, [idActe, estActeSigne]);

  useEffect(() => {
    if (activeFieldName) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 300);
      return () => clearTimeout(timer);
    }
  }, [activeFieldName]);

  const handleMouseUp = () => {
    if (viewMode !== "text" || !onTextExtracted) return;

    const selection = window.getSelection();
    const text = selection?.toString();
    
    if (!text) return;

    const cleanText = cleanSelectedText(text);
    
    if (cleanText.length > 0) {
      onTextExtracted(cleanText);
      selection?.removeAllRanges();
    }
  };

  return (
    <OngletsContenu estActif={estActif}>
      <div className="flex h-[calc(100vh-16rem)] flex-col">
        <AlertesActes idActeInit={idActe} />
        
        {/* Tab switcher */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
          <h2 className="text-sm font-semibold text-gray-700">Document Source</h2>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setViewMode("pdf")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "pdf"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FiEye className="h-3.5 w-3.5" />
              PDF
            </button>
            <button
              onClick={() => setViewMode("text")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "text"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <HiCursorClick className="h-3.5 w-3.5" />
              Texte
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "pdf" ? (
            <AffichageDocument
              contenuBase64={contenuActe}
              typeZoom={90}
              typeMime={EMimeType.APPLI_PDF}
            />
          ) : (
            <div className="relative h-full w-full overflow-y-auto bg-white">
              {/* Visual guide */}
              {onTextExtracted && (
                <div className="absolute top-2 right-4 z-10 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-800 opacity-90">
                  ⚡️ Surlignez pour convertir & remplir
                </div>
              )}
              
              {/* Text content */}
              <div
                className={`h-full w-full p-6 font-mono text-sm leading-relaxed text-gray-800 ${
                  highlight ? "bg-blue-50" : ""
                }`}
                style={{ whiteSpace: "pre-wrap", cursor: "text" }}
                onMouseUp={handleMouseUp}
              >
                {corpTexte ? (
                  corpTexte.split(/\n|\\n/).map((line, index, array) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < array.length - 1 && <br />}
                    </React.Fragment>
                  ))
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <div className="text-center">
                      <FiFileText className="mx-auto mb-2 h-12 w-12" />
                      <p>Aucun texte disponible</p>
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

export default OngletActeAvecTexte;

