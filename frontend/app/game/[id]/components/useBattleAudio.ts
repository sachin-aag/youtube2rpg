"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Settings } from "@/contexts/SettingsContext";

const BATTLE_MUSIC_URL = "/music/battle.mp3";

interface BattleAudioOptions {
  settings: Settings;
}

export function useBattleAudio({ settings }: BattleAudioOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize battle music on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    let isMounted = true;

    const audio = new Audio(BATTLE_MUSIC_URL);
    audio.loop = true;
    audio.volume = settings.musicVolume * 0.8; // Battle music slightly quieter
    audioRef.current = audio;

    // Start playing if music is enabled
    if (settings.musicEnabled) {
      audio.play()
        .then(() => {
          if (!isMounted) {
            // Component unmounted before play resolved
            audio.pause();
          }
        })
        .catch((e) => {
          // Only log if it's not an AbortError (which is expected on quick unmount)
          if (e.name !== "AbortError") {
            console.log("Battle music autoplay blocked:", e);
          }
        });
    }

    // Cleanup on unmount
    return () => {
      isMounted = false;
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []); // Only run on mount

  // Update volume when settings change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.musicEnabled ? settings.musicVolume * 0.8 : 0;
      
      if (settings.musicEnabled && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      } else if (!settings.musicEnabled && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [settings.musicEnabled, settings.musicVolume]);

  // Get or create audio context for sound effects
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || 
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play correct answer sound - pleasant ascending chime
  const playCorrectSound = useCallback(() => {
    if (!settings.sfxEnabled) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const volume = settings.sfxVolume * 0.3;

      // Create a pleasant two-tone ascending chime
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - major chord arpeggio
      
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.value = freq;
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const startTime = now + i * 0.08;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) {
      console.error("Error playing correct sound:", e);
    }
  }, [settings.sfxEnabled, settings.sfxVolume, getAudioContext]);

  // Play wrong answer sound - descending buzz
  const playWrongSound = useCallback(() => {
    if (!settings.sfxEnabled) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const volume = settings.sfxVolume * 0.25;

      // Create a descending "wrong" buzzer sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.35);

      // Add a second lower tone for "bummer" effect
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      
      osc2.type = "square";
      osc2.frequency.setValueAtTime(150, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(80, now + 0.25);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      gain2.gain.setValueAtTime(volume * 0.5, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      
      osc2.start(now + 0.05);
      osc2.stop(now + 0.3);
    } catch (e) {
      console.error("Error playing wrong sound:", e);
    }
  }, [settings.sfxEnabled, settings.sfxVolume, getAudioContext]);

  // Play damage sound - impact thud
  const playDamageSound = useCallback(() => {
    if (!settings.sfxEnabled) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const volume = settings.sfxVolume * 0.2;

      // Create a punchy impact sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.error("Error playing damage sound:", e);
    }
  }, [settings.sfxEnabled, settings.sfxVolume, getAudioContext]);

  // Play victory fanfare
  const playVictorySound = useCallback(() => {
    if (!settings.sfxEnabled) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const volume = settings.sfxVolume * 0.25;

      // Victory fanfare - ascending triumphant notes
      const notes = [
        { freq: 523.25, start: 0, duration: 0.15 },      // C5
        { freq: 659.25, start: 0.12, duration: 0.15 },   // E5
        { freq: 783.99, start: 0.24, duration: 0.15 },   // G5
        { freq: 1046.5, start: 0.36, duration: 0.4 },    // C6 (held)
      ];

      notes.forEach(({ freq, start, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "triangle";
        osc.frequency.value = freq;
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const startTime = now + start;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        gain.gain.setValueAtTime(volume, startTime + duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      });
    } catch (e) {
      console.error("Error playing victory sound:", e);
    }
  }, [settings.sfxEnabled, settings.sfxVolume, getAudioContext]);

  // Stop battle music (for when battle ends)
  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  return {
    playCorrectSound,
    playWrongSound,
    playDamageSound,
    playVictorySound,
    stopMusic,
  };
}
