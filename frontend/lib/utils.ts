import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Cookies from 'js-cookie';
import { config } from './config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CookieOptions {
  expires?: number;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export const setCookie = (name: string, value: string, options?: CookieOptions) => {
  const defaultOptions: CookieOptions = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  if (name === 'access_token') {
    defaultOptions.expires = config.tokenExpiry.access / (60 * 60 * 24); // Convert seconds to days
  } else if (name === 'refresh_token') {
    defaultOptions.expires = config.tokenExpiry.refresh / (60 * 60 * 24); // Convert seconds to days
  }

  Cookies.set(name, value, {
    ...defaultOptions,
    ...options,
  });
};

export const getCookie = (name: string): string | undefined => {
  return Cookies.get(name);
};

export const removeCookie = (name: string) => {
  Cookies.remove(name, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};
