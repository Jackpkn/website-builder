// app/api/generate/route.ts

import Groq from "groq-sdk";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    console.log("🚀 API Request received:", { prompt: prompt.substring(0, 100) + "..." });

    const systemPrompt = `You are an expert web developer AI. Your task is to generate a complete, self-contained set of HTML, CSS, and JavaScript code based on the user's request.

CRITICAL: You MUST structure your response using these EXACT file markers. Do not use any other format:

[--FILE:index.html--]
<!DOCTYPE html>
<html>
<head>
    <title>Your Title</title>
</head>
<body>
    <!-- Your HTML content here -->
</body>
</html>

[--FILE:styles.css--]
/* Your CSS styles here */
body {
    margin: 0;
    padding: 20px;
}

[--FILE:index.js--]
// Your JavaScript code here
console.log('Hello World');

IMPORTANT RULES:
1. ALWAYS start with [--FILE:index.html--] marker
2. ALWAYS include [--FILE:styles.css--] marker  
3. ALWAYS include [--FILE:index.js--] marker
4. Do NOT include any markdown formatting like \`\`\`html
5. Do NOT include any explanatory text outside the file markers
6. Provide complete, working code for each file
7. The user will see this stream directly in their code editor

Example structure:
[--FILE:index.html--]
<!DOCTYPE html>
<html>
<head>
    <title>Calculator</title>
</head>
<body>
    <div id="calculator">
        <input type="text" id="display" readonly>
        <div class="buttons">
            <button onclick="appendNumber('7')">7</button>
        </div>
    </div>
</body>
</html>

[--FILE:styles.css--]
#calculator {
    width: 300px;
    margin: 50px auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 10px;
}

[--FILE:index.js--]
function appendNumber(num) {
    document.getElementById('display').value += num;
}
`;

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });

    console.log("🤖 Calling Groq API...");

    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      console.error("❌ GROQ_API_KEY is not configured");
      return new Response(JSON.stringify({
        error: "AI service is not configured. Please check your API key."
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      const completion = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      });

      const encoder = new TextEncoder();
      let totalTokens = 0;
      let fileMarkersFound = 0;

      const stream = new ReadableStream({
        async start(controller) {
          try {
            console.log("📡 Starting to stream response...");
            let accumulatedContent = "";
            for await (const chunk of completion) {
              const token = chunk.choices?.[0]?.delta?.content;
              if (token) {
                totalTokens++;
                accumulatedContent += token;

                // Log the first few tokens to see what we're getting
                if (totalTokens <= 5) {
                  console.log(`🔍 Token ${totalTokens}:`, JSON.stringify(token));
                }

                if (token.includes("[--FILE:")) {
                  fileMarkersFound++;
                  console.log("📁 File marker found:", token.trim());
                }

                // Also check for partial file markers that might be split across tokens
                if (accumulatedContent.includes("[--FILE:")) {
                  const matches = accumulatedContent.match(/\[--FILE:[^\]]*--\]/g);
                  if (matches && matches.length > fileMarkersFound) {
                    console.log("📁 Found file markers in accumulated content:", matches);
                    fileMarkersFound = matches.length;
                  }
                }

                controller.enqueue(encoder.encode(token));
              }
            }
            console.log("✅ Stream completed:", { totalTokens, fileMarkersFound });
            console.log("📄 Final accumulated content preview:", accumulatedContent.substring(0, 500));
            controller.close();
          } catch (err) {
            console.error("❌ Stream error:", err);
            controller.error(err);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    } catch (groqError: unknown) {
      console.error("❌ Groq API error:", groqError);

      // Handle specific Groq errors
      const error = groqError as { status?: number; message?: string };

      if (error.status === 503) {
        return new Response(JSON.stringify({
          error: "AI service is temporarily unavailable. Please try again in a few minutes."
        }), {
          status: 503,
          headers: { "Content-Type": "application/json" }
        });
      } else if (error.status === 401) {
        return new Response(JSON.stringify({
          error: "Invalid API key. Please check your configuration."
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      } else if (error.status === 429) {
        return new Response(JSON.stringify({
          error: "Rate limit exceeded. Please wait a moment and try again."
        }), {
          status: 429,
          headers: { "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({
          error: `AI service error: ${error.message || 'Unknown error'}`
        }), {
          status: error.status || 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  } catch (error) {
    console.error("❌ General error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error. Please try again."
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
