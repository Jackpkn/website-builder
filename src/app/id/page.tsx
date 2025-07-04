// app/page.tsx

"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FileText,
  Folder,
  MessageCircle,
  Send,
  Plus,
  GripVertical,
  Code,
  Eye,
  Bot,
  User,
} from "lucide-react";
import { AIGenerationLoader } from "@/components/ui/ai-generation-loader";
import { CodeEditor } from "@/components/ui/code-editor";

// --- Type Definitions ---
interface File {
  id: number;
  name: "index.html" | "styles.css" | "index.js";
  type: "html" | "css" | "javascript";
  content: string;
}

interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
}

// --- Main Component ---
const FileEditorChat = () => {
  // --- State Management ---
  const [files, setFiles] = useState<File[]>([
    {
      id: 1,
      name: "index.html",
      type: "html",
      content: "", // MODIFIED: Start with empty content
    },
    {
      id: 2,
      name: "styles.css",
      type: "css",
      content: "", // MODIFIED: Start with empty content
    },
    {
      id: 3,
      name: "index.js",
      type: "javascript",
      content: "", // MODIFIED: Start with empty content
    },
  ]);

  const [activeFile, setActiveFile] = useState<File>(files[0]);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "ai",
      content: "Hello! Describe the website or component you want me to build.",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingFile, setCurrentGeneratingFile] = useState<
    "index.html" | "styles.css" | "index.js" | null
  >(null);
  const [realGeneratedCode, setRealGeneratedCode] = useState("");
  const [hasContent, setHasContent] = useState(false);

  // --- Resizing Logic (Unchanged from your original code) ---
  const [leftWidth, setLeftWidth] = useState(65);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingHorizontal = useRef(false);

  const handleMouseDownHorizontal = useCallback((e: React.MouseEvent) => {
    isDraggingHorizontal.current = true;
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingHorizontal.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setLeftWidth(Math.min(Math.max(newWidth, 20), 80));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingHorizontal.current = false;
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Ref for chat history auto-scrolling
  const chatHistoryRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  // This effect now correctly determines if there is content to show
  useEffect(() => {
    const hasAnyContent = files.some((file) => file.content.trim().length > 0);
    setHasContent(hasAnyContent);
  }, [files]);

  // --- Core AI and Rendering Logic ---

  const handleGenerateCode = async () => {
    if (!newMessage.trim() || isGenerating) return;
    setIsGenerating(true);

    const userMessage: Message = {
      id: Date.now(),
      type: "user",
      content: newMessage,
    };
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");

    const initialMessage: Message = {
      id: Date.now() + 1,
      type: "ai",
      content: "I'll start generating your code now...",
    };
    setMessages((prev) => [...prev, initialMessage]);

    // Reset file contents to clear previous generation
    setFiles((prevFiles) => prevFiles.map((f) => ({ ...f, content: "" })));

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: newMessage }),
      });

      if (!response.body) throw new Error("Response body is null");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentFileName: File["name"] | null = null;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.substring(0, newlineIndex);
          buffer = buffer.substring(newlineIndex + 1);

          if (line.includes("[--FILE:")) {
            const fileName = line.match(/\[--FILE:(.*?)--\]/)?.[1];
            if (
              fileName === "index.html" ||
              fileName === "styles.css" ||
              fileName === "index.js"
            ) {
              currentFileName = fileName;
              setCurrentGeneratingFile(fileName);
            }
          } else if (currentFileName) {
            setRealGeneratedCode(line + "\n");
            setFiles((prevFiles) =>
              prevFiles.map((file) =>
                file.name === currentFileName
                  ? { ...file, content: file.content + line + "\n" }
                  : file
              )
            );
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay for rendering
      }

      const aiMessage: Message = {
        id: Date.now() + 2,
        type: "ai",
        content:
          "Perfect! I've generated all the files. You can now view the code and see the live preview.",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching stream:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: "ai",
        content: `Sorry, an error occurred: ${error instanceof Error ? error.message : "Unknown error"
          }. Please try again.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      setCurrentGeneratingFile(null);
      setRealGeneratedCode("");
    }
  };

  const getPreviewContent = () => {
    const htmlFile = files.find((f) => f.name === "index.html");
    const cssFile = files.find((f) => f.name === "styles.css");
    const jsFile = files.find((f) => f.name === "index.js");

    if (!htmlFile) return "<h1>Waiting for AI to generate index.html...</h1>";

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Live Preview</title>
        <style>${cssFile?.content || ""}</style>
      </head>
      <body>
        ${htmlFile.content}
        <script>${jsFile?.content || ""}</script>
      </body>
      </html>
    `;
  };

  const getFileIcon = (type: File["type"]) => {
    switch (type) {
      case "javascript":
        return <Code className="w-4 h-4 text-yellow-400" />;
      case "css":
        return <Code className="w-4 h-4 text-blue-400" />;
      case "html":
        return <Code className="w-4 h-4 text-orange-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  // --- JSX ---
  return (
    <div
      ref={containerRef}
      className="h-screen bg-[#0f1a33] flex overflow-hidden text-white"
    >
      <AIGenerationLoader
        isGenerating={isGenerating}
        currentFile={currentGeneratingFile}
        realCode={realGeneratedCode}
      />

      {/* Left Panel - MODIFIED with conditional rendering */}
      <div className="flex overflow-hidden" style={{ width: `${leftWidth}%` }}>
        {isGenerating ? (
          // 1. Show loader during generation
          <div className="flex-1 flex items-center justify-center bg-slate-900/10">
            <div className="text-center text-white/60">
              <Bot className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-pulse" />
              <p className="text-lg font-medium">
                AI is generating your code...
              </p>
              <p className="text-sm mt-2">
                Please wait while I create your files
              </p>
            </div>
          </div>
        ) : !hasContent ? (
          // 2. Show welcome screen if there's no content
          <div className="flex-1 flex items-center justify-center bg-slate-900/10">
            <div className="text-center text-white/60 max-w-md mx-auto p-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-600/20 flex items-center justify-center">
                <Code className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Welcome to AI Code Generator
              </h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Describe the website or component you want me to build in the
                chat. I&apos;ll generate the HTML, CSS, and JavaScript for you.
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>HTML structure</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>CSS styling</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>JavaScript functionality</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 3. Show editor and files if content exists
          <>
            <div className="w-64 bg-slate-900/30 border-r border-blue-900/50 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-blue-900/50">
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-blue-400" />{" "}
                  <h2 className="font-semibold text-white">Files</h2>
                </div>
                <button className="p-1 hover:bg-blue-800/30 rounded-md transition-colors">
                  <Plus className="w-4 h-4 text-blue-400" />
                </button>
              </div>
              <div className="flex-1 p-2 space-y-1 overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setActiveFile(file)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${activeFile.id === file.id
                      ? "bg-blue-600/30"
                      : "hover:bg-blue-800/20"
                      }`}
                  >
                    {getFileIcon(file.type)}
                    <span className="text-sm text-white/90 font-medium truncate">
                      {file.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col bg-slate-900/10">
              <div className="flex items-center justify-between border-b border-blue-900/50">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("code")}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 border-b-2 ${activeTab === "code"
                      ? "text-white border-blue-400 bg-blue-600/10"
                      : "text-white/60 border-transparent hover:text-white hover:bg-blue-800/20"
                      }`}
                  >
                    <Code className="w-4 h-4" /> Code
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 border-b-2 ${activeTab === "preview"
                      ? "text-white border-blue-400 bg-blue-600/10"
                      : "text-white/60 border-transparent hover:text-white hover:bg-blue-800/20"
                      }`}
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                </div>
                <div className="flex items-center gap-2 px-4">
                  {getFileIcon(activeFile.type)}
                  <span className="text-sm font-medium text-white/80">
                    {activeFile.name}
                  </span>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-hidden">
                {activeTab === "code" ? (
                  <CodeEditor
                    language={activeFile.type}
                    value={activeFile.content}
                    onChange={(value) =>
                      setFiles((prev) =>
                        prev.map((f) =>
                          f.name === activeFile.name
                            ? { ...f, content: value || "" }
                            : f
                        )
                      )
                    }
                    readOnly={isGenerating} // Make read-only while generating
                    placeholder="AI will write code here..."
                  />
                ) : (
                  <div className="w-full h-full rounded-lg border border-blue-900/50 overflow-hidden bg-white">
                    <iframe
                      srcDoc={getPreviewContent()}
                      title="Live Preview"
                      className="w-full h-full border-0"
                      sandbox="allow-scripts"
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Resize Handle */}
      <div
        className="w-1.5 bg-blue-900/50 cursor-col-resize hover:bg-blue-700/70 transition-colors flex items-center justify-center group"
        onMouseDown={handleMouseDownHorizontal}
      >
        <GripVertical className="w-3 h-8 text-blue-400/30 group-hover:text-blue-400 transition-colors" />
      </div>

      {/* Right Panel - Chat (Unchanged) */}
      <div className="flex flex-col" style={{ width: `${100 - leftWidth}%` }}>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-blue-900/50">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-white">AI Assistant</h2>
            </div>
            {isGenerating && (
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></div>
            )}
          </div>
          <div
            ref={chatHistoryRef}
            className="flex-1 p-4 overflow-y-auto space-y-5"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-3 ${message.type === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                {message.type === "ai" && (
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-blue-800/60 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-300" />
                  </div>
                )}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${message.type === "user"
                    ? "bg-blue-600 text-white rounded-br-lg"
                    : "bg-slate-800/60 text-white/90 rounded-bl-lg"
                    }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                {message.type === "user" && (
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-200" />
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-end gap-3 justify-start">
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-blue-800/60 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-300" />
                </div>
                <div className="bg-slate-800/60 text-white/90 rounded-bl-lg px-4 py-3 rounded-2xl animate-pulse">
                  ...
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-blue-900/50">
          <div className="flex items-center gap-3 bg-[#0a1428] border border-blue-900/50 rounded-xl p-2 focus-within:ring-1 focus-within:ring-blue-500">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerateCode();
                }
              }}
              placeholder={
                isGenerating
                  ? "AI is working..."
                  : "Describe a component or website..."
              }
              disabled={isGenerating}
              className="flex-1 bg-transparent text-white/90 p-2 resize-none focus:outline-none h-full"
            />
            <button
              onClick={handleGenerateCode}
              disabled={!newMessage.trim() || isGenerating}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center transition-all duration-200 enabled:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileEditorChat;
