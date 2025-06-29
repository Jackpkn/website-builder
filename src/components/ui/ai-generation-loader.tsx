"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Bot } from "lucide-react";

interface FileGenerationStep {
    name: "index.html" | "styles.css" | "index.js";
    title: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

interface AIGenerationLoaderProps {
    isGenerating: boolean;
    currentFile?: "index.html" | "styles.css" | "index.js" | null;
    realCode?: string;
}

const fileSteps: FileGenerationStep[] = [
    {
        name: "index.html",
        title: "Generating HTML structure...",
        icon: <Code className="w-4 h-4" />,
        color: "text-orange-400",
        bgColor: "bg-orange-500/20"
    },
    {
        name: "styles.css",
        title: "Creating CSS styles...",
        icon: <Code className="w-4 h-4" />,
        color: "text-blue-400",
        bgColor: "bg-blue-500/20"
    },
    {
        name: "index.js",
        title: "Writing JavaScript logic...",
        icon: <Code className="w-4 h-4" />,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20"
    }
];

export const AIGenerationLoader = ({
    isGenerating,
    currentFile,
    realCode
}: AIGenerationLoaderProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [typingText, setTypingText] = useState("");
    const [currentChar, setCurrentChar] = useState(0);

    // Use real code if provided, otherwise use sample snippets
    const codeSnippets = {
        "index.html": realCode || `<!DOCTYPE html>
<html>
<head>
    <title>Your App</title>
</head>
<body>
    <div id="app">
        <!-- Content here -->
    </div>
</body>
</html>`,
        "styles.css": realCode || `body {
    margin: 0;
    padding: 20px;
    font-family: Arial, sans-serif;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
}`,
        "index.js": realCode || `// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('App loaded');
    
    // Your logic here
});`
    };

    useEffect(() => {
        if (!isGenerating) {
            setCurrentStep(0);
            setTypingText("");
            setCurrentChar(0);
            return;
        }

        // Determine current step based on currentFile
        const stepIndex = fileSteps.findIndex(step => step.name === currentFile);
        if (stepIndex !== -1 && stepIndex !== currentStep) {
            setCurrentStep(stepIndex);
            setCurrentChar(0);
            setTypingText("");
        }

        // Typing animation
        const currentSnippet = currentFile ? codeSnippets[currentFile] : "";
        if (currentChar < currentSnippet.length) {
            const timer = setTimeout(() => {
                setTypingText(currentSnippet.slice(0, currentChar + 1));
                setCurrentChar(prev => prev + 1);
            }, 30 + Math.random() * 50);

            return () => clearTimeout(timer);
        }
    }, [isGenerating, currentFile, currentStep, currentChar]);

    const getProgressPercentage = () => {
        if (!currentFile) return 0;
        const stepIndex = fileSteps.findIndex(step => step.name === currentFile);
        const baseProgress = (stepIndex / fileSteps.length) * 100;
        const stepProgress = (currentChar / (codeSnippets[currentFile]?.length || 1)) * (100 / fileSteps.length);
        return Math.min(baseProgress + stepProgress, 100);
    };

    if (!isGenerating) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="fixed left-4 top-4 z-[100] w-96 max-h-[calc(100vh-2rem)] overflow-hidden"
            >
                <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-blue-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">
                                AI Generating...
                            </h2>
                        </div>

                        <div className="w-full bg-gray-700/50 rounded-full h-1.5 mb-2">
                            <motion.div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${getProgressPercentage()}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>

                        <p className="text-gray-300 text-sm">
                            {currentFile ? fileSteps.find(step => step.name === currentFile)?.title : "Preparing..."}
                        </p>
                    </div>

                    {/* Code Editor */}
                    <div className="bg-gray-900/90 overflow-hidden">
                        {/* Editor Header */}
                        <div className="bg-gray-700/80 px-3 py-2 flex items-center space-x-2">
                            <div className="flex space-x-1.5">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                            </div>
                            <div className="flex-1 text-center">
                                <span className="text-gray-300 text-xs font-medium">
                                    {currentFile || "generating..."}
                                </span>
                            </div>
                        </div>

                        {/* Code Content */}
                        <div className="p-3 max-h-64 overflow-y-auto">
                            <pre className="text-xs font-mono leading-relaxed">
                                <code className="text-gray-100">
                                    {typingText.split('\n').map((line, index) => (
                                        <div key={index} className="relative">
                                            <span className="text-gray-500 mr-3 select-none">
                                                {String(index + 1).padStart(2, ' ')}
                                            </span>
                                            <span className="text-gray-100">
                                                {line}
                                            </span>
                                        </div>
                                    ))}
                                </code>
                            </pre>

                            {/* Typing Cursor */}
                            <div className="absolute animate-pulse">
                                <div className="w-0.5 h-4 bg-white"></div>
                            </div>
                        </div>
                    </div>

                    {/* File Progress Indicators */}
                    <div className="p-3 border-t border-gray-700">
                        <div className="flex justify-center space-x-2">
                            {fileSteps.map((step, index) => {
                                const isActive = currentFile === step.name;
                                const isCompleted = fileSteps.findIndex(s => s.name === currentFile) > index;

                                return (
                                    <motion.div
                                        key={step.name}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`flex items-center space-x-1.5 px-2 py-1 rounded-full transition-all duration-300 text-xs ${isActive
                                            ? `${step.bgColor} ${step.color} border border-current/30`
                                            : isCompleted
                                                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                                                : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                                            }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-current animate-pulse' : isCompleted ? 'bg-green-400' : 'bg-gray-500'
                                            }`} />
                                        <span className="font-medium">{step.name}</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}; 