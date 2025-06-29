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
      content: "<!-- AI will generate HTML here -->",
    },
    {
      id: 2,
      name: "styles.css",
      type: "css",
      content: "/* AI will generate CSS here */",
    },
    {
      id: 3,
      name: "index.js",
      type: "javascript",
      content: "// AI will generate JavaScript here",
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
  const [currentGeneratingFile, setCurrentGeneratingFile] = useState<"index.html" | "styles.css" | "index.js" | null>(null);
  const [realGeneratedCode, setRealGeneratedCode] = useState("");
  const [showCodeEditor, setShowCodeEditor] = useState(true);

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

  // Log file updates
  useEffect(() => {
    console.log("📊 Files updated:", files.map(f => ({ name: f.name, contentLength: f.content.length })));

    // Show more details about non-empty files
    files.forEach(file => {
      if (file.content.length > 0) {
        console.log(`📄 ${file.name} content:`, file.content.substring(0, 200) + "...");
      }
    });
  }, [files]);

  // Log preview content changes
  useEffect(() => {
    const htmlFile = files.find((f) => f.name === "index.html");
    if (htmlFile && htmlFile.content.length > 0) {
      console.log("👁️ Preview content updated, HTML length:", htmlFile.content.length);
    }
  }, [files]);

  // --- Core AI and Rendering Logic ---

  const handleGenerateCode = async () => {
    if (!newMessage.trim() || isGenerating) return;

    console.log("🎯 Starting code generation for:", newMessage.substring(0, 50) + "...");
    setIsGenerating(true);
    setShowCodeEditor(false); // Hide code editor during generation

    const userMessage: Message = {
      id: Date.now(),
      type: "user",
      content: newMessage,
    };
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");

    // Add initial AI response
    const initialMessage: Message = {
      id: Date.now() + 1,
      type: "ai",
      content: "I'll start generating your code now. Let me create the files one by one...",
    };
    setMessages((prev) => [...prev, initialMessage]);

    // Reset file contents
    setFiles((prevFiles) => prevFiles.map((f) => ({ ...f, content: "" })));
    console.log("📝 Reset file contents");

    try {
      console.log("🌐 Making API request to /api/generate");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: newMessage }),
      });

      if (!response.body) {
        throw new Error("Response body is null");
      }

      // Check if response is an error
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log("📡 Response received, starting to read stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentFileName: File["name"] | null = null;
      let totalChunks = 0;
      let fileUpdates = 0;
      let buffer = ""; // Buffer to accumulate content across chunks
      let lastFileUpdate = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("✅ Stream reading completed");
          break;
        }

        totalChunks++;
        const chunk = decoder.decode(value, { stream: true });
        console.log(`📦 Chunk ${totalChunks} received:`, chunk.substring(0, 100) + "...");

        // Add chunk to buffer
        buffer += chunk;
        console.log(`📝 Buffer length: ${buffer.length}`);

        // Process complete lines from buffer
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.substring(0, newlineIndex);
          buffer = buffer.substring(newlineIndex + 1);

          console.log(`🔍 Processing line: "${line}"`);

          // Check for file markers
          if (line.includes("[--FILE:")) {
            const fileName = line.match(/\[--FILE:(.*?)--\]/)?.[1];
            console.log("🔍 Found file marker line:", line, "Extracted fileName:", fileName);
            if (
              fileName === "index.html" ||
              fileName === "styles.css" ||
              fileName === "index.js"
            ) {
              currentFileName = fileName;
              setCurrentGeneratingFile(fileName);
              console.log("📁 Switching to file:", currentFileName);

              // Add file start message to chat
              const fileStartMessage: Message = {
                id: Date.now() + totalChunks,
                type: "ai",
                content: `Now generating ${fileName}...`,
              };
              setMessages((prev) => [...prev, fileStartMessage]);

              // Add delay to make it visible
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              console.log("⚠️ Unknown file name:", fileName);
            }
          } else if (currentFileName && line.trim()) {
            fileUpdates++;
            console.log(`📝 Updating ${currentFileName} (update #${fileUpdates}):`, line.substring(0, 50) + "...");
            setRealGeneratedCode(line + "\n");
            setFiles((prevFiles) =>
              prevFiles.map((file) =>
                file.name === currentFileName
                  ? { ...file, content: file.content + line + "\n" }
                  : file
              )
            );

            // Add progress message every 10 updates
            if (fileUpdates - lastFileUpdate >= 10) {
              lastFileUpdate = fileUpdates;
              const progressMessage: Message = {
                id: Date.now() + totalChunks + fileUpdates,
                type: "ai",
                content: `Adding more code to ${currentFileName}...`,
              };
              setMessages((prev) => [...prev, progressMessage]);

              // Add small delay to make it visible
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } else if (currentFileName && !line.trim()) {
            console.log(`📝 Empty line for ${currentFileName}, still adding newline`);
            setRealGeneratedCode("\n");
            setFiles((prevFiles) =>
              prevFiles.map((file) =>
                file.name === currentFileName
                  ? { ...file, content: file.content + "\n" }
                  : file
              )
            );
          }
        }

        // Also check for file markers that might be in the remaining buffer
        if (buffer.includes("[--FILE:")) {
          const matches = buffer.match(/\[--FILE:([^\]]+)--\]/g);
          if (matches) {
            console.log("🔍 Found file markers in buffer:", matches);
            for (const match of matches) {
              const fileName = match.match(/\[--FILE:(.*?)--\]/)?.[1];
              if (
                fileName === "index.html" ||
                fileName === "styles.css" ||
                fileName === "index.js"
              ) {
                currentFileName = fileName;
                setCurrentGeneratingFile(fileName);
                console.log("📁 Switching to file from buffer:", currentFileName);
              }
            }
          }
        }

        // Add small delay between chunks to make it visible
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // If no file markers were found, try to parse the content differently
      if (fileUpdates === 0) {
        console.log("⚠️ No file markers found, attempting alternative parsing...");

        // Get the full response content
        const fullContent = files.map(f => f.content).join('');
        console.log("📄 Full response content:", fullContent.substring(0, 500));

        // Try to extract HTML, CSS, and JS using common patterns
        const htmlMatch = fullContent.match(/<html[^>]*>[\s\S]*?<\/html>/i) ||
          fullContent.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i) ||
          fullContent.match(/<body[^>]*>[\s\S]*?<\/body>/i) ||
          fullContent.match(/<div[^>]*>[\s\S]*?<\/div>/i);

        const cssMatch = fullContent.match(/<style[^>]*>[\s\S]*?<\/style>/i) ||
          fullContent.match(/\.\w+\s*\{[\s\S]*?\}/g);

        const jsMatch = fullContent.match(/<script[^>]*>[\s\S]*?<\/script>/i) ||
          fullContent.match(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\}/g);

        if (htmlMatch) {
          console.log("🔍 Found HTML content, updating index.html");
          setFiles(prev => prev.map(f =>
            f.name === "index.html" ? { ...f, content: htmlMatch[0] } : f
          ));
        }

        if (cssMatch) {
          console.log("🔍 Found CSS content, updating styles.css");
          const cssContent = Array.isArray(cssMatch) ? cssMatch.join('\n') : cssMatch[0];
          setFiles(prev => prev.map(f =>
            f.name === "styles.css" ? { ...f, content: cssContent } : f
          ));
        }

        if (jsMatch) {
          console.log("🔍 Found JS content, updating index.js");
          const jsContent = Array.isArray(jsMatch) ? jsMatch.join('\n') : jsMatch[0];
          setFiles(prev => prev.map(f =>
            f.name === "index.js" ? { ...f, content: jsContent } : f
          ));
        }
      } else {
        // Log the final content of each file
        console.log("📊 Final file contents:");
        files.forEach(file => {
          console.log(`  ${file.name}: ${file.content.length} characters`);
          if (file.content.length > 0) {
            console.log(`    Preview: ${file.content.substring(0, 100)}...`);
          }
        });
      }

      console.log("🎉 Code generation completed:", { totalChunks, fileUpdates });

      // Add AI response to chat
      if (fileUpdates > 0) {
        const aiMessage: Message = {
          id: Date.now() + 1,
          type: "ai",
          content: "Perfect! I've generated all the files. You can now view the code and see the live preview. Feel free to ask for any modifications or improvements.",
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("❌ Error fetching stream:", error);
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: "ai",
        content: "Sorry, I encountered an error while generating your code. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      setCurrentGeneratingFile(null);
      setRealGeneratedCode("");
      setShowCodeEditor(true); // Show code editor after generation
      console.log("🏁 Generation process finished");
    }
  };

  const getPreviewContent = () => {
    const htmlFile = files.find((f) => f.name === "index.html");
    const cssFile = files.find((f) => f.name === "styles.css");
    const jsFile = files.find((f) => f.name === "index.js");

    if (!htmlFile) return "<h1>Waiting for AI to generate index.html...</h1>";

    // This is the "bundler" that injects CSS and JS into the HTML for the iframe
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

  // --- JSX (Your UI, slightly adapted) ---
  return (
    <div
      ref={containerRef}
      className="h-screen bg-[#0f1a33] flex overflow-hidden text-white"
    >
      {/* AI Generation Loader */}
      <AIGenerationLoader
        isGenerating={isGenerating}
        currentFile={currentGeneratingFile}
        realCode={realGeneratedCode}
      />

      {/* Left Panel */}
      <div className="flex overflow-hidden" style={{ width: `${leftWidth}%` }}>
        {showCodeEditor ? (
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
                    onChange={(value) => setFiles(prev => prev.map(f =>
                      f.name === activeFile.name ? { ...f, content: value } : f
                    ))}
                    readOnly={true}
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
        ) : (
          // Show generation placeholder during generation
          <div className="flex-1 flex items-center justify-center bg-slate-900/10">
            <div className="text-center text-white/60">
              <Bot className="w-12 h-12 mx-auto mb-4 text-blue-400" />
              <p className="text-lg font-medium">AI is generating your code...</p>
              <p className="text-sm mt-2">Please wait while I create your files</p>
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        className="w-1.5 bg-blue-900/50 cursor-col-resize hover:bg-blue-700/70 transition-colors flex items-center justify-center group"
        onMouseDown={handleMouseDownHorizontal}
      >
        <GripVertical className="w-3 h-8 text-blue-400/30 group-hover:text-blue-400 transition-colors" />
      </div>

      {/* Right Panel - Chat */}
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
                <div className="bg-slate-800/60 text-white/90 rounded-bl-lg px-4 py-3 rounded-2xl">
                  ...generating code
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
                  ? "AI is thinking..."
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
