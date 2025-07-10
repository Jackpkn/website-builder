// app/ai/page.tsx (or wherever your route is)

import { Suspense } from "react"; 
import { Loader2 } from "lucide-react";
import { WebsiteGenerator } from "@/components/website-sandbox";

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

const WebsiteSandboxPage = () => {
  // DEBUGGING: Confirm this page is rendering.
  console.log("/ai/page.tsx: Rendering Suspense boundary.");

  return (
    <Suspense fallback={<LoadingFallback />}>
      <WebsiteGenerator />
    </Suspense>
  );
};

export default WebsiteSandboxPage;
