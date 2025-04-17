export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000",
  tokenExpiry: {
    access: 5 * 60, // 5 minutes in seconds
    refresh: 24 * 60 * 60, // 24 hours in seconds
  },
} as const;
