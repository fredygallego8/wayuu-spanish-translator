import { useCallback, useRef, useEffect } from 'react';
import { Howl } from 'howler';
import { useAppStore } from '@/stores/useAppStore';

type SoundType = 'click' | 'translate' | 'success' | 'error' | 'typing';

export const useSound = () => {
  const { soundConfig } = useAppStore();
  const soundsRef = useRef<Record<string, Howl>>({});

  // Initialize sounds
  useEffect(() => {
    if (soundConfig.enabled) {
      Object.entries(soundConfig.sounds).forEach(([key, src]) => {
        if (!soundsRef.current[key]) {
          soundsRef.current[key] = new Howl({
            src: [src],
            volume: soundConfig.volume,
            preload: true,
            html5: true, // Use HTML5 Audio for better compatibility
          });
        } else {
          soundsRef.current[key].volume(soundConfig.volume);
        }
      });
    }

    // Cleanup function
    return () => {
      Object.values(soundsRef.current).forEach((sound) => {
        sound.unload();
      });
      soundsRef.current = {};
    };
  }, [soundConfig]);

  const playSound = useCallback((type: SoundType) => {
    if (!soundConfig.enabled || !soundsRef.current[type]) {
      return;
    }

    try {
      soundsRef.current[type].play();
    } catch (error) {
      console.warn(`Failed to play sound: ${type}`, error);
    }
  }, [soundConfig.enabled]);

  const stopSound = useCallback((type: SoundType) => {
    if (!soundsRef.current[type]) {
      return;
    }

    try {
      soundsRef.current[type].stop();
    } catch (error) {
      console.warn(`Failed to stop sound: ${type}`, error);
    }
  }, []);

  const pauseSound = useCallback((type: SoundType) => {
    if (!soundsRef.current[type]) {
      return;
    }

    try {
      soundsRef.current[type].pause();
    } catch (error) {
      console.warn(`Failed to pause sound: ${type}`, error);
    }
  }, []);

  const stopAllSounds = useCallback(() => {
    Object.values(soundsRef.current).forEach((sound) => {
      try {
        sound.stop();
      } catch (error) {
        console.warn('Failed to stop sound', error);
      }
    });
  }, []);

  return {
    playSound,
    stopSound,
    pauseSound,
    stopAllSounds,
    isEnabled: soundConfig.enabled,
    volume: soundConfig.volume,
  };
}; 