// components/WebsiteGenerator.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWebsiteGenerator, useFilePreview } from "@/hooks/useWebsiteGenerator";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { FileCode, Play, Download, Upload, Eraser, Loader2, MessageSquare, XCircle, FileJson, Bot } from "lucide-react";

type ActiveFile = "html" | "css" | "js";

const languageMap: Record<ActiveFile, string> = {
  html: "html",
  css: "css",
  js: "javascript",
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
    updateFiles,
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
    const handler = setTimeout(() => {
      generatePreview();
    }, 500);
    return () => clearTimeout(handler);
  }, [files, generatePreview]);

  useEffect(() => {
    // Auto scroll chat
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div');
        if(scrollableView) {
            scrollableView.scrollTop = 0;
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

  const handleFileEdit = (content: string) => {
    updateFiles({ [activeFile]: content });
  };

  const FileButton = ({ type, name }: { type: ActiveFile; name: string }) => (
    <Button
      variant={activeFile === type ? "secondary" : "ghost"}
      className="w-full justify-start gap-2"
      onClick={() => setActiveFile(type)}
    >
      <FileCode className="h-4 w-4" />
      <span>{name}</span>
    </Button>
  );

  return (
    <TooltipProvider>
      <div className={`h-screen w-full flex flex-col ${className}`}>
        <header className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center gap-2">
            <Play className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">AI Website Generator</h1>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={exportSession}><Download className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Export Session (.json)</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Import Session (.json)</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" onClick={resetSession}><Eraser className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Reset Session</TooltipContent></Tooltip>
          </div>
        </header>

        <ResizablePanelGroup direction="horizontal" className="flex-grow">
          <ResizablePanel defaultSize={15} minSize={10}>
             <div className="p-4 h-full">
              <h2 className="text-lg font-semibold mb-4">Files</h2>
              <div className="space-y-2">
                <FileButton type="html" name="index.html" />
                <FileButton type="css" name="styles.css" />
                <FileButton type="js" name="script.js" />
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={55} minSize={30}>
             <Tabs defaultValue="editor" className="h-full flex flex-col">
              <div className="p-2 border-b"><TabsList><TabsTrigger value="editor">Code Editor</TabsTrigger><TabsTrigger value="preview" disabled={!hasFiles}>Preview</TabsTrigger></TabsList></div>
              <TabsContent value="editor" className="flex-grow relative bg-[#1e1e1e]">
                <SyntaxHighlighter language={languageMap[activeFile]} style={vscDarkPlus} showLineNumbers wrapLines customStyle={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", padding: "1rem", margin: 0, overflow: "auto", backgroundColor: "transparent" }} codeTagProps={{ style: { fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit" } }}>
                  {String(files[activeFile] || "") + " "}
                </SyntaxHighlighter>
                <Textarea ref={textareaRef} value={files[activeFile]} onChange={(e) => handleFileEdit(e.target.value)} spellCheck="false" className="absolute top-0 left-0 w-full h-full p-4 bg-transparent text-transparent caret-white resize-none border-0 focus:outline-none font-mono text-sm leading-relaxed" />
              </TabsContent>
              <TabsContent value="preview" className="flex-grow bg-white">
                {previewUrl ? <iframe src={previewUrl} className="w-full h-full border-0" title="Website Preview" sandbox="allow-scripts allow-same-origin" /> : <div className="flex items-center justify-center h-full text-muted-foreground"><p>Generate content to see a preview.</p></div>}
              </TabsContent>
            </Tabs>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
            <Card className="h-full flex flex-col border-0 border-l rounded-none">
              <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Chat</CardTitle><CardDescription>Describe your website or request changes.</CardDescription></CardHeader>
              <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
                <div className="flex-grow relative">
                  <ScrollArea className="h-full absolute inset-0" ref={scrollAreaRef}>
                    <div className="p-1 space-y-4">
                      {getFormattedHistory().reverse().map((entry) => (
                        <div key={entry.id} className="p-3 bg-muted rounded-lg"><p className="font-semibold text-sm text-foreground">{entry.prompt}</p><p className="text-xs text-muted-foreground pt-1 pb-2">{entry.explanation}</p><div className="text-xs text-muted-foreground flex justify-between items-center"><span>{entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}</span><span>{entry.timestamp.toLocaleTimeString()}</span></div></div>
                      ))}
                      {isLoading && streamingMessage && (
                        <div className="p-3 bg-secondary rounded-lg flex items-start gap-3">
                          <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-1"/>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-secondary-foreground">{streamingMessage}</p>
                            {!streamingMessage.includes('successfully') && !streamingMessage.includes('error') && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>}
                          </div>
                        </div>
                      )}
                      {history.length === 0 && !isLoading && <div className="text-center text-sm text-muted-foreground pt-10">Generation history will appear here.</div>}
                    </div>
                  </ScrollArea>
                </div>
                <Separator />
                <div className="space-y-2">
                  {error && !isLoading && (
                    <Alert variant="destructive"><XCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
                  )}
                  {result && !isLoading && (
                    <Alert><FileJson className="h-4 w-4" /><AlertTitle>{result.action.charAt(0).toUpperCase() + result.action.slice(1)} Complete</AlertTitle><AlertDescription>{result.explanation}</AlertDescription></Alert>
                  )}
                </div>
                <form onSubmit={handleSubmit} className="flex items-start gap-2">
                  <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., 'Create a modern landing page...'" className="flex-1 resize-none" rows={2} disabled={isLoading} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }} />
                  <Button type="submit" disabled={!prompt.trim() || isLoading} size="lg">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send"}</Button>
                </form>
                {isLoading && <Button variant="outline" onClick={cancelGeneration}>Cancel Generation</Button>}
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} className="hidden" />
      </div>
    </TooltipProvider>
  );
}

export default WebsiteGenerator;