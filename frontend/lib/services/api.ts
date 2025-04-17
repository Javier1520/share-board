import axios from "axios";
import { getCookie, setCookie, removeCookie } from "../utils";
import { useAppStore } from "../store";
import { handleApiError } from "../utils/error";
import { config } from "../config";
import { TokenRefreshResponse } from "../types";

// Auth-related endpoints that should skip token refresh
const AUTH_ENDPOINTS = ["/api/token", "/api/token/refresh", "/api/register"];

const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const accessToken = getCookie("access_token");
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    handleApiError(error, "Request failed");
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for auth endpoints and already retried requests
    const isAuthEndpoint = AUTH_ENDPOINTS.some((endpoint) =>
      originalRequest.url?.endsWith(endpoint)
    );

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      const refreshToken = getCookie("refresh_token");

      // If no refresh token, clear auth state and redirect to login
      if (!refreshToken) {
        removeCookie("access_token");
        useAppStore.getState().setUser(null);

        // Only redirect to login if we're in the browser
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          // Avoid redirect loop by checking if we're not already on an auth page
          if (
            !currentPath.startsWith("/login") &&
            !currentPath.startsWith("/register")
          ) {
            window.location.href = `/login?redirect=${encodeURIComponent(
              currentPath
            )}`;
          }
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<TokenRefreshResponse>(
          `${config.apiUrl}/api/token/refresh`,
          {
            refresh: refreshToken,
          }
        );

        const { access } = response.data;

        // Update the access token
        setCookie("access_token", access, {
          expires: config.tokenExpiry.access,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });

        // Update the auth header
        originalRequest.headers.Authorization = `Bearer ${access}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens and user data on refresh failure
        removeCookie("access_token");
        removeCookie("refresh_token");
        useAppStore.getState().setUser(null);

        // Only redirect to login if we're in the browser and not on an auth page
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (
            !currentPath.startsWith("/login") &&
            !currentPath.startsWith("/register")
          ) {
            window.location.href = `/login?redirect=${encodeURIComponent(
              currentPath
            )}`;
          }
        }

        handleApiError(refreshError, "Session expired. Please login again.");
        return Promise.reject(refreshError);
      }
    }

    handleApiError(error);
    return Promise.reject(error);
  }
);

export default api;
