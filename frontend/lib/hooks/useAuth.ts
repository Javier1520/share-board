import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { setCookie, removeCookie } from "@/lib/utils";
import { config } from "@/lib/config";
import {
  LoginCredentials,
  RegisterCredentials,
  AuthError,
  LoginResponse,
  RegisterResponse,
  TokenRefreshResponse,
} from "@/lib/types";
import api from "@/lib/services/api";
import { handleApiError } from "@/lib/utils/error";

export const useAuth = () => {
  const router = useRouter();
  const { setUser } = useAppStore();

  const handleAuthSuccess = useCallback(
    (response: LoginResponse) => {
      const { access, refresh } = response;

      setCookie("access_token", access, {
        expires: config.tokenExpiry.access,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      setCookie("refresh_token", refresh, {
        expires: config.tokenExpiry.refresh,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      router.push("/rooms");
    },
    [router]
  );

  const validateCredentials = (credentials: LoginCredentials): AuthError[] => {
    const errors: AuthError[] = [];

    if (!credentials.username || credentials.username.length < 3) {
      errors.push({
        field: "username",
        message: "Username must be at least 3 characters long",
      });
    }

    if (!credentials.password || credentials.password.length < 6) {
      errors.push({
        field: "password",
        message: "Password must be at least 6 characters long",
      });
    }

    return errors;
  };

  const checkAuth = useCallback(async () => {
    try {
      // Use OPTIONS request to /api/rooms to check if token is valid
      await api.options("/api/rooms");
      return true;
    } catch {
      setUser(null);
      return false;
    }
  }, [setUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      const credentials = { username, password };
      const errors = validateCredentials(credentials);

      if (errors.length > 0) {
        throw errors;
      }

      try {
        const response = await api.post<LoginResponse>(
          "/api/token",
          credentials
        );
        // Set username in store since we don't have a separate user endpoint
        setUser({ username });
        handleAuthSuccess(response.data);
      } catch (error) {
        handleApiError(error, "Login failed");
        throw error;
      }
    },
    [handleAuthSuccess, setUser]
  );

  const register = useCallback(
    async (username: string, email: string | undefined, password: string) => {
      const credentials: RegisterCredentials = { username, password };
      if (email?.trim()) {
        credentials.email = email;
      }

      const errors = validateCredentials(credentials);

      if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors.push({
          field: "email",
          message: "Please enter a valid email address",
        });
      }

      if (errors.length > 0) {
        throw errors;
      }

      try {
        // First register the user
        await api.post<RegisterResponse>("/api/register", credentials);

        // Then login to get tokens
        const loginResponse = await api.post<LoginResponse>("/api/token", {
          username,
          password,
        });

        // Set username in store since we don't have a separate user endpoint
        setUser({ username });
        handleAuthSuccess(loginResponse.data);
      } catch (error) {
        handleApiError(error, "Registration failed");
        throw error;
      }
    },
    [handleAuthSuccess, setUser]
  );

  const refreshToken = useCallback(async (refreshToken: string) => {
    try {
      const response = await api.post<TokenRefreshResponse>(
        "/api/token/refresh",
        {
          refresh: refreshToken,
        }
      );

      setCookie("access_token", response.data.access, {
        expires: config.tokenExpiry.access,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return response.data.access;
    } catch (error) {
      handleApiError(error, "Token refresh failed");
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    removeCookie("access_token");
    removeCookie("refresh_token");
    setUser(null);
    router.push("/login");
  }, [router, setUser]);

  return {
    login,
    register,
    logout,
    checkAuth,
    refreshToken,
  };
};
