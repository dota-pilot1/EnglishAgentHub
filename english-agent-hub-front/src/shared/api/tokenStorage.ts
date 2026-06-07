const ACCESS_KEY = "twilio.accessToken";
const REFRESH_KEY = "twilio.refreshToken";

let accessMemory: string | null = null;

export const tokenStorage = {
  getAccess(): string | null {
    if (accessMemory !== null) return accessMemory;
    if (typeof window === "undefined") return null;
    accessMemory = window.localStorage.getItem(ACCESS_KEY);
    return accessMemory;
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    accessMemory = access;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACCESS_KEY, access);
      window.localStorage.setItem(REFRESH_KEY, refresh);
    }
  },
  clear() {
    accessMemory = null;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACCESS_KEY);
      window.localStorage.removeItem(REFRESH_KEY);
    }
  },
};
