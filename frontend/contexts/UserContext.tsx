"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { User } from "@/lib/supabase";

const STORAGE_KEY = "youtube2rpg_username";

interface UserContextType {
  user: User | null;
  username: string | null;
  isLoading: boolean;
  showUsernameModal: boolean;
  setUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedUsername = localStorage.getItem(STORAGE_KEY);
      
      if (storedUsername) {
        setUsernameState(storedUsername);
        // Fetch user from API to get the full user object
        try {
          const response = await fetch(`/api/users?username=${encodeURIComponent(storedUsername)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setUser(data.user);
            } else {
              // User not found in DB, show modal to recreate
              setShowUsernameModal(true);
            }
          }
        } catch (error) {
          console.error("Error loading user:", error);
        }
      } else {
        // No stored username, show modal
        setShowUsernameModal(true);
      }
      
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const setUsername = async (
    newUsername: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check availability and create user
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to create user" };
      }

      // Save to localStorage and state
      localStorage.setItem(STORAGE_KEY, newUsername);
      setUsernameState(newUsername);
      setUser(data.user);
      setShowUsernameModal(false);

      return { success: true };
    } catch (error) {
      console.error("Error setting username:", error);
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setUsernameState(null);
    setShowUsernameModal(true);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        username,
        isLoading,
        showUsernameModal,
        setUsername,
        logout,
      }}
    >
      {children}
      {showUsernameModal && !isLoading && (
        <UsernameModal onSubmit={setUsername} />
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

// Username Modal Component
function UsernameModal({
  onSubmit,
}: {
  onSubmit: (username: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = username.trim();
    
    // Validation
    if (trimmed.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    
    if (trimmed.length > 20) {
      setError("Username must be 20 characters or less");
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setError("Username can only contain letters, numbers, underscores, and hyphens");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await onSubmit(trimmed);
    
    if (!result.success) {
      setError(result.error || "Failed to create username");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-purple-500 rounded-lg p-8 max-w-md w-full">
        <h2 className="font-pixel text-xl text-purple-400 mb-2 text-center">
          Welcome, Adventurer!
        </h2>
        <p className="text-gray-400 text-sm mb-6 text-center">
          Choose a username to save your progress across worlds
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username..."
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-2"
            autoFocus
            disabled={isSubmitting}
          />
          
          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || !username.trim()}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isSubmitting ? "Creating..." : "Start Adventure"}
          </button>
        </form>
        
        <p className="text-gray-500 text-xs mt-4 text-center">
          3-20 characters, letters, numbers, underscores, and hyphens only
        </p>
      </div>
    </div>
  );
}
