import { toast } from "sonner";
import { AxiosError } from "axios";

interface ApiError {
  detail?: string;
  message?: string;
}

export function handleApiError(
  error: unknown,
  fallbackMessage: string = "An error occurred"
): void {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError | undefined;
    const errorMessage =
      apiError?.detail || apiError?.message || error.message || fallbackMessage;
    toast.error(errorMessage);
    return;
  }

  if (error instanceof Error) {
    toast.error(error.message);
    return;
  }

  toast.error(fallbackMessage);
}
