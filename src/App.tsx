import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { MultiplayerProvider } from "@/contexts/MultiplayerProvider";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { RNGProvider } from "@/contexts/RNGContext";

// Lazy load pages to improve initial bundle size
const Index = lazy(() => import("./pages/Index"));
const PhaseOne = lazy(() => import("./pages/PhaseOne"));
const PhaseTwo = lazy(() => import("./pages/PhaseTwo"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-deep-space">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-neon-cyan mx-auto mb-4"></div>
      <p className="text-neon-cyan">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optimize React Query defaults
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RNGProvider>
        <TutorialProvider>
          <MultiplayerProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/fase-1" element={<PhaseOne />} />
                  <Route path="/fase-2" element={<PhaseTwo />} />
                  {/* Redirects for common typos */}
                  <Route path="/fase-one" element={<Navigate to="/fase-1" replace />} />
                  <Route path="/phase-one" element={<Navigate to="/fase-1" replace />} />
                  <Route path="/fase-two" element={<Navigate to="/fase-2" replace />} />
                  <Route path="/phase-two" element={<Navigate to="/fase-2" replace />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </MultiplayerProvider>
        </TutorialProvider>
      </RNGProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
