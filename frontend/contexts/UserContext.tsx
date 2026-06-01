"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  SESSION_USERNAME_KEY,
  getSessionUsername,
  setSessionUsername,
  clearSessionUsername,
  validateUsername,
} from "@/lib/session";

interface UserContextType {
  username: string | null;
  isLoading: boolean;
  setUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
  clearSession: () => void;
  openDisplayNameModal: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);

  useEffect(() => {
    // One-time migration from persistent localStorage to session-only storage
    if (!getSessionUsername() && typeof window !== "undefined") {
      const legacy = localStorage.getItem(SESSION_USERNAME_KEY);
      if (legacy) {
        setSessionUsername(legacy);
        localStorage.removeItem(SESSION_USERNAME_KEY);
      }
    }
    setUsernameState(getSessionUsername());
    setIsLoading(false);
  }, []);

  const setUsername = async (
    newUsername: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmed = newUsername.trim();
    const validationError = validateUsername(trimmed);
    if (validationError) {
      return { success: false, error: validationError };
    }

    setSessionUsername(trimmed);
    setUsernameState(trimmed);
    setShowDisplayNameModal(false);
    return { success: true };
  };

  const clearSession = () => {
    clearSessionUsername();
    setUsernameState(null);
  };

  return (
    <UserContext.Provider
      value={{
        username,
        isLoading,
        setUsername,
        clearSession,
        openDisplayNameModal: () => setShowDisplayNameModal(true),
      }}
    >
      {children}
      {showDisplayNameModal && !isLoading && (
        <DisplayNameModal
          onSubmit={setUsername}
          onClose={() => setShowDisplayNameModal(false)}
        />
      )}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

function DisplayNameModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (username: string) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await onSubmit(name);
    if (!result.success) {
      setError(result.error || "Invalid username");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-lg border-2 border-purple-500 bg-gray-900 p-8">
        <h2 className="font-pixel mb-2 text-center text-xl text-purple-400">
          Display name
        </h2>
        <p className="mb-6 text-center text-sm text-gray-400">
          Optional — saved for this browser tab only, not sent to the cloud
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name..."
            className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            autoFocus
            disabled={isSubmitting}
          />

          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-700 py-3 font-semibold text-white transition-colors hover:bg-gray-600"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 rounded-lg bg-purple-600 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-700"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500">
          3–20 characters, letters, numbers, underscores, and hyphens
        </p>
      </div>
    </div>
  );
}

// Re-export for callers that still reference the key
export { SESSION_USERNAME_KEY };
