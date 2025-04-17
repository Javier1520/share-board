"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <Button onClick={reset} className="bg-purple-600 hover:bg-purple-700">
        Try again
      </Button>
    </div>
  );
}
