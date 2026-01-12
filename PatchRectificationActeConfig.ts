import { ETATCIVIL_API } from "@api/ApiDisponibles";
import { TConfigurationApi } from "@model/api/Api";
import { IFicheActeDto } from "@model/etatcivil/acte/FicheActe";

const URI = "/acte/:idActe/double-numerique/rectifications-infos-acte";

// Utilise IFicheActeDto car il contient tous les éléments nécessaires pour naissance, mariage et décès
export const CONFIG_PATCH_RECTIFICATIONS_INFOS_ACTE: TConfigurationApi<typeof URI, Partial<IFicheActeDto>, undefined, IFicheActeDto> = {
  api: ETATCIVIL_API,
  methode: "PATCH",
  uri: URI
};
