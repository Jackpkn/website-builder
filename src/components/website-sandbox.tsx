/* eslint-disable @typescript-eslint/no-explicit-any */
// components/WebsiteGenerator.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  useWebsiteGenerator,
  useFilePreview,
} from "@/hooks/useWebsiteGenerator";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  FileCode,
  Download,
  Upload,
  Eraser,
  Loader2,
  MessageSquare,
  XCircle,
  Bot,
  Eye,
  Code2,
  Sparkles,
  Lock,
  Zap,
  Palette,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type ActiveFile = "html" | "css" | "js";

const languageMap: Record<ActiveFile, string> = {
  html: "html",
  css: "css",
  js: "javascript",
};

const fileIcons: Record<ActiveFile, React.ReactNode> = {
  html: <FileCode className="h-4 w-4 text-orange-400" />,
  css: <Palette className="h-4 w-4 text-blue-400" />,
  js: <Zap className="h-4 w-4 text-yellow-400" />,
};

const fileNames: Record<ActiveFile, string> = {
  html: "index.html",
  css: "styles.css",
  js: "script.js",
};

type WebsiteGeneratorProps = {
  sessionId?: string;
  className?: string;
};

export function WebsiteGenerator({
  sessionId = "default",
  className = "",
}: WebsiteGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [activeFile, setActiveFile] = useState<ActiveFile>("html");
  const [selectedModel, setSelectedModel] = useState<string>("gemini");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [hasGeneratedFromUrl, setHasGeneratedFromUrl] = useState(false);

  const searchParams = useSearchParams();
  const initialPromptFromUrl = searchParams.get("prompt");

  const {
    isLoading,
    error,
    result,
    files,
    history,
    hasFiles,
    streamingMessage,
    generateWebsite,
    cancelGeneration,
    resetSession,
    getFormattedHistory,
    exportSession,
    importSession,
  } = useWebsiteGenerator({
    sessionId,
    onSuccess: (result) => {
      console.log("Generation successful:", result);
    },
    onError: (error) => {
      console.error("Generation failed:", error);
    },
  });

  const { previewUrl, generatePreview } = useFilePreview(files);

  useEffect(() => {
    if (initialPromptFromUrl && !isLoading && !hasGeneratedFromUrl) {
      const decodedPrompt = decodeURIComponent(initialPromptFromUrl);
      setPrompt(decodedPrompt);
      generateWebsite(decodedPrompt);
      setHasGeneratedFromUrl(true);
    }
  }, [initialPromptFromUrl, generateWebsite, isLoading, hasGeneratedFromUrl]);

  useEffect(() => {
    setHasGeneratedFromUrl(false);
  }, [initialPromptFromUrl]);

  useEffect(() => {
    const handler = setTimeout(() => {
      generatePreview();
    }, 500);
    return () => clearTimeout(handler);
  }, [files, generatePreview]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current
        .firstElementChild as HTMLDivElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [history, streamingMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    await generateWebsite(prompt.trim(), false, selectedModel);
    setPrompt("");
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importSession(file);
    } catch (importError) {
      console.error("Import failed:", importError);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const FileButton = ({ type, name }: { type: ActiveFile; name: string }) => (
    <Button
      variant={activeFile === type ? "default" : "ghost"}
      className={`w-full justify-start gap-3 h-12 transition-all duration-300 group ${activeFile === type
        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
        : "hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-750 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        }`}
      onClick={() => setActiveFile(type)}
    >
      <div
        className={`p-2 rounded-lg ${activeFile === type
          ? "bg-white/20"
          : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
          }`}
      >
        {fileIcons[type]}
      </div>
      <div className="flex-1 text-left">
        <span className="font-medium text-sm">{name}</span>
        <div className="text-xs opacity-70">
          {type === "html" && "Structure"}
          {type === "css" && "Styling"}
          {type === "js" && "Interactive"}
        </div>
      </div>
      {activeFile === type && (
        <Badge
          variant="secondary"
          className="bg-white/20 text-white border-white/30"
        >
          Active
        </Badge>
      )}
    </Button>
  );

  return (
    <TooltipProvider>
      <div
        className={`h-screen w-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 ${className}`}
      >
        {/* Enhanced Header */}
        <header className="flex items-center justify-between p-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-slate-900/60">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full shadow-lg shadow-violet-500/25">
              <Code2 className="h-6 w-6 text-white" />
              <Palette className="h-5 w-5 text-white" />
              <span className="text-sm font-semibold text-white">
                WebCraft AI
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                WebCraft AI Studio
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Design, code, and launch beautiful sites with AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={exportSession}
                    className="hover:bg-green-100 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export Session</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import Session</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetSession}
                    className="hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset Session</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <ResizablePanelGroup direction="horizontal" className="flex-grow">
          {/* Enhanced File Explorer */}
          <ResizablePanel defaultSize={16} minSize={12}>
            <div className="p-6 h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-r border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg shadow-lg shadow-violet-500/25">
                  <Code2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Project Files
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Generated code files
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <FileButton type="html" name={fileNames.html} />
                <FileButton type="css" name={fileNames.css} />
                <FileButton type="js" name={fileNames.js} />
              </div>
              <div className="mt-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Read-only Editor
                  </span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Code is automatically generated and updated by AI
                </p>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Enhanced Code Editor & Preview */}
          <ResizablePanel defaultSize={54} minSize={30}>
            <Tabs defaultValue="editor" className="h-full flex flex-col">
              <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <TabsTrigger
                    value="editor"
                    className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-md"
                  >
                    <Code2 className="h-4 w-4" />
                    Code Editor
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    disabled={!hasFiles}
                    className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-md"
                  >
                    <Eye className="h-4 w-4" />
                    Live Preview
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="editor"
                className="flex-grow relative bg-gradient-to-br from-slate-900 to-slate-800 m-0 p-0"
              >
                <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/50 px-6 py-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-700 rounded-lg">
                        {fileIcons[activeFile]}
                      </div>
                      <div>
                        <span className="font-medium text-white">
                          {fileNames[activeFile]}
                        </span>
                        <p className="text-xs text-slate-300">
                          {activeFile === "html" && "Document Structure"}
                          {activeFile === "css" && "Styling & Layout"}
                          {activeFile === "js" && "Interactive Features"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-slate-700/50 text-slate-300 border-slate-600"
                    >
                      Read-only
                    </Badge>
                  </div>
                </div>

                <div className="absolute inset-0 pt-20 overflow-y-auto">
                  <SyntaxHighlighter
                    language={languageMap[activeFile]}
                    style={vscDarkPlus}
                    showLineNumbers
                    wrapLines
                    customStyle={{
                      margin: 0,
                      padding: "1rem 2rem 2rem 2rem",
                      backgroundColor: "transparent",
                      fontSize: "14px",
                      lineHeight: "1.7",
                      fontFamily:
                        "'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
                    }}
                    lineNumberStyle={{
                      color: "#64748b",
                      backgroundColor: "transparent",
                      paddingRight: "1.5em",
                      minWidth: "3em",
                      textAlign: "right",
                    }}
                  >
                    {files[activeFile] ||
                      `// ${fileNames[activeFile]} content will appear here after generation\n// Start by describing your website in the chat panel`}
                  </SyntaxHighlighter>
                </div>
              </TabsContent>

              <TabsContent
                value="preview"
                className="flex-grow bg-white m-0 relative"
              >
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-md px-3 py-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
                          localhost:3000
                        </div>
                      </div>
                    </div>
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border-0 pt-12"
                      title="Website Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                    <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md text-center">
                      <div className="p-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl mb-6 mx-auto w-fit">
                        <Eye className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        Preview Ready
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Generate your website using the AI chat to see a
                        beautiful live preview here.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                        <Sparkles className="h-4 w-4" />
                        <span>Powered by AI</span>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Enhanced Chat Panel */}
          <ResizablePanel defaultSize={30} minSize={20}>
            <Card className="h-full flex flex-col border-0 border-l border-slate-200/60 dark:border-slate-800/60 rounded-none bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
              <CardHeader className="pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
                <CardTitle className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full shadow-lg shadow-violet-500/25">
                    <Bot className="h-4 w-4 text-white" />
                    <span className="text-sm font-semibold text-white">
                      AI Assistant
                    </span>
                  </div>
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Describe your vision and watch it come to life with AI-powered
                  code generation.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden p-6">
                <div className="flex-grow relative min-h-0">
                  <ScrollArea
                    className="h-full absolute inset-0"
                    ref={scrollAreaRef}
                  >
                    <div className="space-y-4 pr-4">
                      {getFormattedHistory().map((entry, index) => (
                        <div key={entry.id} className="group relative">
                          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-violet-200 dark:hover:border-violet-800">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/25">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-2">
                                  {entry.prompt}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                                  {entry.explanation}
                                </p>
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="secondary"
                                    className="bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800"
                                  >
                                    {entry.action.charAt(0).toUpperCase() +
                                      entry.action.slice(1)}
                                  </Badge>
                                  <span className="text-xs text-slate-500 dark:text-slate-500">
                                    {entry.timestamp.toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {index < getFormattedHistory().length - 1 && (
                            <div className="absolute left-4 top-10 h-[calc(100%-1.5rem)] w-0.5 bg-gradient-to-b from-violet-200 via-violet-200 to-transparent dark:from-violet-800 dark:via-violet-800"></div>
                          )}
                        </div>
                      ))}

                      {isLoading && streamingMessage && (
                        <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800 rounded-xl">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/25">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-violet-900 dark:text-violet-100 font-medium">
                                  {streamingMessage}
                                </p>
                                {!streamingMessage.includes("successfully") &&
                                  !streamingMessage.includes("error") && (
                                    <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {history.length === 0 && !isLoading && (
                        <div className="text-center py-12">
                          <div className="p-6 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-3xl mb-6 mx-auto w-fit">
                            <MessageSquare className="h-12 w-12 text-violet-600 dark:text-violet-400 mx-auto" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            Ready to Create
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                            Start by describing the website you want to create,
                            and I will generate the code for you.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <Separator className="bg-slate-200/60 dark:bg-slate-700/60" />

                <div className="space-y-4 pt-2">
                  {error && !isLoading && (
                    <Alert
                      variant="destructive"
                      className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Generation Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {result && !isLoading && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-800 dark:text-green-200">
                        {result.action.charAt(0).toUpperCase() +
                          result.action.slice(1)}{" "}
                        Complete
                      </AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        {result.explanation}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                      AI Model
                    </label>
                    <Select
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-violet-400 dark:focus:border-violet-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini">Gemini</SelectItem>
                        <SelectItem value="deepseek">DeepSeek</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="groq">Groq</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="✨ Describe your dream website... e.g., &apos;Create a modern landing page for a coffee shop...&apos;"
                      className="flex-1 resize-none min-h-[100px] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-violet-400 dark:focus:border-violet-500 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      disabled={isLoading}
                      onKeyDown={(
                        e: React.KeyboardEvent<HTMLTextAreaElement>
                      ) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e as any);
                        }
                      }}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!prompt.trim() || isLoading}
                        className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200"
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Generate
                          </div>
                        )}
                      </Button>

                      {isLoading && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelGeneration}
                          className="h-12 px-4 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>
    </TooltipProvider>
  );
}

export default WebsiteGenerator;
