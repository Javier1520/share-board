"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import {
  ExcalidrawProps,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import { forwardRef } from "react";

// Extend ExcalidrawProps to explicitly include onChange
interface ExcalidrawWrapperProps extends ExcalidrawProps {
  onChange?: (elements: readonly any[], appState: any, files: any) => void;
}

const ExcalidrawWrapper = forwardRef<
  ExcalidrawImperativeAPI,
  ExcalidrawWrapperProps
>((props, ref) => {
  return <Excalidraw ref={ref} {...props} />;
});

ExcalidrawWrapper.displayName = "ExcalidrawWrapper";

export default ExcalidrawWrapper;
