import { ETATCIVIL_API } from "@api/ApiDisponibles";
import { TConfigurationApi } from "@model/api/Api";

const URI = "/acte/:idActe/donnees-pour-composition-acte-texte-mis-a-jour";

/**
 * Response structure from the endpoint
 * The endpoint returns { errors: [], data: "..." } where data is a JSON string
 */
export interface IDonneesCompositionActeTexteResponse {
  errors: unknown[];
  data: string; // JSON string that needs to be parsed
}

/**
 * Parsed data structure from the nested JSON
 */
export interface IDonneesCompositionActeTexteParsed {
  reference_acte: string | null;
  reference_registre_papier?: string;
  nature_acte?: string;
  titulaires?: string;
  texte_corps_acte: string;
  mentions?: string;
}

/**
 * Parse the nested JSON response to extract texte_corps_acte
 */
export const parseDonneesCompositionActeTexte = (response: IDonneesCompositionActeTexteResponse): IDonneesCompositionActeTexteParsed | null => {
  try {
    if (!response.data) {
      return null;
    }
    
    // Parse the JSON string in data field
    const parsedData = JSON.parse(response.data) as IDonneesCompositionActeTexteParsed;
    return parsedData;
  } catch (error) {
    console.error("Error parsing donnees composition acte texte:", error);
    return null;
  }
};

export const CONFIG_GET_DONNEES_POUR_COMPOSITION_ACTE_TEXTE_MIS_A_JOUR: TConfigurationApi<typeof URI, undefined, undefined, string> = {
  api: ETATCIVIL_API,
  methode: "GET",
  uri: URI
};
