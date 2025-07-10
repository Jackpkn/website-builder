"use client";
import { useState, useEffect, type FC, type ChangeEvent } from "react";

import { motion } from "framer-motion";
import { Sparkles, Wand2, Zap, ArrowRight, Lightbulb } from "lucide-react";
import Navbar from "./Navbar"; // Assuming you have a Navbar component
import { useRouter } from "next/navigation";

// Define Props for EnhancedTextarea
interface EnhancedTextareaProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
}

// Enhanced Textarea Component
const EnhancedTextarea: FC<EnhancedTextareaProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [charCount, setCharCount] = useState<number>(value.length);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Central handler for all value changes to keep state (like charCount) in sync.
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e); // Propagate the event to the parent
    setCharCount(e.target.value.length);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  // Creates a synthetic event when a suggestion is clicked, ensuring
  // the main handleChange function is called for consistent behavior.
  const handleSuggestionClick = (suggestion: string) => {
    const syntheticEvent = {
      target: { value: suggestion },
    } as ChangeEvent<HTMLTextAreaElement>;
    handleChange(syntheticEvent);
  };

  const suggestions: string[] = [
    "A modern e-commerce store with dark theme and animations",
    "Portfolio website for a creative designer with image gallery",
    "Corporate landing page with contact forms and testimonials",
    "Restaurant website with menu and online booking system",
  ];

  return (
    <div className="relative">
      {/* Main Textarea Container */}
      <div
        className={`relative group transition-all duration-500 ${isFocused ? "scale-[1.02]" : ""
          }`}
      >
        {/* Enhanced Glow Effect */}
        <div
          className={`absolute -inset-2 bg-gradient-to-r from-transparent via-teal-500/40 to-transparent rounded-3xl blur-xl transition-all duration-500 ${isFocused ? "opacity-100 scale-110" : "opacity-0 scale-95"
            }`}
        ></div>

        {/* Secondary Glow */}
        <div
          className={`absolute -inset-1 bg-gradient-to-r from-black/50 via-teal-400/30 to-black/50 rounded-2xl blur-lg transition-all duration-300 ${isFocused ? "opacity-100" : "opacity-0"
            }`}
        ></div>

        {/* Textarea Container */}
        <div
          className={`relative bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-2 rounded-2xl p-6 transition-all duration-300 ${isFocused
            ? "border-teal-400/60 shadow-2xl shadow-teal-500/20"
            : "border-slate-700/50 hover:border-teal-500/30"
            }`}
        >
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div
              className={`absolute top-4 left-4 w-1 h-1 bg-teal-400 rounded-full animate-pulse ${isFocused ? "opacity-100" : "opacity-0"
                }`}
            ></div>
            <div
              className={`absolute top-8 right-8 w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-300 ${isFocused ? "opacity-100" : "opacity-0"
                }`}
            ></div>
            <div
              className={`absolute bottom-6 left-8 w-1 h-1 bg-teal-300 rounded-full animate-pulse delay-700 ${isFocused ? "opacity-100" : "opacity-0"
                }`}
            ></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-xl transition-all duration-300 ${isFocused
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/30"
                  : "bg-slate-700/80"
                  }`}
              >
                <Wand2
                  className={`w-5 h-5 text-white ${isTyping ? "animate-spin" : ""
                    }`}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Describe Your Vision
                </h3>
                <p className="text-sm text-gray-400">
                  Tell us what kind of website you want to create
                </p>
              </div>
            </div>
            <div
              className={`text-sm transition-all duration-300 ${charCount > 450
                ? "text-yellow-400 font-semibold"
                : "text-gray-400"
                }`}
            >
              {charCount}/500
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={value}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              maxLength={500}
              className="w-full h-36 bg-slate-800/60 border border-slate-600/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 text-base resize-none outline-none transition-all duration-300 focus:bg-slate-800/80 focus:border-teal-400/50 focus:shadow-lg backdrop-blur-sm"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#0d9488 #1e293b",
              }}
            />

            {/* Character limit indicator */}
            <div
              className={`absolute bottom-3 right-3 text-xs transition-all duration-300 ${charCount > 450 ? "text-yellow-400" : "text-gray-500"
                }`}
            >
              {charCount > 450 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-yellow-400/20 px-2 py-1 rounded border border-yellow-400/30"
                >
                  {500 - charCount} left
                </motion.span>
              )}
            </div>
          </div>

          {/* Quick Suggestions */}
          {!value && !isFocused && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <div className="flex items-center space-x-2 mb-3">
                <Lightbulb className="w-4 h-4 text-teal-400" />
                <span className="text-sm text-teal-300 font-medium">
                  Quick Ideas:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 2).map((suggestion, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs bg-gradient-to-r from-slate-700/50 to-slate-600/50 hover:from-teal-500/20 hover:to-cyan-500/20 text-gray-300 hover:text-teal-300 px-3 py-2 rounded-lg border border-slate-600/30 hover:border-teal-500/50 transition-all duration-300 backdrop-blur-sm"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* AI Processing Indicator */}
          {isFocused && value.length > 10 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-teal-500/30 rounded-lg px-4 py-2 flex items-center space-x-2 shadow-lg"
            >
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-sm text-teal-300">
                AI is analyzing your input...
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Hero Section
const HeroSection: FC = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter(); // Initialize the router

  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // --- MODIFICATION: Handle navigation with loading state ---
  const handleGenerateClick = () => {
    if (!prompt.trim()) return; // Don't navigate if prompt is empty

    setIsLoading(true); // Start loading

    // Encode the prompt to make it URL-safe and navigate to the id page
    const encodedPrompt = encodeURIComponent(prompt);
    router.push(`/ai?prompt=${encodedPrompt}`);
  };

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen text-white bg-black relative overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 animate-spin flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black"></div>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 animate-pulse opacity-50"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">
                Generating Your Website
              </h3>
              <p className="text-gray-300 text-sm">
                AI is creating your website based on your description...
              </p>
            </div>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-teal-500 via-teal-600 to-transparent rounded-full blur-3xl opacity-40"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-teal-400 to-transparent rounded-full blur-3xl animate-pulse opacity-30"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-radial from-cyan-500 to-transparent rounded-full blur-3xl animate-pulse delay-1000 opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-60"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
        <div
          className="absolute w-96 h-96 bg-gradient-radial from-teal-400/10 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-300"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        ></div>
      </div>

      <Navbar />

      <main className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-16">
        <div className="w-full max-w-6xl mx-auto space-y-12">
          {/* Enhanced Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-teal-500/15 via-cyan-500/15 to-blue-500/15 border border-teal-500/30 rounded-full px-6 py-3 backdrop-blur-sm shadow-lg">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <span className="text-teal-300 font-medium">
                Next-Gen Website Builder
              </span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-center max-w-5xl mx-auto leading-tight">
              Transform Your Ideas Into{" "}
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                Stunning Websites
              </span>{" "}
              <br />
              <span className="text-2xl md:text-4xl lg:text-5xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                with AI Magic
              </span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Simply describe your vision, and watch as our advanced AI creates
              a
              <span className="text-teal-300 font-semibold">
                {" "}
                beautiful, functional website{" "}
              </span>
              tailored to your needs in seconds. No coding required.
            </p>
          </motion.div>

          {/* Enhanced Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* The EnhancedTextarea and Generate button are now wrapped in a div */}
            <div className="relative">
              <EnhancedTextarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., 'Create a modern portfolio website for a photographer with a dark theme, image gallery, contact form, and smooth animations...'"
              />
              {/* --- MODIFICATION: Generate Button is now part of the flow --- */}
              <motion.button
                onClick={handleGenerateClick}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled={!prompt.trim() || isLoading}
                className={`relative w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center space-x-3 overflow-hidden ${prompt.trim() && !isLoading
                  ? "bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-500 hover:via-cyan-500 hover:to-blue-500 text-white"
                  : isLoading
                    ? "bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white cursor-not-allowed"
                    : "bg-slate-700/50 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {prompt.trim() && !isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-cyan-400/20 to-blue-400/20 blur-xl"></div>
                )}
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 relative z-10 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="relative z-10">Generating...</span>
                  </>
                ) : (
                  <>
                    <Zap
                      className={`w-5 h-5 relative z-10 ${prompt.trim() ? "animate-pulse" : ""
                        }`}
                    />
                    <span className="relative z-10">Generate Website</span>
                    <ArrowRight className="w-5 h-5 relative z-10" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </main>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
    </div>
  );
};

export default HeroSection;
