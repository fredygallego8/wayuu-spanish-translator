import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  AppState, 
  LoadingProgress, 
  NotificationState, 
  SoundConfig, 
  AnimationConfig 
} from '@/types';

interface AppStore extends AppState {
  // Actions
  setDirection: (direction: 'wayuu-to-spanish' | 'spanish-to-wayuu') => void;
  setTranslating: (isTranslating: boolean) => void;
  setLoadingProgress: (progress: Partial<LoadingProgress>) => void;
  addNotification: (notification: Omit<NotificationState, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  updateSoundConfig: (config: Partial<SoundConfig>) => void;
  updateAnimationConfig: (config: Partial<AnimationConfig>) => void;
  reset: () => void;
}

const initialState: AppState = {
  currentDirection: 'wayuu-to-spanish',
  isTranslating: false,
  loadingProgress: {
    percentage: 0,
    message: '',
    isVisible: false,
  },
  notifications: [],
  soundConfig: {
    enabled: true,
    volume: 0.7,
    sounds: {
      click: '/sounds/click.wav',
      translate: '/sounds/translate.wav',
      success: '/sounds/success.wav',
      error: '/sounds/error.wav',
      typing: '/sounds/typing.mp3',
    },
  },
  animationConfig: {
    duration: 300,
    easing: 'ease-out',
    enabled: true,
  },
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setDirection: (direction) =>
        set({ currentDirection: direction }, false, 'setDirection'),

      setTranslating: (isTranslating) =>
        set({ isTranslating }, false, 'setTranslating'),

      setLoadingProgress: (progress) =>
        set(
          (state) => ({
            loadingProgress: { ...state.loadingProgress, ...progress },
          }),
          false,
          'setLoadingProgress'
        ),

      addNotification: (notification) =>
        set(
          (state) => ({
            notifications: [
              ...state.notifications,
              {
                ...notification,
                id: Math.random().toString(36).substr(2, 9),
                isVisible: true,
              },
            ],
          }),
          false,
          'addNotification'
        ),

      removeNotification: (id) =>
        set(
          (state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }),
          false,
          'removeNotification'
        ),

      clearNotifications: () =>
        set({ notifications: [] }, false, 'clearNotifications'),

      updateSoundConfig: (config) =>
        set(
          (state) => ({
            soundConfig: { ...state.soundConfig, ...config },
          }),
          false,
          'updateSoundConfig'
        ),

      updateAnimationConfig: (config) =>
        set(
          (state) => ({
            animationConfig: { ...state.animationConfig, ...config },
          }),
          false,
          'updateAnimationConfig'
        ),

      reset: () => set(initialState, false, 'reset'),
    }),
    {
      name: 'wayuu-translator-store',
    }
  )
); 