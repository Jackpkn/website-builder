"use client";

import React, { useState, useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: "html" | "css" | "javascript";
    placeholder?: string;
    readOnly?: boolean;
}

export const CodeEditor = ({
    value,
    onChange,
    language,
    placeholder = "Start typing your code...",
    readOnly = false
}: CodeEditorProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    const handleDoubleClick = () => {
        if (readOnly) return;
        setIsEditing(true);
        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(
                textareaRef.current.value.length,
                textareaRef.current.value.length
            );
        }, 0);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (editValue !== value) {
            onChange(editValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setIsEditing(false);
            setEditValue(value); // Reset to original value
        }
    };

    const getLanguageForHighlighting = () => {
        switch (language) {
            case "html":
                return "html";
            case "css":
                return "css";
            case "javascript":
                return "javascript";
            default:
                return "text";
        }
    };

    if (isEditing && !readOnly) {
        return (
            <div className="relative w-full h-full">
                <textarea
                    ref={textareaRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full bg-[#0a1428] text-white/90 font-mono text-sm p-4 rounded-lg border border-blue-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder={placeholder}
                    style={{
                        lineHeight: "1.5",
                        tabSize: 2,
                    }}
                />
                <div className="absolute top-2 right-2 text-xs text-gray-400">
                    Press Esc to cancel
                </div>
            </div>
        );
    }

    return (
        <div
            className={`w-full h-full rounded-lg border border-blue-900/50 overflow-hidden ${!readOnly ? "cursor-pointer hover:border-blue-700/50 transition-colors" : ""
                }`}
            onDoubleClick={handleDoubleClick}
        >
            <SyntaxHighlighter
                language={getLanguageForHighlighting()}
                style={vscDarkPlus}
                customStyle={{
                    backgroundColor: "#0a1428",
                    padding: "1rem",
                    margin: 0,
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                    minHeight: "100%",
                    maxHeight: "100%",
                    overflow: "auto",
                }}
                showLineNumbers={true}
                wrapLines={false}
                lineNumberStyle={{
                    color: "#6b7280",
                    fontSize: "0.75rem",
                    paddingRight: "1rem",
                }}
            >
                {value || placeholder}
            </SyntaxHighlighter>
            {!readOnly && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-[#0a1428]/80 px-2 py-1 rounded">
                    Double-click to edit
                </div>
            )}
        </div>
    );
}; 