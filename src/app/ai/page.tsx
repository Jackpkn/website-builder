// app/ai/page.tsx (or wherever your route is)
"use client";
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { WebsiteGenerator } from "@/components/website-sandbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Sparkles,
  FileCode,
  Download,
  Eye,
  Bot,
  Lock,
  MessageSquare,
} from "lucide-react";

/**
 * A simple fallback component shown while the main component loads.
 */
function LoadingFallback() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Initializing Generator...</p>
      </div>
    </div>
  );
}

export function FeaturesDialog() {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hide = localStorage.getItem("webcraft_hide_features_dialog");
      if (!hide) setOpen(true);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    if (dontShow && typeof window !== "undefined") {
      localStorage.setItem("webcraft_hide_features_dialog", "1");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-violet-600" />
            Welcome to WebCraft AI Studio
          </DialogTitle>
          <DialogDescription className="mt-2 text-base text-slate-600 dark:text-slate-300">
            Discover what you can do:
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 mt-4">
          <li className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
            <FileCode className="h-5 w-5 text-blue-500" />
            <span>
              <b>Create</b> modern websites with AI
            </span>
          </li>
          <li className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>
              <b>Update & modify</b> your site with chat prompts
            </span>
          </li>
          <li className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
            <Download className="h-5 w-5 text-emerald-500" />
            <span>
              <b>Export</b> and <b>import</b> your sessions
            </span>
          </li>
          <li className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
            <Eye className="h-5 w-5 text-indigo-500" />
            <span>
              <b>Live preview</b> of your generated website
            </span>
          </li>
          <li className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
            <Bot className="h-5 w-5 text-fuchsia-500" />
            <span>
              <b>Multiple AI models</b>: Gemini, Groq, OpenAI, Claude
            </span>
          </li>
          <li className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
            <MessageSquare className="h-5 w-5 text-orange-500" />
            <span>
              <b>Chat-based interface</b> for easy requests
            </span>
          </li>
          <li className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
            <Lock className="h-5 w-5 text-slate-500" />
            <span>
              <b>Privacy-first</b>: No data is stored on our servers
            </span>
          </li>
        </ul>

        {/* FIX: Moved checkbox out of the footer and into its own container */}
        <div className="flex items-center space-x-2 pt-4">
          <input
            id="dont-show-again"
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="h-4 w-4 shrink-0 rounded-sm accent-violet-600"
          />
          <label
            htmlFor="dont-show-again"
            className="text-sm font-medium leading-none text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            Do not show this again
          </label>
        </div>

        <DialogFooter className="mt-2">
          <Button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold"
          >
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const WebsiteSandboxPage = () => {
  // DEBUGGING: Confirm this page is rendering.
  console.log("/ai/page.tsx: Rendering Suspense boundary.");

  return (
    <Suspense fallback={<LoadingFallback />}>
      <FeaturesDialog />
      <WebsiteGenerator />
    </Suspense>
  );
};

export default WebsiteSandboxPage;
