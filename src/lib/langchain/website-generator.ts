// lib/langchain/website-generator.ts

import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

// --- Interfaces ---
interface WebsiteFiles {
  html: string;
  css: string;
  js: string;
}

interface WebsiteContext {
  currentFiles: WebsiteFiles;
  history: {
    prompt: string;
    action: "create" | "modify" | "add" | "remove";
    timestamp: Date;
    changes: string[];
  }[];
  websiteType: string;
  features: string[];
  dependencies: string[];
}

interface ModificationResult {
  action: "create" | "modify" | "add" | "remove";
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

interface LLMResponse {
  summary?: {
    type: string;
    features: string[];
    dependencies: string[];
  };
  changes: string[];
  explanation: string;
  files: {
    html: string;
    css: string;
    js: string;
  };
}

export type StreamEvent =
  | { type: "status"; message: string }
  | { type: "code_chunk"; file: keyof WebsiteFiles; chunk: string }
  | {
      type: "final_result";
      data: { result: ModificationResult; sessionInfo: any };
    }
  | { type: "error"; message: string };

export class ContextAwareWebsiteGenerator {
  private groqLLM: ChatGroq;
  private gemini: ChatGoogleGenerativeAI;
  private context: WebsiteContext;
  private streamCallback: (event: StreamEvent) => void;

  constructor(streamCallback: (event: StreamEvent) => void = () => {}) {
    this.streamCallback = streamCallback;

    this.groqLLM = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY!,
      model: "llama3-70b-8192",
      temperature: 0.2,
      maxTokens: 8000,
    });

    this.gemini = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
      model: "gemini-1.5-flash",
      temperature: 0.2,
    });

    this.context = {
      currentFiles: { html: "", css: "", js: "" },
      history: [],
      websiteType: "",
      features: [],
      dependencies: [],
    };
  }

  private sendStatusUpdate(message: string): void {
    console.log(message);
    this.streamCallback({ type: "status", message });
  }

  private parseResponse(
    response: string,
    action: "create" | "modify" | "add" | "remove"
  ): ModificationResult {
    this.sendStatusUpdate("📝 Parsing LLM response...");

    // VITAL DEBUG LOGGING
    console.log("--- RAW LLM RESPONSE START ---");
    console.log(response);
    console.log("--- RAW LLM RESPONSE END ---");

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]) as LLMResponse;
          const result = this.createResultFromParsedResponse(parsed, action);
          // CRITICAL CHECK for parsed JSON
          const hasContent =
            result.files.html || result.files.css || result.files.js;
          if (result.success && !hasContent && action === "create") {
            console.warn(
              "⚠️ JSON parsing succeeded but no code was extracted. Treating as failure."
            );
            return {
              ...result,
              success: false,
              changes: ["Failed to generate code."],
              explanation:
                "The AI responded, but I couldn't extract any valid code from its response. Please try rephrasing your request.",
            };
          }
          return result;
        } catch (e) {
          console.log("JSON parsing failed, falling back to regex parsing");
        }
      }

      const result = this.parseWithRegex(response, action);

      // CRITICAL CHECK for regex parsing
      const hasContent =
        result.files.html || result.files.css || result.files.js;
      if (result.success && !hasContent && action === "create") {
        console.warn(
          "⚠️ Regex parsing succeeded but no code was extracted. Treating as failure."
        );
        return {
          ...result,
          success: false,
          changes: ["Failed to generate code."],
          explanation:
            "The AI responded, but I couldn't extract any valid code from the text. Please try rephrasing your request.",
        };
      }

      return result;
    } catch (error) {
      console.error("❌ Parsing error:", error);
      return this.createFallbackResult(action);
    }
  }

  private createResultFromParsedResponse(
    parsed: LLMResponse,
    action: "create" | "modify" | "add" | "remove"
  ): ModificationResult {
    const files: WebsiteFiles = {
      html: this.cleanCode(parsed.files?.html) || "",
      css: this.cleanCode(parsed.files?.css) || "",
      js: this.cleanCode(parsed.files?.js) || "",
    };

    return {
      action,
      files,
      changes: parsed.changes || ["Code updated"],
      explanation:
        parsed.explanation ||
        "The code has been updated based on your request.",
      success: true,
      metadata: parsed.summary
        ? {
            websiteType: parsed.summary.type,
            features: parsed.summary.features,
            dependencies: parsed.summary.dependencies,
          }
        : undefined,
    };
  }

  private parseWithRegex(
    response: string,
    action: "create" | "modify" | "add" | "remove"
  ): ModificationResult {
    const patterns = {
      html: /```html([\s\S]*?)```/,
      css: /```css([\s\S]*?)```/,
      js: /```javascript([\s\S]*?)```/,
    };

    const files: WebsiteFiles = {
      html:
        this.extractAndCleanCode(response, patterns.html) ||
        (action === "modify" ? this.context.currentFiles.html : ""),
      css:
        this.extractAndCleanCode(response, patterns.css) ||
        (action === "modify" ? this.context.currentFiles.css : ""),
      js:
        this.extractAndCleanCode(response, patterns.js) ||
        (action === "modify" ? this.context.currentFiles.js : ""),
    };

    // For simplicity, we'll use generic change/explanation if not found
    const changes = ["Code updated based on request."];
    const explanation =
      "The code has been updated. Review the changes in the editor.";

    return { action, files, changes, explanation, success: true };
  }

  private extractAndCleanCode(response: string, pattern: RegExp): string {
    const match = response.match(pattern);
    return match ? this.cleanCode(match[1]) : "";
  }

  private cleanCode(rawCode: string): string {
    if (!rawCode) return "";
    return rawCode.trim();
  }

  private createFallbackResult(
    action: "create" | "modify" | "add" | "remove"
  ): ModificationResult {
    return {
      action,
      files: this.context.currentFiles,
      changes: ["Unable to parse response - files preserved"],
      explanation:
        "There was an issue parsing the response from the AI. Your existing code has been preserved.",
      success: false,
    };
  }

  async processRequest(prompt: string): Promise<void> {
    try {
      this.sendStatusUpdate("🚀 Processing request with context awareness...");
      const intent = await this.analyzeIntent(prompt);
      this.sendStatusUpdate(`🎯 Detected intent: ${intent.action}`);
      let result: ModificationResult;
      switch (intent.action) {
        case "create":
          result = await this.createNewWebsite(prompt);
          break;
        default:
          result = await this.modifyExistingCode(prompt, intent);
      }
      if (result.success) {
        this.updateContext(prompt, result);
      }
      this.streamCallback({
        type: "final_result",
        data: {
          result,
          sessionInfo: this.getFormattedFiles().metadata,
        },
      });
    } catch (error) {
      console.error("❌ Error processing request:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      this.streamCallback({ type: "error", message: errorMessage });
    }
  }

  private async analyzeIntent(prompt: string): Promise<{
    action: "create" | "modify" | "add" | "remove";
    target: string;
    details: string;
  }> {
    const intentPrompt = PromptTemplate.fromTemplate(`
      Analyze the user's request.
      Context: Has existing code: {hasCode}.
      Request: {prompt}
      Primary action: [create|modify]
      Respond with only one word: create or modify.
      - "create": If there is no code OR the user explicitly asks to start over, new page, etc.
      - "modify": For all other changes.
    `);
    const intentChain = RunnableSequence.from([
      intentPrompt,
      this.groqLLM,
      new StringOutputParser(),
    ]);
    const response = await intentChain.invoke({
      prompt,
      hasCode: this.context.currentFiles.html ? "Yes" : "No",
    });
    const action = response.includes("create") ? "create" : "modify";
    return { action, target: "general", details: prompt };
  }

  private async createNewWebsite(prompt: string): Promise<ModificationResult> {
    this.sendStatusUpdate("🆕 Creating new website...");
    const creationPrompt = PromptTemplate.fromTemplate(`
      You are an expert web developer. Create a complete, modern, and responsive website based on this request: "{prompt}"
      
      **CRITICAL: Respond with this EXACT JSON structure inside a single block:**
      {{
        "summary": {{ "type": "...", "features": ["..."], "dependencies": [] }},
        "changes": ["Initial creation"],
        "explanation": "Brief explanation of what was created.",
        "files": {{
          "html": "<!-- Complete HTML code here -->",
          "css": "/* Complete CSS code here */", 
          "js": "// Complete JavaScript code here"
        }}
      }}
    `);
    const creationChain = RunnableSequence.from([
      creationPrompt,
      this.gemini,
      new StringOutputParser(),
    ]);
    const stream = await creationChain.stream({ prompt });
    let fullResponse = "";
    for await (const chunk of stream) {
      fullResponse += chunk;
      this.sendStatusUpdate("🤖 Generating code...");
    }
    return this.parseResponse(fullResponse, "create");
  }

  private async modifyExistingCode(
    prompt: string,
    intent: any
  ): Promise<ModificationResult> {
    this.sendStatusUpdate("✏️ Modifying existing code...");
    const modificationPrompt = PromptTemplate.fromTemplate(`
      You are an expert web developer. Modify the existing website code based on the user's request: "{prompt}"
      
      Current HTML:
      \`\`\`html
      {currentHtml}
      \`\`\`
      
      Current CSS:
      \`\`\`css
      {currentCss}
      \`\`\`
      
      Current JS:
      \`\`\`javascript
      {currentJs}
      \`\`\`
      
      **CRITICAL: Respond with this EXACT JSON structure inside a single block:**
      {{
        "changes": ["Specific change 1", "Specific change 2"],
        "explanation": "Clear explanation of modifications.",
        "files": {{
          "html": "<!-- Complete UPDATED HTML code -->",
          "css": "/* Complete UPDATED CSS code */",
          "js": "// Complete UPDATED JavaScript code"
        }}
      }}
    `);
    const modificationChain = RunnableSequence.from([
      modificationPrompt,
      this.gemini,
      new StringOutputParser(),
    ]);
    const stream = await modificationChain.stream({
      prompt,
      currentHtml: this.context.currentFiles.html,
      currentCss: this.context.currentFiles.css,
      currentJs: this.context.currentFiles.js,
    });
    let fullResponse = "";
    for await (const chunk of stream) {
      fullResponse += chunk;
      this.sendStatusUpdate("🤖 Modifying code...");
    }
    return this.parseResponse(fullResponse, "modify");
  }

  private updateContext(prompt: string, result: ModificationResult): void {
    this.sendStatusUpdate("🔄 Updating context...");
    this.context.currentFiles = result.files;
    if (result.metadata) {
      if (result.metadata.websiteType)
        this.context.websiteType = result.metadata.websiteType;
      if (result.metadata.features)
        this.context.features = result.metadata.features;
    }
    this.context.history.push({
      prompt,
      action: result.action,
      timestamp: new Date(),
      changes: result.changes,
    });
    this.context.history = this.context.history.slice(-10);
    this.sendStatusUpdate("✅ Context updated successfully");
  }

  public importContext(contextData: string): void {
    try {
      const parsed = JSON.parse(contextData);
      if (parsed.history) {
        parsed.history.forEach((entry: any) => {
          if (entry.timestamp && typeof entry.timestamp === "string") {
            entry.timestamp = new Date(entry.timestamp);
          }
        });
      }
      this.context = parsed;
      this.sendStatusUpdate("📥 Context imported successfully");
    } catch (error) {
      console.error("❌ Failed to import context:", error);
    }
  }

  public getFormattedFiles(): {
    files: WebsiteFiles;
    metadata: {
      websiteType: string;
      features: string[];
      lastModified: Date | null;
      totalHistory: number;
    };
  } {
    return {
      files: this.context.currentFiles,
      metadata: {
        websiteType: this.context.websiteType,
        features: this.context.features,
        lastModified:
          this.context.history.length > 0
            ? this.context.history[this.context.history.length - 1].timestamp
            : null,
        totalHistory: this.context.history.length,
      },
    };
  }
}
