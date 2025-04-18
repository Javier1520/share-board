// First, create a wrapper component in a separate file, e.g., ExcalidrawWrapper.jsx
"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { ExcalidrawProps } from "@excalidraw/excalidraw/types";
import { JSX } from "react";

const ExcalidrawWrapper = (
  props: JSX.IntrinsicAttributes & ExcalidrawProps
) => {
  return <Excalidraw {...props} />;
};

export default ExcalidrawWrapper;
