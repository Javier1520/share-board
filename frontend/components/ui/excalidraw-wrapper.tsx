"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { ExcalidrawProps } from "@excalidraw/excalidraw/types";
import { forwardRef } from "react";

const ExcalidrawWrapper = forwardRef<any, ExcalidrawProps>((props, ref) => {
  return <Excalidraw ref={ref} {...props} />;
});

ExcalidrawWrapper.displayName = "ExcalidrawWrapper";

export default ExcalidrawWrapper;
