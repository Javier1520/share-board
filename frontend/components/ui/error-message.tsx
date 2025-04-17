interface ErrorMessageProps {
  message: string;
  retryAction?: () => void;
}

export function ErrorMessage({ message, retryAction }: ErrorMessageProps) {
  return (
    <div className="rounded-lg bg-red-900/50 border border-red-500 p-4 text-center">
      <p className="text-red-200">{message}</p>
      {retryAction && (
        <button
          onClick={retryAction}
          className="mt-2 text-red-300 hover:text-red-200 underline text-sm"
        >
          Try again
        </button>
      )}
    </div>
  );
}