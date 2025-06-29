"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, Languages } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { useSound } from "@/hooks/useSound";

export function DirectionToggle() {
  const { currentDirection, setDirection } = useAppStore();
  const { playSound } = useSound();

  const handleToggle = () => {
    playSound("click");
    const newDirection =
      currentDirection === "wayuu-to-spanish"
        ? "spanish-to-wayuu"
        : "wayuu-to-spanish";
    setDirection(newDirection);
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50 flex items-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Wayuu Button */}
        <motion.button
          onClick={() => {
            if (currentDirection !== "wayuu-to-spanish") {
              handleToggle();
            }
          }}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
            currentDirection === "wayuu-to-spanish"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-red-400"
            animate={{
              scale: currentDirection === "wayuu-to-spanish" ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
          />
          <span>Wayuunaiki</span>
        </motion.button>

        {/* Toggle Arrow */}
        <motion.button
          onClick={handleToggle}
          className="p-3 mx-2 rounded-xl hover:bg-gray-100 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Cambiar dirección de traducción"
        >
          <motion.div
            animate={{
              rotate: currentDirection === "wayuu-to-spanish" ? 0 : 180,
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <ArrowLeftRight className="w-5 h-5 text-gray-600" />
          </motion.div>
        </motion.button>

        {/* Spanish Button */}
        <motion.button
          onClick={() => {
            if (currentDirection !== "spanish-to-wayuu") {
              handleToggle();
            }
          }}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
            currentDirection === "spanish-to-wayuu"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
            animate={{
              scale: currentDirection === "spanish-to-wayuu" ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
          />
          <span>Español</span>
        </motion.button>
      </motion.div>

      {/* Direction Indicator */}
      <motion.div
        className="ml-4 hidden md:flex items-center space-x-2 text-sm text-gray-600"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Languages className="w-4 h-4" />
        <span>
          {currentDirection === "wayuu-to-spanish"
            ? "Wayuu → Español"
            : "Español → Wayuu"}
        </span>
      </motion.div>
    </div>
  );
}
