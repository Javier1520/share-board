import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "rgb(31, 41, 55)",
          color: "white",
          border: "1px solid rgb(75, 85, 99)",
        },
        className: "dark",
      }}
    />
  );
}
