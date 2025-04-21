"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import "@excalidraw/excalidraw/index.css";
import {
  ExcalidrawProps,
  AppState,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";

interface ExcalidrawWrapperProps extends ExcalidrawProps {
  onChange?: (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles
  ) => void;
}

const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = (props) => {
  return <Excalidraw {...props} />;
};

ExcalidrawWrapper.displayName = "ExcalidrawWrapper";

export default ExcalidrawWrapper;
