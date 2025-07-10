/* eslint-disable @typescript-eslint/no-explicit-any */
// components/WebsiteGenerator.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
// 1. IMPORT `useSearchParams` to read URL query parameters
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
  FileJson,
  Bot,
  Eye,
  Code2,
  Sparkles,
  Lock,
} from "lucide-react";

type ActiveFile = "html" | "css" | "js";

const languageMap: Record<ActiveFile, string> = {
  html: "html",
  css: "css",
  js: "javascript",
};

const fileIcons: Record<ActiveFile, React.ReactNode> = {
  html: <FileCode className="h-4 w-4 text-orange-500" />,
  css: <FileCode className="h-4 w-4 text-blue-500" />,
  js: <FileCode className="h-4 w-4 text-yellow-500" />,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [hasGeneratedFromUrl, setHasGeneratedFromUrl] = useState(false);

  const searchParams = useSearchParams();

  // THE FIX - PART 1: Extract the prompt string from the params object.
  // We will use this string as the dependency for our effect.
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
    if (
      initialPromptFromUrl &&
      !isLoading &&
      !hasGeneratedFromUrl
    ) {
      const decodedPrompt = decodeURIComponent(initialPromptFromUrl);
      setPrompt(decodedPrompt);
      generateWebsite(decodedPrompt);
      setHasGeneratedFromUrl(true); // Prevent re-triggering
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
    await generateWebsite(prompt.trim());
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
      className={`w-full justify-start gap-3 h-11 transition-all duration-200 ${activeFile === type
        ? "bg-primary text-primary-foreground shadow-md"
        : "hover:bg-accent hover:text-accent-foreground"
        }`}
      onClick={() => setActiveFile(type)}
    >
      {fileIcons[type]}
      <span className="font-medium">{name}</span>
      {activeFile === type && (
        <Badge variant="secondary" className="ml-auto">
          Active
        </Badge>
      )}
    </Button>
  );

  return (
    // ... the rest of your JSX remains exactly the same
    <TooltipProvider>
      <div
        className={`h-screen w-full flex flex-col bg-background ${className}`}
      >
        <header className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                AI Powered
              </span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Website Generator
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={exportSession}
                  className="hover:bg-accent"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export Session (.json)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="hover:bg-accent"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import Session (.json)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={resetSession}
                  className="hover:bg-destructive/90"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset Session</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <ResizablePanelGroup direction="horizontal" className="flex-grow">
          <ResizablePanel defaultSize={16} minSize={12}>
            <div className="p-4 h-full bg-card/30 border-r">
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Files</h2>
              </div>
              <div className="space-y-2">
                <FileButton type="html" name={fileNames.html} />
                <FileButton type="css" name={fileNames.css} />
                <FileButton type="js" name={fileNames.js} />
              </div>
              <div className="mt-6 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Read-only editor</span>
                </div>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={54} minSize={30}>
            <Tabs defaultValue="editor" className="h-full flex flex-col">
              <div className="p-3 border-b bg-card/30">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="editor"
                    className="flex items-center gap-2"
                  >
                    <Code2 className="h-4 w-4" />
                    Code Editor
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    disabled={!hasFiles}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent
                value="editor"
                className="flex-grow relative bg-[#0d1117] m-0 p-0"
              >
                <div className="absolute top-0 left-0 right-0 z-10 bg-[#21262d] border-b border-[#30363d] px-4 py-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    {fileIcons[activeFile]}
                    <span className="font-medium">{fileNames[activeFile]}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      Read-only
                    </Badge>
                  </div>
                </div>
                {/* FIX: This container now correctly handles scrolling.
                    - `absolute inset-0`: Makes the div fill its parent (`TabsContent`).
                    - `pt-12`: Adds padding for the absolute-positioned header above.
                    - `overflow-y-auto`: Enables vertical scrolling when content overflows.
                */}
                <div className="absolute inset-0 pt-12 overflow-y-auto">
                  <SyntaxHighlighter
                    language={languageMap[activeFile]}
                    style={vscDarkPlus}
                    showLineNumbers
                    wrapLines
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      backgroundColor: "transparent", // Background is now on the parent
                      fontSize: "14px",
                      lineHeight: "1.6",
                      fontFamily:
                        "'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
                    }}
                    lineNumberStyle={{
                      color: "#7d8590",
                      backgroundColor: "transparent",
                      paddingRight: "1em",
                      minWidth: "2.5em",
                    }}
                  >
                    {files[activeFile] ||
                      `// ${fileNames[activeFile]} will appear here after generation`}
                  </SyntaxHighlighter>
                </div>
              </TabsContent>
              <TabsContent value="preview" className="flex-grow bg-white m-0">
                {previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title="Website Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-gradient-to-br from-muted/20 to-muted/40">
                    <Eye className="h-12 w-12 mb-4 text-muted-foreground/50" />
                    <p className="text-lg font-medium mb-2">
                      No Preview Available
                    </p>
                    <p className="text-sm text-center max-w-md">
                      Generate website content using the chat to see a live
                      preview here.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
            <Card className="h-full flex flex-col border-0 border-l rounded-none bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-full">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      AI Chat
                    </span>
                  </div>
                </CardTitle>
                <CardDescription>
                  Describe your website or request changes. The AI will generate
                  code for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
                <div className="flex-grow relative min-h-0">
                  <ScrollArea
                    className="h-full absolute inset-0"
                    ref={scrollAreaRef}
                  >
                    <div className="p-1 space-y-3">
                      {getFormattedHistory().map((entry) => (
                        <div
                          key={entry.id}
                          className="p-4 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground mb-1">
                                {entry.prompt}
                              </p>
                              <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                                {entry.explanation}
                              </p>
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {entry.action.charAt(0).toUpperCase() +
                                    entry.action.slice(1)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {entry.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && streamingMessage && (
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-foreground font-medium">
                                  {streamingMessage}
                                </p>
                                {!streamingMessage.includes("successfully") &&
                                  !streamingMessage.includes("error") && (
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {history.length === 0 && !isLoading && (
                        <div className="text-center py-12">
                          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground font-medium mb-2">
                            Start a conversation
                          </p>
                          <p className="text-xs text-muted-foreground max-w-48 mx-auto">
                            Ask the AI to create a website and your conversation
                            history will appear here.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <Separator />
                <div className="space-y-3">
                  {error && !isLoading && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Generation Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {result && !isLoading && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <FileJson className="h-4 w-4 text-green-600 dark:text-green-400" />
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
                <div className="space-y-2">
                  <form
                    onSubmit={handleSubmit}
                    className="flex items-end gap-2"
                  >
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., 'Create a modern landing page for a coffee shop with a hero section, menu, and contact form...'"
                      className="flex-1 resize-none min-h-[80px] bg-background/50 border-2 focus:border-primary transition-colors"
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
                    <Button
                      type="submit"
                      disabled={!prompt.trim() || isLoading}
                      size="lg"
                      className="px-6 h-[80px] bg-primary hover:bg-primary/90 text-white font-medium"
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
                  </form>
                  {isLoading && (
                    <Button
                      variant="outline"
                      onClick={cancelGeneration}
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Generation
                    </Button>
                  )}
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
