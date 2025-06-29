// Translation types
export interface TranslationRequest extends Record<string, unknown> {
  text: string;
  direction: 'wayuu-to-spanish' | 'spanish-to-wayuu';
}

export interface TranslationResponse {
  translatedText: string;
  confidence: number;
  alternatives?: string[];
  contextInfo?: string;
}

// Dataset types
export interface DatasetInfo {
  totalEntries: number;
  uniqueWayuuWords: number;
  uniqueSpanishWords: number;
  averageSpanishWordsPerEntry: number;
  datasetInfo?: {
    source: string;
  };
  lastLoaded?: string;
}

export interface AudioStats {
  totalAudioEntries: number;
  uniqueWayuuWords: number;
  totalDurationMinutes: number;
  averageDurationSeconds: number;
  averageTranscriptionLength: number;
}

export interface CacheInfo {
  exists: boolean;
  size?: string;
  metadata?: {
    totalEntries: number;
  };
}

export interface Source {
  id: string;
  name: string;
  type: 'dictionary' | 'audio' | 'mixed';
  description: string;
  url: string;
  dataset: string;
  isActive: boolean;
  priority: number;
}

export interface SourcePreview {
  source: {
    name: string;
  };
  totalEntries: number;
  loadedEntries: number;
  preview: Array<{
    row: {
      guc: string;
      es: string;
    };
  }>;
}

export interface SourcesResponse {
  sources: Source[];
}

// UI States
export interface LoadingProgress {
  percentage: number;
  message: string;
  isVisible: boolean;
}

export interface NotificationState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

// Sound types
export interface SoundConfig {
  enabled: boolean;
  volume: number;
  sounds: {
    click: string;
    translate: string;
    success: string;
    error: string;
    typing: string;
  };
}

// Animation types
export interface AnimationConfig {
  duration: number;
  easing: string;
  enabled: boolean;
}

// App state
export interface AppState {
  currentDirection: 'wayuu-to-spanish' | 'spanish-to-wayuu';
  isTranslating: boolean;
  loadingProgress: LoadingProgress;
  notifications: NotificationState[];
  soundConfig: SoundConfig;
  animationConfig: AnimationConfig;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
} 