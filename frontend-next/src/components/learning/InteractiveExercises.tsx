"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PuzzlePieceIcon,
  SpeakerWaveIcon,
  MicrophoneIcon,
  BookOpenIcon,
  ChartBarIcon,
  CpuChipIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  PlayIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";

interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: string[];
  correctAnswer: string;
  hint: string;
  audio?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  culturalContext?: string;
}

type ExerciseType =
  | "vocabulary-massive"
  | "pronunciation"
  | "listening"
  | "vocabulary"
  | "pattern-recognition"
  | "translation-challenge"
  | "phonetic-pattern-advanced"
  | "cultural-context"
  | "adaptive-learning";

interface ExerciseTypeConfig {
  id: ExerciseType;
  name: string;
  description: string;
  icon: any;
  color: string;
}

const exerciseTypes: ExerciseTypeConfig[] = [
  {
    id: "vocabulary-massive",
    name: "Vocabulario Masivo",
    description: "Aprende con el dataset completo de 7K+ entradas",
    icon: PuzzlePieceIcon,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "pronunciation",
    name: "Pronunciación",
    description: "Practica la pronunciación con audio nativo",
    icon: SpeakerWaveIcon,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "listening",
    name: "Comprensión Auditiva",
    description: "Mejora tu comprensión con 810 archivos de audio",
    icon: MicrophoneIcon,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "vocabulary",
    name: "Vocabulario Básico",
    description: "Ejercicios fundamentales de vocabulario",
    icon: BookOpenIcon,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "pattern-recognition",
    name: "Reconocimiento de Patrones",
    description: "Identifica patrones fonéticos y gramaticales",
    icon: ChartBarIcon,
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: "phonetic-pattern-advanced",
    name: "Fonética Avanzada",
    description: "Análisis profundo de patrones fonéticos",
    icon: CpuChipIcon,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "cultural-context",
    name: "Contexto Cultural",
    description: "Aprende el significado cultural de las palabras",
    icon: GlobeAltIcon,
    color: "from-teal-500 to-green-500",
  },
  {
    id: "adaptive-learning",
    name: "Aprendizaje Adaptativo",
    description: "IA que se adapta a tu nivel de aprendizaje",
    icon: AcademicCapIcon,
    color: "from-violet-500 to-purple-500",
  },
];

export default function InteractiveExercises() {
  const [selectedType, setSelectedType] =
    useState<ExerciseType>("vocabulary-massive");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  // Progress tracking with localStorage
  const [progressStats, setProgressStats] = useState({
    totalExercises: 0,
    correctAnswers: 0,
    exercisesCompleted: 0,
    accuracy: 0,
    streakDays: 0,
    lastPlayDate: null as Date | null,
  });

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem("wayuu-learning-progress");
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setProgressStats({
          ...parsed,
          lastPlayDate: parsed.lastPlayDate
            ? new Date(parsed.lastPlayDate)
            : null,
        });
      } catch (error) {
        console.error("Error loading progress:", error);
      }
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (newStats: typeof progressStats) => {
    try {
      localStorage.setItem("wayuu-learning-progress", JSON.stringify(newStats));
      setProgressStats(newStats);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  // Update progress when exercise is completed
  const updateProgress = (isCorrect: boolean) => {
    const today = new Date();
    const lastPlay = progressStats.lastPlayDate;
    const isNewDay =
      !lastPlay || today.toDateString() !== lastPlay.toDateString();

    const newStats = {
      totalExercises: progressStats.totalExercises + 1,
      correctAnswers: progressStats.correctAnswers + (isCorrect ? 1 : 0),
      exercisesCompleted: progressStats.exercisesCompleted + 1,
      accuracy: 0,
      streakDays: isNewDay
        ? progressStats.streakDays + 1
        : progressStats.streakDays,
      lastPlayDate: today,
    };

    // Calculate accuracy
    newStats.accuracy =
      newStats.totalExercises > 0
        ? Math.round((newStats.correctAnswers / newStats.totalExercises) * 100)
        : 0;

    saveProgress(newStats);
  };

  const generateExercises = async () => {
    setIsGenerating(true);

    try {
      let exercisesData: Exercise[] = [];

      // Use real vocabulary for vocabulary-massive exercises
      if (selectedType === "vocabulary-massive") {
        // Generate multiple real vocabulary exercises
        const promises = Array(5)
          .fill(null)
          .map(() => generateRealVocabularyExercises());
        const results = await Promise.all(promises);
        exercisesData = results
          .flat()
          .filter((ex) => ex.options && ex.options.length > 0);

        // If we got some real exercises, add some mock ones to reach 10 total
        if (exercisesData.length > 0) {
          const mockExercises = generateMockExercises(selectedType);
          exercisesData = [...exercisesData, ...mockExercises].slice(0, 10);
        }
      }

      // Fallback to API call for other exercise types
      if (exercisesData.length === 0) {
        try {
          const response = await fetch(
            "http://localhost:3002/api/datasets/generate-exercises",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: selectedType,
                count: 10,
                difficulty: "mixed",
              }),
            }
          );

          if (response.ok) {
            const result = await response.json();
            exercisesData = result.data;
          }
        } catch (apiError) {
          console.log("API not available, using mock exercises");
        }
      }

      // Final fallback to mock exercises
      if (exercisesData.length === 0) {
        exercisesData = generateMockExercises(selectedType);
      }

      setExercises(exercisesData);
      setCurrentIndex(0);
      setShowExercises(true);
      setSelectedAnswer(null);
      setShowResult(false);
    } catch (error) {
      console.error("Error generating exercises:", error);
      // Final fallback to mock exercises
      const mockExercises = generateMockExercises(selectedType);
      setExercises(mockExercises);
      setCurrentIndex(0);
      setShowExercises(true);
      setSelectedAnswer(null);
      setShowResult(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockExercises = (type: ExerciseType): Exercise[] => {
    const baseExercises = {
      "vocabulary-massive": [
        {
          id: "1",
          type,
          question: '¿Cómo se dice "persona" en wayuunaiki?',
          options: ["wayuu", "alijuna", "süpüla", "kasua"],
          correctAnswer: "wayuu",
          hint: "Es la palabra que da nombre al pueblo wayuu",
          audio: "wayuu.mp3",
          difficulty: "beginner" as const,
        },
        {
          id: "2",
          type,
          question: '¿Cuál es el significado de "Maleiwa"?',
          options: ["Sol", "Creador", "Lluvia", "Viento"],
          correctAnswer: "Creador",
          hint: "Es la deidad suprema en la cosmogonía wayuu",
          difficulty: "intermediate" as const,
          culturalContext:
            "Maleiwa es el creador de todo lo que existe según la cosmogonía wayuu.",
        },
      ],
      pronunciation: [
        {
          id: "3",
          type,
          question: '¿Cómo se pronuncia correctamente "müshia"?',
          options: ["MU-shi-a", "mu-SHI-a", "mü-SHI-a", "MÜ-shi-a"],
          correctAnswer: "mü-SHI-a",
          hint: "El acento va en la segunda sílaba",
          audio: "mushia.mp3",
          difficulty: "intermediate" as const,
        },
      ],
      "cultural-context": [
        {
          id: "4",
          type,
          question: '¿Qué significado cultural tiene "wayuu"?',
          options: [
            "Guerrero",
            "Persona del desierto",
            "Nómada",
            "Persona, gente",
          ],
          correctAnswer: "Persona, gente",
          hint: "Se refiere a la identidad del pueblo",
          difficulty: "advanced" as const,
          culturalContext:
            "Wayuu significa 'persona' o 'gente' y es la autodenominación del pueblo.",
        },
      ],
    };

    // Return exercises for the selected type or default to vocabulary-massive
    return baseExercises[type] || baseExercises["vocabulary-massive"];
  };

  const generateRealVocabularyExercises = async (): Promise<Exercise[]> => {
    try {
      // Get random vocabulary entries from the backend
      const searchTerms = [
        "a",
        "e",
        "i",
        "o",
        "u",
        "wa",
        "ma",
        "ka",
        "la",
        "ta",
      ];
      const randomTerm =
        searchTerms[Math.floor(Math.random() * searchTerms.length)];

      const response = await fetch(
        `http://localhost:3002/api/datasets/dictionary/search?q=${randomTerm}&limit=20`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.result) {
          // Create exercise from real dictionary entry
          const entry = data.result;

          // Generate multiple choice options
          const correctAnswer = entry.spanish || entry.translation;
          const wrongOptions = [
            "agua",
            "tierra",
            "fuego",
            "viento",
            "sol",
            "luna",
            "estrella",
            "árbol",
            "casa",
            "familia",
            "amor",
            "paz",
            "tiempo",
            "vida",
          ]
            .filter((opt) => opt !== correctAnswer)
            .slice(0, 3);

          const allOptions = [correctAnswer, ...wrongOptions].sort(
            () => Math.random() - 0.5
          );

          return [
            {
              id: `real-${Date.now()}`,
              type: selectedType,
              question: `¿Cómo se dice "${entry.wayuu || entry.word}" en español?`,
              options: allOptions,
              correctAnswer,
              hint: `Esta palabra pertenece al vocabulario wayuu auténtico`,
              audio: entry.audio,
              difficulty: "intermediate" as const,
            },
          ];
        }
      }

      // Fallback to random vocabulary if API fails
      const fallbackTerms = [
        { wayuu: "wayuu", spanish: "persona" },
        { wayuu: "Maleiwa", spanish: "Creador" },
        { wayuu: "müshia", spanish: "nosotros" },
        { wayuu: "tü", spanish: "tú" },
        { wayuu: "süpüla", spanish: "tierra" },
      ];

      const randomEntry =
        fallbackTerms[Math.floor(Math.random() * fallbackTerms.length)];
      const wrongOptions = fallbackTerms
        .filter((t) => t.spanish !== randomEntry.spanish)
        .slice(0, 3)
        .map((t) => t.spanish);

      const allOptions = [randomEntry.spanish, ...wrongOptions].sort(
        () => Math.random() - 0.5
      );

      return [
        {
          id: `fallback-${Date.now()}`,
          type: selectedType,
          question: `¿Cómo se dice "${randomEntry.wayuu}" en español?`,
          options: allOptions,
          correctAnswer: randomEntry.spanish,
          hint: `Palabra fundamental del vocabulario wayuu`,
          difficulty: "beginner" as const,
        },
      ];
    } catch (error) {
      console.error("Error generating real vocabulary exercises:", error);
      return [];
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const submitAnswer = () => {
    if (!selectedAnswer) return;

    setShowResult(true);
    const isCorrect = selectedAnswer === exercises[currentIndex].correctAnswer;

    if (isCorrect) {
      setScore((prev) => ({
        correct: prev.correct + 1,
        total: prev.total + 1,
      }));
    } else {
      setScore((prev) => ({ ...prev, total: prev.total + 1 }));
    }

    // Update progress when exercise is completed
    updateProgress(isCorrect);
  };

  const nextExercise = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const previousExercise = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const playAudio = async (audioFile: string) => {
    try {
      setIsPlaying(true);

      // Try to play real audio file first
      const audioUrl = `http://localhost:3002/api/audio/files/${audioFile}`;
      const audio = new Audio(audioUrl);

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
      });

      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      // Mock audio playback as fallback
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsPlaying(false);
    }
  };

  const currentExercise = exercises[currentIndex];
  const selectedTypeConfig = exerciseTypes.find((t) => t.id === selectedType)!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          <PuzzlePieceIcon className="w-8 h-8 inline mr-3 text-blue-600" />
          Ejercicios Interactivos
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Practica wayuunaiki con 8 tipos de ejercicios diferentes, desde
          vocabulario masivo hasta análisis cultural profundo.
        </p>
      </div>

      {/* Progress Dashboard */}
      {progressStats.totalExercises > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <TrophyIcon className="w-6 h-6 text-yellow-600 mr-2" />
            Tu Progreso de Aprendizaje
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progressStats.exercisesCompleted}
              </div>
              <div className="text-sm text-gray-600">
                Ejercicios completados
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {progressStats.accuracy}%
              </div>
              <div className="text-sm text-gray-600">Precisión</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progressStats.streakDays}
              </div>
              <div className="text-sm text-gray-600">Días consecutivos</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.floor(progressStats.correctAnswers / 10)}
              </div>
              <div className="text-sm text-gray-600">Nivel alcanzado</div>
            </div>
          </div>
          <div className="mt-4 bg-white rounded-lg p-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                Progreso hacia el siguiente nivel:
              </span>
              <span className="font-medium text-gray-900">
                {progressStats.correctAnswers % 10}/10
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(progressStats.correctAnswers % 10) * 10}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {!showExercises ? (
        <>
          {/* Exercise Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exerciseTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;

              return (
                <motion.button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${type.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {type.name}
                  </h3>
                  <p className="text-sm text-gray-600">{type.description}</p>

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <CheckIcon className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Selected Type Info */}
          <motion.div
            key={selectedType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <div className="flex items-center mb-6">
              <div
                className={`w-16 h-16 rounded-lg bg-gradient-to-r ${selectedTypeConfig.color} flex items-center justify-center mr-6`}
              >
                <selectedTypeConfig.icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedTypeConfig.name}
                </h3>
                <p className="text-gray-600">
                  {selectedTypeConfig.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">10</div>
                <div className="text-sm text-gray-600">
                  Ejercicios por sesión
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">7K+</div>
                <div className="text-sm text-gray-600">Entradas de dataset</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">810</div>
                <div className="text-sm text-gray-600">Archivos de audio</div>
              </div>
            </div>

            <button
              onClick={generateExercises}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-lg transition-colors"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generando ejercicios...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Comenzar Ejercicios
                </div>
              )}
            </button>
          </motion.div>
        </>
      ) : (
        <AnimatePresence mode="wait">
          {/* Exercise View */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Pregunta {currentIndex + 1} de {exercises.length}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  Puntuación: {score.correct}/{score.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / exercises.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {currentExercise.question}
              </h3>

              {/* Audio Button */}
              {currentExercise.audio && (
                <button
                  onClick={() => playAudio(currentExercise.audio!)}
                  disabled={isPlaying}
                  className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <SpeakerWaveIcon className="w-5 h-5 mr-2" />
                  {isPlaying ? "Reproduciendo..." : "Escuchar audio"}
                </button>
              )}
            </div>

            {/* Options */}
            {currentExercise.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {currentExercise.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentExercise.correctAnswer;

                  let buttonClass =
                    "p-4 border-2 rounded-lg transition-all duration-200 text-left ";

                  if (showResult) {
                    if (isCorrect) {
                      buttonClass +=
                        "border-green-500 bg-green-50 text-green-700";
                    } else if (isSelected && !isCorrect) {
                      buttonClass += "border-red-500 bg-red-50 text-red-700";
                    } else {
                      buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
                    }
                  } else {
                    buttonClass += isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white hover:border-gray-300";
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => !showResult && handleAnswerSelect(option)}
                      disabled={showResult}
                      className={buttonClass}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option}</span>
                        {showResult && isCorrect && (
                          <CheckIcon className="w-5 h-5 text-green-600" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XMarkIcon className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Result and Hint */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div
                  className={`p-4 rounded-lg mb-4 ${
                    selectedAnswer === currentExercise.correctAnswer
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {selectedAnswer === currentExercise.correctAnswer ? (
                      <CheckIcon className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <XMarkIcon className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <span
                      className={`font-medium ${
                        selectedAnswer === currentExercise.correctAnswer
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {selectedAnswer === currentExercise.correctAnswer
                        ? "¡Correcto!"
                        : "Incorrecto"}
                    </span>
                  </div>
                  <p className="text-gray-700">
                    <strong>Pista:</strong> {currentExercise.hint}
                  </p>
                  {currentExercise.culturalContext && (
                    <p className="text-gray-700 mt-2">
                      <strong>Contexto cultural:</strong>{" "}
                      {currentExercise.culturalContext}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={previousExercise}
                disabled={currentIndex === 0}
                className="flex items-center px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Anterior
              </button>

              {!showResult ? (
                <button
                  onClick={submitAnswer}
                  disabled={!selectedAnswer}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Responder
                </button>
              ) : (
                <button
                  onClick={nextExercise}
                  disabled={currentIndex === exercises.length - 1}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentIndex === exercises.length - 1
                    ? "Finalizar"
                    : "Siguiente"}
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
