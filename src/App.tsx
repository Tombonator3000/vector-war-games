import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, Component, ReactNode } from "react";
import { MultiplayerProvider } from "@/contexts/MultiplayerProvider";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { RNGProvider } from "@/contexts/RNGContext";

// Global Error Boundary to catch rendering errors and prevent white screen
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[GlobalErrorBoundary] Caught error:', error);
    console.error('[GlobalErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#000408] flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-slate-900/90 border border-red-500/50 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-mono text-red-400 mb-4">
              SYSTEM MALFUNCTION
            </h1>
            <p className="text-cyan-300/80 mb-6 font-mono text-sm">
              A critical error occurred during initialization. Please refresh the page to try again.
            </p>
            <div className="bg-black/50 rounded p-4 mb-6 text-left overflow-auto max-h-48">
              <pre className="text-red-300/70 text-xs font-mono whitespace-pre-wrap">
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-cyan-500/20 border border-cyan-500/50 rounded text-cyan-300 font-mono hover:bg-cyan-500/30 transition-colors"
            >
              RESTART SYSTEM
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load pages to improve initial bundle size
const Index = lazy(() => import("./pages/Index"));
const PhaseOne = lazy(() => import("./pages/PhaseOne"));
const PhaseTwo = lazy(() => import("./pages/PhaseTwo"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component with explicit dark background
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#000408]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
      <p className="text-cyan-400 font-mono">INITIALIZING SYSTEM...</p>
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
  <GlobalErrorBoundary>
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
  </GlobalErrorBoundary>
);

export default App;
