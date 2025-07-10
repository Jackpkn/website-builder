/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

  constructor(streamCallback: (event: StreamEvent) => void = () => { }) {
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
    } catch (error: unknown) {
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
    // Enhanced regex patterns for better matching
    const patterns = {
      html: /(?:HTML|html)[\s\S]*?```(?:html)?\s*([\s\S]*?)```/i,
      css: /(?:CSS|css)[\s\S]*?```(?:css)?\s*([\s\S]*?)```/i,
      js: /(?:JavaScript|JS|js)[\s\S]*?```(?:javascript|js)?\s*([\s\S]*?)```/i,
      changes: /(?:Changes|CHANGES)[\s\S]*?:([\s\S]*?)(?=\n\n|\n(?:[A-Z]|$))/i,
      explanation:
        /(?:Explanation|EXPLANATION)[\s\S]*?:([\s\S]*?)(?=\n\n|\n(?:[A-Z]|$))/i,
      summary: /(?:Summary|SUMMARY)[\s\S]*?:([\s\S]*?)(?=\n\n|\n(?:[A-Z]|$))/i,
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

  async processRequest(prompt: string, model: string = "gemini"): Promise<ModificationResult> {
    try {
      this.sendStatusUpdate("🚀 Processing request with context awareness...");
      const intent = await this.analyzeIntent(prompt);
      this.sendStatusUpdate(`🎯 Detected intent: ${intent.action}`);
      let result: ModificationResult;
      switch (intent.action) {
        case "create":
          result = await this.createNewWebsite(prompt, model);
          break;
        default:
          result = await this.modifyExistingCode(prompt, intent, model);
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
      return result;
    } catch (error: unknown) {
      console.error("❌ Error processing request:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      this.streamCallback({ type: "error", message: errorMessage });
      return this.createFallbackResult("modify");
    }
  }

  private async analyzeIntent(prompt: string): Promise<{
    action: "create" | "modify" | "add" | "remove";
    target: string;
    details: string;
  }> {
    const intentPrompt = PromptTemplate.fromTemplate(`
      Analyze the user's request with enhanced context awareness.
      Context: Has existing code: {hasCode}.
      Request: {prompt}
      
      Consider these factors:
      - Keywords like "new", "create", "build", "make", "start over" suggest creation
      - Keywords like "add", "change", "update", "modify", "fix", "improve" suggest modification
      - If user mentions specific elements to change, it's likely modification
      - If user wants completely different functionality, it might be creation
      
      Primary action: [create|modify]
      Respond with only one word: create or modify.
      - "create": If there is no code OR the user explicitly asks to start over, new page, different concept, or complete rebuild
      - "modify": For all other changes including additions, improvements, fixes, and enhancements
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

  private async createNewWebsite(prompt: string, model: string = "gemini"): Promise<ModificationResult> {
    this.sendStatusUpdate("🆕 Creating new website...");

    const creationPrompt = PromptTemplate.fromTemplate(`
  You are an expert web developer and UI/UX designer. Create a complete, modern, and visually stunning website based on this request: "{prompt}"
  
  **DESIGN PRINCIPLES:**
  - Prioritize modern, clean aesthetics with contemporary design trends
  - Use vibrant colors, smooth animations, and micro-interactions
  - Implement responsive design that works flawlessly on all devices
  - Focus on user experience with intuitive navigation and accessibility
  - Create visually engaging interfaces that feel premium and professional
  - Use modern CSS features like flexbox, grid, custom properties, and animations
  - Implement hover effects, transitions, and interactive elements
  - Ensure proper contrast ratios and semantic HTML structure
  
  **TECHNICAL REQUIREMENTS:**
  - Write semantic, accessible HTML5 with proper ARIA attributes
  - Use modern CSS with custom properties, flexbox/grid, and smooth animations
  - Implement vanilla JavaScript with ES6+ features and proper event handling
  - Ensure cross-browser compatibility and optimal performance
  - Include proper meta tags for SEO and mobile responsiveness
  - Use modern typography with web-safe fonts and proper hierarchy
  - Implement loading states, error handling, and user feedback
  
  **CODE QUALITY:**
  - Write clean, well-commented, and maintainable code
  - Use consistent naming conventions and proper code organization
  - Implement proper error handling and edge case management
  - Optimize for performance with efficient DOM manipulation
  - Follow modern JavaScript best practices and avoid deprecated methods
  
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
    // Select LLM based on model
    let llm: any = this.gemini;
    if (model === "groq") llm = this.groqLLM;
    // Add more models here as needed
    // e.g., if (model === "openai") llm = this.openai;
    // e.g., if (model === "deepseek") llm = this.deepseek;
    const creationChain = RunnableSequence.from([
      creationPrompt,
      llm,
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
    intent: {
      action: "create" | "modify" | "add" | "remove";
      target: string;
      details: string;
    },
    model: string = "gemini"
  ): Promise<ModificationResult> {
    this.sendStatusUpdate("✏️ Modifying existing code...");
    const modificationPrompt = PromptTemplate.fromTemplate(`
      You are an expert web developer and UI/UX designer. Enhance and modify the existing website code based on the user's request: "{prompt}"
      
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
      
      **MODIFICATION PRINCIPLES:**
      - Preserve existing functionality while adding requested features
      - Maintain design consistency and visual hierarchy
      - Improve user experience with smooth transitions and interactions
      - Enhance accessibility and responsive design
      - Optimize performance and code quality
      - Add modern UI patterns and micro-interactions where appropriate
      - Ensure backward compatibility with existing features
      
      **ENHANCEMENT GUIDELINES:**
      - Add subtle animations and hover effects for better engagement
      - Improve color schemes and typography for better readability
      - Implement proper loading states and user feedback
      - Add error handling and edge case management
      - Optimize CSS for better performance and maintainability
      - Enhance JavaScript with modern ES6+ features
      - Improve mobile responsiveness and touch interactions
      
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
    // Select LLM based on model
    let llm: any = this.gemini;
    if (model === "groq") llm = this.groqLLM;
    // Add more models here as needed
    // e.g., if (model === "openai") llm = this.openai;
    // e.g., if (model === "deepseek") llm = this.deepseek;
    const modificationChain = RunnableSequence.from([
      modificationPrompt,
      llm,
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
    } catch (error: unknown) {
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
