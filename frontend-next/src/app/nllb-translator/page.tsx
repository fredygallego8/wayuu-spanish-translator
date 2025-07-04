"use client";

import { useState } from "react";

interface TranslationResult {
  translatedText: string;
  confidence: number;
  sourceLanguage: string;
  targetLanguage: string;
  model: string;
  processingTime: number;
}

export default function NllbTranslatorPage() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState<"wayuu" | "spanish">("wayuu");
  const [targetLang, setTargetLang] = useState<"wayuu" | "spanish">("spanish");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<TranslationResult | null>(null);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError("Por favor ingresa un texto para traducir");
      return;
    }

    setIsLoading(true);
    setError("");
    setTranslatedText("");
    setLastResult(null);

    // 🔧 AbortController with 30s timeout aligned with backend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("/api/nllb/translate/smart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sourceText,
          sourceLang,
          targetLang,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error ${response.status}: ${errorData}`);
      }

      const result: TranslationResult = await response.json();
      setTranslatedText(result.translatedText);
      setLastResult(result);
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === "AbortError") {
        setError(
          "⏱️ Traducción cancelada por timeout (30s) - intenta con un texto más corto"
        );
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    const newSourceLang = targetLang;
    const newTargetLang = sourceLang;
    setSourceLang(newSourceLang);
    setTargetLang(newTargetLang);

    // Swap texts if both have content
    if (sourceText && translatedText) {
      setSourceText(translatedText);
      setTranslatedText(sourceText);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🧠 NLLB Translator Pro
          </h1>
          <p className="text-lg text-gray-600">
            Traducción inteligente Wayuu ↔ Español con fallback automático y
            timeouts empresariales
          </p>
        </div>

        {/* Translation Interface */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Language Selector */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <select
                value={sourceLang}
                onChange={(e) =>
                  setSourceLang(e.target.value as "wayuu" | "spanish")
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="wayuu">Wayuunaiki</option>
                <option value="spanish">Español</option>
              </select>

              <button
                onClick={handleSwapLanguages}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                title="Intercambiar idiomas"
              >
                ↔️
              </button>

              <select
                value={targetLang}
                onChange={(e) =>
                  setTargetLang(e.target.value as "wayuu" | "spanish")
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="spanish">Español</option>
                <option value="wayuu">Wayuunaiki</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              ⏱️ Timeout: 30s | 🔧 Fallback: Automático
            </div>
          </div>

          {/* Translation Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto origen (
                {sourceLang === "wayuu" ? "Wayuunaiki" : "Español"})
              </label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder={
                  sourceLang === "wayuu"
                    ? "Escribe en wayuunaiki aquí..."
                    : "Escribe en español aquí..."
                }
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isLoading}
              />
              <div className="text-sm text-gray-500 mt-1">
                {sourceText.length} caracteres
              </div>
            </div>

            {/* Translated Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto traducido (
                {targetLang === "wayuu" ? "Wayuunaiki" : "Español"})
              </label>
              <textarea
                value={translatedText}
                readOnly
                placeholder="La traducción aparecerá aquí..."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg bg-gray-50 resize-none"
              />
              {lastResult && (
                <div className="text-sm text-gray-500 mt-1">
                  Confianza: {(lastResult.confidence * 100).toFixed(1)}% |
                  Tiempo: {lastResult.processingTime}ms | Modelo:{" "}
                  {lastResult.model.includes("distilled")
                    ? "600M (Fallback)"
                    : "3.3B"}
                </div>
              )}
            </div>
          </div>

          {/* Translate Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleTranslate}
              disabled={
                isLoading || !sourceText.trim() || sourceLang === targetLang
              }
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Traduciendo...</span>
                </>
              ) : (
                <>
                  <span>🚀 Traducir</span>
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🎯 Precisión Nativa
            </h3>
            <p className="text-gray-600 text-sm">
              Traduce directamente entre wayuunaiki (guc_Latn) y español
              (spa_Latn) sin pivote inglés.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              ⏱️ Timeouts Inteligentes
            </h3>
            <p className="text-gray-600 text-sm">
              Timeout de 30s alineado con el frontend. Control de errores
              robusto y recuperación automática.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🔧 Fallback Automático
            </h3>
            <p className="text-gray-600 text-sm">
              Si NLLB-200-3.3B falla, automáticamente intenta con el modelo
              distilled-600M.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
