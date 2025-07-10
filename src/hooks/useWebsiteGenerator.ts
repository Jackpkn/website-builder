/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// hooks/useWebsiteGenerator.ts
"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// --- INTERFACES ---
interface WebsiteFiles {
  html: string;
  css: string;
  js: string;
}

interface GenerationResult {
  action: string;
  files: WebsiteFiles;
  changes: string[];
  explanation: string;
  success: boolean;
  metadata?: {
    websiteType?: string;
    features?: string[];
    dependencies?: string[];
  };
}

interface SessionInfo {
  sessionId: string;
  totalHistory: number;
  websiteType: string;
  features: string[];
  lastModified: Date | null;
}

interface GenerationState {
  isLoading: boolean;
  error: string | null;
  result: GenerationResult | null;
  sessionInfo: SessionInfo | null;
  files: WebsiteFiles;
  history: Array<{
    prompt: string;
    result: GenerationResult;
    timestamp: Date;
  }>;
  streamingMessage: string | null;
}

interface UseWebsiteGeneratorOptions {
  sessionId?: string;
  apiEndpoint?: string;
  onSuccess?: (result: GenerationResult) => void;
  onError?: (error: string) => void;
}

export function useWebsiteGenerator(options: UseWebsiteGeneratorOptions = {}) {
  const {
    sessionId = "default",
    apiEndpoint = "/api/generate",
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    result: null,
    sessionInfo: null,
    files: { html: "", css: "", js: "" },
    history: [],
    streamingMessage: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const generateWebsite = useCallback(
    async (prompt: string, resetContext = false, model: string = "gemini") => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        result: null,
        streamingMessage: "🚀 Starting generation...",
      }));

      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            sessionId,
            resetContext,
            model,
            context: resetContext
              ? null
              : {
                currentFiles: state.files,
                websiteType: state.sessionInfo?.websiteType || "",
                features: state.sessionInfo?.features || [],
                history: state.history.map((h) => ({
                  prompt: h.prompt,
                  action: h.result.action,
                  timestamp: h.timestamp,
                  changes: h.result.changes,
                })),
              },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        if (!response.body) {
          throw new Error("Response body is empty.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonString = line.substring(6);
              try {
                const event = JSON.parse(jsonString);

                switch (event.type) {
                  case "status":
                    setState((prev) => ({
                      ...prev,
                      streamingMessage: event.message,
                    }));
                    break;

                  case "final_result":
                    const { result, sessionInfo } = event.data;

                    if (!result.success) {
                      throw new Error(
                        result.explanation ||
                        "The generation process failed on the server."
                      );
                    }

                    const hasContent =
                      result.files.html || result.files.css || result.files.js;
                    if (result.success && !hasContent) {
                      throw new Error(
                        "Generation finished, but no code was produced. Please try a more specific prompt."
                      );
                    }

                    setState((prev) => ({
                      ...prev,
                      result,
                      sessionInfo: {
                        ...sessionInfo,
                        lastModified: sessionInfo.lastModified
                          ? new Date(sessionInfo.lastModified)
                          : null,
                      },
                      files: result.files,
                      history: resetContext
                        ? [{ prompt, result, timestamp: new Date() }]
                        : [
                          ...prev.history,
                          { prompt, result, timestamp: new Date() },
                        ],
                    }));
                    onSuccess?.(result);
                    break;

                  case "error":
                    throw new Error(event.message);
                }
              } catch (e) {
                console.error(
                  "Failed to parse stream event:",
                  e,
                  "Data:",
                  jsonString
                );
                throw new Error(
                  "Received a malformed response from the server."
                );
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            streamingMessage: null,
            error: "Generation was cancelled.",
          }));
          return;
        }
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          streamingMessage: "❗ An error occurred.",
        }));
        onError?.(errorMessage);
      } finally {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          streamingMessage: null,
        }));
      }
    },
    [
      apiEndpoint,
      sessionId,
      state.files,
      state.sessionInfo,
      state.history,
      onSuccess,
      onError,
    ]
  );

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const resetSession = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      result: null,
      sessionInfo: null,
      files: { html: "", css: "", js: "" },
      history: [],
      streamingMessage: null,
    });
  }, []);

  const updateFiles = useCallback((newFiles: Partial<WebsiteFiles>) => {
    setState((prev) => ({
      ...prev,
      files: { ...prev.files, ...newFiles },
    }));
  }, []);

  const getFormattedHistory = useCallback(() => {
    return state.history.map((entry, index) => ({
      id: index,
      prompt: entry.prompt,
      action: entry.result.action,
      changes: entry.result.changes,
      explanation: entry.result.explanation,
      timestamp: entry.timestamp,
      success: entry.result.success,
    }));
  }, [state.history]);

  const exportSession = useCallback(() => {
    const exportData = {
      sessionId,
      files: state.files,
      sessionInfo: state.sessionInfo,
      history: state.history,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `website-session-${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sessionId, state.files, state.sessionInfo, state.history]);

  const importSession = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          setState({
            isLoading: false,
            error: null,
            result: null,
            streamingMessage: null,
            sessionInfo: data.sessionInfo
              ? {
                ...data.sessionInfo,
                lastModified: data.sessionInfo.lastModified
                  ? new Date(data.sessionInfo.lastModified)
                  : null,
              }
              : null,
            files: data.files || { html: "", css: "", js: "" },
            history: (data.history || []).map((h: any) => ({
              ...h,
              timestamp: new Date(h.timestamp),
            })),
          });
          resolve();
        } catch (error) {
          reject(new Error("Invalid session file format"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }, []);

  const hasFiles =
    state.files.html.length > 0 ||
    state.files.css.length > 0 ||
    state.files.js.length > 0;

  return {
    ...state,
    hasFiles,
    generateWebsite,
    cancelGeneration,
    resetSession,
    updateFiles,
    getFormattedHistory,
    exportSession,
    importSession,
  };
}

export function useFilePreview(files: WebsiteFiles) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
      }
    };
  }, []);

  const generatePreview = useCallback(() => {
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
    }

    const previewHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>${files.css}</style>
      </head>
      <body>
        ${files.html}
        <script>${files.js}</script>
      </body>
      </html>
    `;
    const blob = new Blob([previewHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    currentUrlRef.current = url;
    setPreviewUrl(url);
  }, [files]);

  return {
    previewUrl,
    generatePreview,
  };
}
