"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const isAuthenticated = await checkAuth();
      const isAuthPage =
        pathname.startsWith("/login") || pathname.startsWith("/register");

      // Handle redirect after successful auth check
      if (!isAuthenticated && !isAuthPage && pathname !== "/") {
        const redirectPath = encodeURIComponent(pathname);
        router.push(`/login?redirect=${redirectPath}`);
      }
    };

    initAuth();
  }, [checkAuth, pathname, router]);

  return <>{children}</>;
}
