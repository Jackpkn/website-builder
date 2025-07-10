// app/api/generate/route.ts

import {
  ContextAwareWebsiteGenerator,
  StreamEvent,
} from "@/lib/langchain/website-generator";

// Session management remains the same
type SessionData = {
  generator: ContextAwareWebsiteGenerator;
  lastAccessed: Date;
  createdAt: Date;
};
const sessionStore: Map<string, SessionData> = new Map();

// Session cleanup interval (placeholder, implement if needed)
setInterval(() => {
  /* ... */
}, 1000 * 60 * 15);

// ✅ NEW App Router handler with streaming
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      prompt,
      context,
      sessionId = "default",
      resetContext = false,
      model = "gemini",
    } = body;

    if (!prompt) {
      return Response.json({ message: "Prompt is required" }, { status: 400 });
    }

    // Set up the stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Define the callback that the generator will use to push data to the stream
        const streamCallback = (event: StreamEvent) => {
          const chunk = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        };

        try {
          // Get or create session
          let sessionData = sessionStore.get(sessionId);
          if (!sessionData || resetContext) {
            sessionData = {
              generator: new ContextAwareWebsiteGenerator(streamCallback), // Pass callback
              lastAccessed: new Date(),
              createdAt: new Date(),
            };
            sessionStore.set(sessionId, sessionData);
          } else {
            sessionData.lastAccessed = new Date();
            // IMPORTANT: Update the callback on the existing generator instance
            sessionData.generator["streamCallback"] = streamCallback;
          }

          const { generator } = sessionData;

          // Import context if provided
          if (context && typeof context === "object" && context.currentFiles) {
            generator.importContext(JSON.stringify(context));
          }

          // Start the generation process. DO NOT await it.
          // It will run in the background and use the callback to send data.
          await generator.processRequest(prompt, model);

          // Close the stream when the process is done
          controller.close();
        } catch (error) {
          console.error("❌ API Stream Error:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unknown stream error occurred";
          streamCallback({ type: "error", message: errorMessage });
          controller.close();
        }
      },
    });

    // Return the stream response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("❌ API Error (outside stream):", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return Response.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
