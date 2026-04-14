// C:\Users\soren\rewritelabs.io\engine\operatorConsole\ui\components\DocsDiffViewer.jsx

import DiffViewer from "react-diff-viewer";
import {useDocsStore} from "../state/useDocsStore";

export default function DocsDiffViewer() {
  const { oldVersionContent, newVersionContent )} = useDocsStore();

  return (
    <DiffViewer
      oldValue={oldVersionContent}
      newValue={newVersionContent}
      splitView={true}
    />
  );
}



