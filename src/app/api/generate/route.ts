// app/api/generate/route.ts

import Groq from "groq-sdk";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { prompt, userId, plan = 'free' } = await req.json();

    console.log("🚀 Enhanced API Request received:", {
      prompt: prompt.substring(0, 100) + "...",
      userId,
      plan,
    });

    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      console.error("❌ GROQ_API_KEY is not configured");
      return new Response(
        JSON.stringify({
          error: "AI service is not configured. Please check your API key.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Enhanced system prompt with better structure
    const systemPrompt = `You are an elite AI web developer and UI/UX designer. Your mission is to create stunning, modern, and fully functional web applications from a single user prompt. You produce complete, production-ready code in a single response.

### Core Task
Generate a complete, self-contained set of HTML, CSS, and JavaScript code based on the user's request.

### Design & UX Principles
You MUST adhere to these design principles to ensure a high-quality user experience:
1. **Modern & Clean Aesthetics:** Use a contemporary design language. Think generous spacing, clean lines, a well-chosen, limited color palette (2-3 complementary colors), and modern, readable fonts (like a sans-serif system font stack).
2. **Responsive Design:** The layout MUST be fully responsive and look excellent on all screen sizes, from mobile phones to widescreen desktops. Use flexbox or grid for layouts. Use relative units (rem, em, %) where appropriate.
3. **User-Friendly Interface (UI):** Elements should be intuitive. Buttons and interactive elements must have clear hover and focus states. Forms should have proper labels and validation feedback.
4. **Accessibility (A11y):** Follow best practices. Use semantic HTML tags (\`<main>\`, \`<nav>\`, \`<section>\`), provide \`alt\` attributes for images, and ensure sufficient color contrast. Interactive elements should be keyboard-navigable.

### Technical Requirements
1. **Self-Contained:** Do not use any external libraries, frameworks (like React, Vue), or external images unless the user explicitly asks for them. All code must be in the three provided files. Link the CSS and JS files correctly in the HTML.
2. **Readable & Commented Code:** Write clean, well-formatted code. Add comments where the logic is complex or non-obvious.
3. **Vanilla JavaScript:** Use modern ES6+ JavaScript. Do not use jQuery. Manipulate the DOM directly (e.g., \`document.querySelector\`, \`addEventListener\`).
4. **Cross-Browser Compatibility:** Ensure the code works in the latest versions of modern browsers (Chrome, Firefox, Safari, Edge).

### CRITICAL: Output Format
You MUST structure your response using these EXACT file markers. Do not include any markdown formatting like \`\`\`html or any explanatory text outside the file markers.

IMPORTANT: You MUST use these EXACT file names:
- index.html (for HTML)
- styles.css (for CSS) 
- index.js (for JavaScript)

[--FILE:index.html--]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Title</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Your HTML content here -->
    <script src="index.js"></script>
</body>
</html>

[--FILE:styles.css--]
/* Your CSS styles here */
:root {
    --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
}

body {
    margin: 0;
    padding: 20px;
    font-family: var(--font-family);
    background-color: var(--background-color);
    color: var(--text-color);
}

[--FILE:index.js--]
// Your JavaScript code here
document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded and parsed');
    // Your main logic here
});

### Final Check
Before finishing, review ALL the rules above. Ensure your entire response consists ONLY of the three file blocks, starting with \`[--FILE:index.html--]\`.`;

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });

    console.log("🤖 Calling Groq API...");

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
                  console.log(
                    `🔍 Token ${totalTokens}:`,
                    JSON.stringify(token)
                  );
                }

                if (token.includes("[--FILE:")) {
                  fileMarkersFound++;
                  console.log("📁 File marker found:", token.trim());
                }

                // Also check for partial file markers that might be split across tokens
                if (accumulatedContent.includes("[--FILE:")) {
                  const matches =
                    accumulatedContent.match(/\[--FILE:[^\]]*--\]/g);
                  if (matches && matches.length > fileMarkersFound) {
                    console.log(
                      "📁 Found file markers in accumulated content:",
                      matches
                    );
                    fileMarkersFound = matches.length;
                  }
                }

                controller.enqueue(encoder.encode(token));
              }
            }
            console.log("✅ Stream completed:", {
              totalTokens,
              fileMarkersFound,
            });
            console.log(
              "📄 Final accumulated content preview:",
              accumulatedContent.substring(0, 500)
            );
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
        return new Response(
          JSON.stringify({
            error:
              "AI service is temporarily unavailable. Please try again in a few minutes.",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else if (error.status === 401) {
        return new Response(
          JSON.stringify({
            error: "Invalid API key. Please check your configuration.",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else if (error.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please wait a moment and try again.",
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            error: `AI service error: ${error.message || "Unknown error"}`,
          }),
          {
            status: error.status || 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
  } catch (error) {
    console.error("❌ General error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
