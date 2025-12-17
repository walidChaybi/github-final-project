import { useContext, useState } from "react";
import { EditionMiseAJourContext } from "../../../contexts/EditionMiseAJourContextProvider";
import PartieActe from "./PartieActe";
import PartieFormulaire from "./PartieFormulaire";

const MiseAJourRequete: React.FC = () => {
  const { estActeSigne } = useContext(EditionMiseAJourContext.Valeurs);
  const [activeFieldName, setActiveFieldName] = useState<string | null>(null);
  const [textExtractionHandler, setTextExtractionHandler] = useState<((text: string) => void) | null>(null);

  const handleTextExtracted = (text: string) => {
    if (textExtractionHandler) {
      textExtractionHandler(text);
    }
  };

  return (
    <div className="mt-3 flex gap-4 px-2">
      <PartieActe
        activeFieldName={activeFieldName}
        onTextExtracted={handleTextExtracted}
      />
      {!estActeSigne && (
        <PartieFormulaire
          onActiveFieldChange={setActiveFieldName}
          onTextHandlerChange={setTextExtractionHandler}
        />
      )}
    </div>
  );
};

export default MiseAJourRequete;
