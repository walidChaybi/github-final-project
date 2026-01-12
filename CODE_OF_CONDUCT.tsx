import { useFormikContext } from "formik";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { EditionMiseAJourContext } from "../../contexts/EditionMiseAJourContextProvider";
import { getChampSuivant } from "../../utils/NavigationChamps";
import { convertirTexteFrancaisEnValeur, detecterTypeChamp } from "../../utils/SelectionTexteUtils";

const DUREE_AFFICHAGE_MESSAGE = 3000;
const DELAI_PASSAGE_FOCUS = 50;

export const useVerificationFormulaire = () => {
  const { enregistrerGestionnaireTexte } = useContext(EditionMiseAJourContext.Actions);
  const formik = useFormikContext();

  const [champActif, setChampActif] = useState<string | null>(null);
  const [derniereAction, setDerniereAction] = useState<{ type: "succes" | "erreur"; message: string } | null>(null);

  const champActifRef = useRef<string | null>(null);

  const gererFocusChamp = useCallback((nomChamp: string) => {
    setChampActif(nomChamp);
    champActifRef.current = nomChamp;
  }, []);

  const gererExtractionTexte = useCallback(
    (texte: string) => {
      const actuel = champActifRef.current;

      if (!actuel) {
        setDerniereAction({ type: "erreur", message: "Sélectionnez un champ d'abord!" });
        return;
      }

      if (!formik) {
        console.warn("Référence au formulaire manquante.");
        return;
      }

      const typeChamp = detecterTypeChamp(actuel);
      const valeurFinale = convertirTexteFrancaisEnValeur(texte, typeChamp);

      formik.setFieldValue(actuel, valeurFinale);

      const aEteConverti = valeurFinale !== texte;
      setDerniereAction({
        type: "succes",
        message: aEteConverti ? `Converti : "${texte.substring(0, 10)}..." → ${valeurFinale}` : `Copié : "${valeurFinale.substring(0, 15)}"`
      });

      setTimeout(() => {
        const champSuivant = getChampSuivant(actuel);
        if (champSuivant) {
          const element = document.getElementById(champSuivant);
          if (element) {
            element.focus();
            gererFocusChamp(champSuivant);
          }
        } else {
          setDerniereAction({ type: "succes", message: "Dernier champ atteint !" });
        }
      }, DELAI_PASSAGE_FOCUS);
    },
    [formik, gererFocusChamp]
  );

  useEffect(() => {
    if (!derniereAction) return;
    const timer = setTimeout(() => setDerniereAction(null), DUREE_AFFICHAGE_MESSAGE);
    return () => clearTimeout(timer);
  }, [derniereAction]);

  useEffect(() => {
    if (enregistrerGestionnaireTexte) {
      enregistrerGestionnaireTexte(gererExtractionTexte);
    }
  }, [enregistrerGestionnaireTexte, gererExtractionTexte]);

  return {
    champActif,
    derniereAction,
    gererFocusChamp
  };
};
