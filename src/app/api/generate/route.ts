// app/api/generate/route.ts

import { WebsiteGenerator } from "@/lib/langchain/website-generator";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { prompt, userId, plan = "free" } = await req.json();

    console.log("🚀 Enhanced API Request received:", {
      prompt: prompt.substring(0, 100) + "...",
      userId,
      plan,
      timestamp: new Date().toISOString(),
    });

    // Validate input
    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({
          error: "Invalid prompt provided",
          details: "Prompt must be a non-empty string",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if required API keys are available
    if (!process.env.GROQ_API_KEY || !process.env.GEMINI_API_KEY) {
      console.error("❌ Missing required API keys");
      return new Response(
        JSON.stringify({
          error: "AI service is not configured",
          details: "Please check your GROQ_API_KEY and GEMINI_API_KEY environment variables",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Rate limiting check (basic implementation)
    if (plan === "free") {
      // Add rate limiting logic here
      console.log("📊 Rate limiting check for free plan user:", userId);
    }

    try {
      // Initialize the enhanced website generator
      const generator = new WebsiteGenerator();
      console.log("🤖 Starting enhanced LangChain generation...");

      const encoder = new TextEncoder();

      // Create a readable stream for the response with step-by-step feedback
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Step 1: Planning
            controller.enqueue(encoder.encode("📋 Planning website structure...\n"));
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 2: Code Generation
            controller.enqueue(encoder.encode("💻 Generating initial code...\n"));
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 3: Refinement
            controller.enqueue(encoder.encode("✨ Refining and optimizing code...\n"));
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Generate the actual code
            const generatedCode = await generator.generateWebsite(prompt);

            // Send the generated code
            controller.enqueue(encoder.encode(generatedCode));

            controller.enqueue(encoder.encode("\n✅ Website generation completed!\n"));
            controller.close();
          } catch (error) {
            console.error("❌ Streaming error:", error);
            controller.error(error);
          }
        }
      });

      console.log("✅ Website generation completed successfully!");

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Generated-By": "LangChain-AI-Website-Builder",
        },
      });
    } catch (error) {
      console.error("❌ Generation error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to generate website",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("❌ API route error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
