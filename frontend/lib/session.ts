/** Session-scoped display name (not persisted to Supabase). */
export const SESSION_USERNAME_KEY = "youtube2rpg_username";

export function getSessionUsername(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_USERNAME_KEY);
}

export function setSessionUsername(username: string): void {
  sessionStorage.setItem(SESSION_USERNAME_KEY, username);
}

export function clearSessionUsername(): void {
  sessionStorage.removeItem(SESSION_USERNAME_KEY);
}

export function validateUsername(trimmed: string): string | null {
  if (trimmed.length < 3) {
    return "Username must be at least 3 characters";
  }
  if (trimmed.length > 20) {
    return "Username must be 20 characters or less";
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return "Username can only contain letters, numbers, underscores, and hyphens";
  }
  return null;
}
