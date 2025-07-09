import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

export class WebsiteGenerator {
    private groqLLM: ChatGroq;
    private gemini: ChatGoogleGenerativeAI;

    constructor() {
        this.groqLLM = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY!,
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.7,
            maxTokens: 4000,
        });

        this.gemini = new ChatGoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY!,
            model: "gemini-2.0-flash",
            temperature: 0.7,
        });
    }

    async generateWebsite(prompt: string): Promise<string> {
        try {
            console.log("🚀 Starting multi-step website generation...");

            // Step 1: Create a plan for the website
            console.log("📋 Step 1: Creating development plan...");
            const plan = await this.createPlan(prompt);

            // Step 2: Create the code for the website
            console.log("💻 Step 2: Generating initial code...");
            const code = await this.createCode(prompt, plan);

            // Step 3: Refine the code
            console.log("✨ Step 3: Refining and optimizing code...");
            const refinedCode = await this.refineCode(prompt, code);

            // Step 4: Post-process to ensure proper file separation
            console.log("🔧 Step 4: Post-processing and validating file structure...");
            const finalCode = this.postProcessCode(refinedCode);

            console.log("✅ Website generation completed successfully!");
            return finalCode;
        } catch (error) {
            console.error("❌ Error generating website:", error);
            throw error;
        }
    }

    private async createPlan(prompt: string): Promise<string> {
        const planningPrompt = PromptTemplate.fromTemplate(`
            You are a web development planning expert. Analyze the user's request and create a detailed plan for building their website.
            
            User Request: {prompt}
            
            Create a structured plan that includes:
            1. Website type and purpose
            2. Key features and functionality
            3. Design requirements
            4. Technical considerations
            5. File structure outline
            
            Respond with a clear, structured plan.
        `);

        const planningChain = RunnableSequence.from([
            planningPrompt,
            this.groqLLM,
            new StringOutputParser(),
        ]);

        return await planningChain.invoke({ prompt });
    }

    private async createCode(prompt: string, plan: string): Promise<string> {
        const generationPrompt = PromptTemplate.fromTemplate(`
            You are an elite AI web developer. Create a complete website with THREE SEPARATE FILES.

            ### CRITICAL REQUIREMENTS:
            1. You MUST create EXACTLY 3 files: index.html, styles.css, and index.js
            2. Each file must be completely separate and contain ONLY the appropriate code
            3. HTML file should contain ONLY HTML structure
            4. CSS file should contain ONLY CSS styles
            5. JS file should contain ONLY JavaScript code
            6. Use the EXACT file markers shown below

            ### Development Plan
            {plan}

            ### User Request
            {prompt}

            ### OUTPUT FORMAT - FOLLOW THIS EXACTLY:

            [--FILE:index.html--]
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Your Website Title</title>
                <link rel="stylesheet" href="styles.css">
            </head>
            <body>
                <!-- Your HTML content here -->
                <script src="index.js"></script>
            </body>
            </html>

            [--FILE:styles.css--]
            /* Your CSS styles here */
            body {{
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }}

            [--FILE:index.js--]
            // Your JavaScript code here
            document.addEventListener('DOMContentLoaded', () => {{
                console.log('Website loaded');
            }});

            ### IMPORTANT RULES:
            - DO NOT put HTML in the CSS file
            - DO NOT put CSS in the HTML file
            - DO NOT put JavaScript in the HTML file (except the script tag)
            - Each file should contain ONLY its appropriate code type
            - Use the exact file markers: [--FILE:index.html--], [--FILE:styles.css--], [--FILE:index.js--]
        `);

        const generationChain = RunnableSequence.from([
            generationPrompt,
            this.gemini,
            new StringOutputParser(),
        ]);

        return await generationChain.invoke({ prompt, plan });
    }

    private async refineCode(prompt: string, code: string): Promise<string> {
        const refinementPrompt = PromptTemplate.fromTemplate(`
            You are a web development expert. Review the generated code and suggest improvements for better functionality, performance, and user experience.
            
            Original Request: {originalPrompt}
            
            Generated Code:
            {code}
            
            Please review and improve the code while maintaining the same file structure and markers. Focus on:
            1. Better performance
            2. Enhanced user experience
            3. Improved accessibility
            4. Better code organization
            5. Additional features that would enhance the website
            
            Return the improved code with the same file markers. Make sure to escape any CSS curly braces by doubling them: {{ and }}.
        `);

        const refinementChain = RunnableSequence.from([
            refinementPrompt,
            this.gemini,
            new StringOutputParser(),
        ]);

        return await refinementChain.invoke({ originalPrompt: prompt, code });
    }

    // Post-process the generated code to ensure proper file separation
    private postProcessCode(code: string): string {
        console.log("🔍 Post-processing generated code...");
        console.log("📄 Raw code length:", code.length);

        // Extract files using regex with more specific patterns
        const htmlMatch = code.match(/\[--FILE:index\.html--\]([\s\S]*?)(?=\[--FILE:|$)/);
        const cssMatch = code.match(/\[--FILE:styles\.css--\]([\s\S]*?)(?=\[--FILE:|$)/);
        const jsMatch = code.match(/\[--FILE:index\.js--\]([\s\S]*?)(?=\[--FILE:|$)/);

        let html = htmlMatch ? htmlMatch[1].trim() : '';
        let css = cssMatch ? cssMatch[1].trim() : '';
        let js = jsMatch ? jsMatch[1].trim() : '';

        console.log("📁 Extracted files:");
        console.log("  HTML length:", html.length);
        console.log("  CSS length:", css.length);
        console.log("  JS length:", js.length);

        // If files weren't properly separated, try to fix common issues
        if (!html || !css || !js) {
            console.log("⚠️ Files not properly separated, attempting to fix...");

            // Check if all code is mixed together
            if (code.includes('<!DOCTYPE html') && code.includes('body') && code.includes('script')) {
                console.log("🔧 Detected mixed content, attempting separation...");

                // Extract HTML (from DOCTYPE to closing html tag)
                const htmlStart = code.indexOf('<!DOCTYPE html');
                const htmlEnd = code.lastIndexOf('</html>') + 7;
                if (htmlStart !== -1 && htmlEnd !== -1) {
                    html = code.substring(htmlStart, htmlEnd);
                    console.log("✅ Extracted HTML successfully");
                }

                // Extract CSS (look for CSS content between style tags or standalone)
                const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);
                if (styleMatch) {
                    css = styleMatch[1];
                    console.log("✅ Extracted CSS from style tags");
                } else {
                    // Look for CSS-like content (selectors with curly braces)
                    const cssPattern = /([a-zA-Z][a-zA-Z0-9_-]*\s*{[^}]*})/g;
                    const cssMatches = code.match(cssPattern);
                    if (cssMatches) {
                        css = cssMatches.join('\n');
                        console.log("✅ Extracted CSS from standalone content");
                    }
                }

                // Extract JS (look for script tags)
                const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
                if (scriptMatch) {
                    js = scriptMatch[1];
                    console.log("✅ Extracted JS from script tags");
                } else {
                    // Look for JavaScript-like content
                    const jsPattern = /(document\.|window\.|addEventListener|function\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+)[^;]*;/g;
                    const jsMatches = code.match(jsPattern);
                    if (jsMatches) {
                        js = jsMatches.join('\n');
                        console.log("✅ Extracted JS from standalone content");
                    }
                }
            }
        }

        // Ensure we have at least basic structure
        if (!html) {
            console.log("⚠️ No HTML found, creating basic structure");
            html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="app">
        <h1>Website Generated Successfully</h1>
        <p>Your website content will appear here.</p>
    </div>
    <script src="index.js"></script>
</body>
</html>`;
        }

        if (!css) {
            console.log("⚠️ No CSS found, creating basic styles");
            css = `/* Basic styles */
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
    color: #333;
}

#app {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}`;
        }

        if (!js) {
            console.log("⚠️ No JS found, creating basic script");
            js = `// Basic JavaScript
document.addEventListener('DOMContentLoaded', () => {
    console.log('Website loaded successfully');
});`;
        }

        // Clean up the extracted content
        html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace
        css = css.replace(/^\s+|\s+$/g, '');
        js = js.replace(/^\s+|\s+$/g, '');

        // Reconstruct the properly formatted output
        const finalCode = `[--FILE:index.html--]
${html}

[--FILE:styles.css--]
${css}

[--FILE:index.js--]
${js}`;

        console.log("✅ Post-processing completed");
        console.log("📊 Final file sizes:");
        console.log("  HTML:", html.length, "characters");
        console.log("  CSS:", css.length, "characters");
        console.log("  JS:", js.length, "characters");

        return finalCode;
    }

    // Method to generate streaming response for real-time display
    async generateWebsiteStream(prompt: string): Promise<ReadableStream> {
        try {
            console.log("🚀 Starting streaming website generation...");

            const encoder = new TextEncoder();

            return new ReadableStream({
                start: async (controller) => {
                    try {
                        // Step 1: Planning
                        controller.enqueue(encoder.encode("📋 Planning website structure...\n"));
                        const plan = await this.createPlan(prompt);

                        // Step 2: Code Generation
                        controller.enqueue(encoder.encode("💻 Generating initial code...\n"));
                        const code = await this.createCode(prompt, plan);

                        // Stream the code in chunks
                        const chunks = code.split('\n');
                        for (const chunk of chunks) {
                            controller.enqueue(encoder.encode(chunk + '\n'));
                            await new Promise(resolve => setTimeout(resolve, 10)); // Smooth streaming
                        }

                        // Step 3: Refinement
                        controller.enqueue(encoder.encode("\n✨ Refining and optimizing...\n"));
                        const refinedCode = await this.refineCode(prompt, code);

                        // Stream the refined code
                        const refinedChunks = refinedCode.split('\n');
                        for (const chunk of refinedChunks) {
                            controller.enqueue(encoder.encode(chunk + '\n'));
                            await new Promise(resolve => setTimeout(resolve, 10));
                        }

                        controller.enqueue(encoder.encode("\n✅ Website generation completed!\n"));
                        controller.close();
                    } catch (error) {
                        console.error("❌ Streaming error:", error);
                        controller.error(error);
                    }
                }
            });
        } catch (error) {
            console.error("❌ Error in streaming generation:", error);
            throw error;
        }
    }
}
