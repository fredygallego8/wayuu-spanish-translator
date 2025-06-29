import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useAppStore } from '@/stores/useAppStore';
import type { TranslationRequest, TranslationResponse } from '@/types';

export const useTranslation = () => {
  const [result, setResult] = useState<TranslationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    currentDirection, 
    isTranslating, 
    setTranslating, 
    addNotification 
  } = useAppStore();

  const translate = useCallback(async (text: string) => {
    if (!text.trim()) {
      addNotification({
        message: 'Por favor ingresa texto para traducir',
        type: 'error',
        isVisible: true,
      });
      return;
    }

    setTranslating(true);
    setError(null);
    setResult(null);

    try {
      const request: TranslationRequest = {
        text: text.trim(),
        direction: currentDirection,
      };

      const response = await apiClient.post<TranslationResponse>(
        '/translation/translate',
        request
      );

      if (response.success) {
        setResult(response.data);
        addNotification({
          message: 'Traducción completada exitosamente',
          type: 'success',
          isVisible: true,
        });
      } else {
        throw new Error(response.message || 'Error en la traducción');
      }
    } catch {
      const errorMessage = 'Error al traducir. Por favor intenta de nuevo.';
      setError(errorMessage);
      addNotification({
        message: errorMessage,
        type: 'error',
        isVisible: true,
      });
    } finally {
      setTranslating(false);
    }
  }, [currentDirection, setTranslating, addNotification]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    error,
    isTranslating,
    translate,
    clearResult,
    currentDirection,
  };
}; 