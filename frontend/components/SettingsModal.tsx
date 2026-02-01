"use client";

import React from "react";
import { useSettings } from "@/contexts/SettingsContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-purple-500 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-pixel text-lg text-purple-400">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Music Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-white text-sm">Background Music</label>
            <button
              onClick={() => updateSettings({ musicEnabled: !settings.musicEnabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.musicEnabled ? "bg-purple-600" : "bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.musicEnabled ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          {settings.musicEnabled && (
            <div className="pl-4 border-l-2 border-gray-700">
              <label className="text-gray-400 text-xs block mb-2">
                Music Volume: {Math.round(settings.musicVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.musicVolume * 100}
                onChange={(e) =>
                  updateSettings({ musicVolume: parseInt(e.target.value) / 100 })
                }
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          )}

          <div className="border-t border-gray-800 my-4" />

          {/* SFX Settings */}
          <div className="flex items-center justify-between">
            <label className="text-white text-sm">Sound Effects</label>
            <button
              onClick={() => updateSettings({ sfxEnabled: !settings.sfxEnabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.sfxEnabled ? "bg-purple-600" : "bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.sfxEnabled ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          {settings.sfxEnabled && (
            <div className="pl-4 border-l-2 border-gray-700">
              <label className="text-gray-400 text-xs block mb-2">
                SFX Volume: {Math.round(settings.sfxVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.sfxVolume * 100}
                onChange={(e) =>
                  updateSettings({ sfxVolume: parseInt(e.target.value) / 100 })
                }
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
          <button
            onClick={resetSettings}
            className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Settings button component for use in game header
export function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
      aria-label="Open settings"
      title="Settings"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>
  );
}

// Quick music toggle button for game header
export function MusicToggleButton() {
  const { settings, toggleMusic } = useSettings();

  return (
    <button
      onClick={toggleMusic}
      className="p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
      aria-label={settings.musicEnabled ? "Mute music" : "Unmute music"}
      title={settings.musicEnabled ? "Music On" : "Music Off"}
    >
      {settings.musicEnabled ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-purple-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
          />
        </svg>
      )}
    </button>
  );
}
