# AI Code Generator

A modern web application that generates complete HTML, CSS, and JavaScript code using AI. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🤖 **AI-Powered Code Generation**: Generate complete websites and components using Groq AI
- 📝 **Real-time Code Editing**: Syntax-highlighted code editor with live preview
- 🎨 **Live Preview**: See your generated code in real-time
- 📁 **File Management**: Organize HTML, CSS, and JavaScript files
- 💬 **Chat Interface**: Interactive chat with AI for code generation
- 🎯 **Beautiful UI**: Modern, responsive design with smooth animations

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Groq API
- **UI Components**: Radix UI + Lucide React icons
- **Code Highlighting**: React Syntax Highlighter
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Groq API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd website-builder
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
GROQ_API_KEY=your_groq_api_key_here
```

You can get a Groq API key by signing up at [https://console.groq.com/](https://console.groq.com/)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard:
   - `GROQ_API_KEY`: Your Groq API key
4. Deploy!

### Manual Deployment

1. Build the project:
```bash
pnpm build
```

2. Start the production server:
```bash
pnpm start
```

## Usage

1. **Start a conversation**: Type your request in the chat (e.g., "Create a calculator")
2. **Watch generation**: See the AI generate HTML, CSS, and JavaScript in real-time
3. **View code**: Switch between Code and Preview tabs to see your generated code
4. **Edit if needed**: Double-click on code to make edits (when not generating)
5. **Iterate**: Ask for modifications or improvements in the chat

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts          # AI generation API
│   │   └── id/
│   │       └── page.tsx              # Main application page
│   └── layout.tsx                # Root layout
├── components/
│   └── ui/
│       ├── ai-generation-loader.tsx  # AI generation loader
│       └── code-editor.tsx           # Syntax-highlighted code editor
└── lib/
    └── utils.ts                  # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
