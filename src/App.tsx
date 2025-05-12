import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Issues from "./pages/Issues";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { ProfileProvider } from "@/components/ProfileContext";
import ProfileSelector from "@/components/ProfileSelector";
import ProfileIndicator from "@/components/ProfileIndicator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ProfileProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ProfileSelector />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <header className="border-b py-3 px-6 flex justify-between items-center">
              <h1 className="text-xl font-bold">Issue Tracker</h1>
              <ProfileIndicator />
            </header>
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/issues" element={<Issues />} />
                <Route path="/issues/:segment" element={<Issues />} />
                <Route path="/admin" element={<Admin />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </ProfileProvider>
  </QueryClientProvider>
);

export default App;
