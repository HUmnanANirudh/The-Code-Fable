import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ResultsDisplay from "./components/ResultsDisplay";
import { Spinner } from "./components/ui/spinner";
import type { AnalysisResult, HistoryItem } from "./types";
import ChatInput from "./components/ChatInput";
import { Toaster, toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";
import { Button } from "./components/ui/button";
import { Copy, Share2, Plus } from "lucide-react";
import { Input } from "./components/ui/input";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from "./components/ui/sidebar";
import { AnimatePresence, motion } from "motion/react";
import { ThemeToggle } from "./components/ThemeToggle";

const API_URL = "http://localhost:8000/api/v1";

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const repoId = searchParams.get("repo_id");
    if (repoId) {
      const fetchResults = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API_URL}/results/${repoId}`);
          if (response.ok) {
            const data = await response.json();
            setResults(data);
          } else {
            toast.error("Failed to fetch analysis results.");
          }
        } catch (error) {
          toast.error("An unknown error occurred while fetching results.");
        }
        setLoading(false);
      };
      fetchResults();
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/history`);
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };

    fetchHistory();
  }, []);

  const handleAnalysis = async (repoUrl: string) => {
    setLoading(true);
    setResults(null);

    try {
      const urlParts = new URL(repoUrl);
      const pathParts = urlParts.pathname.split("/").filter(Boolean);
      if (pathParts.length < 2) {
        throw new Error("Invalid GitHub repository URL");
      }
      const [owner, repo] = pathParts;

      const analyzeResponse = await fetch(
        `${API_URL}/analyze?repo=${owner}/${repo}`
      );

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.detail || "Failed to start analysis");
      }

      const analyzeData = await analyzeResponse.json();

      if (analyzeData.job_id) {
        const pollStatus = async () => {
          const statusResponse = await fetch(
            `${API_URL}/status/${analyzeData.job_id}`
          );
          if (!statusResponse.ok) {
            throw new Error("Failed to get job status");
          }
          const statusData = await statusResponse.json();

          if (statusData.status === "completed") {
            const resultsResponse = await fetch(
              `${API_URL}/results/${analyzeData.repo_id}`
            );
            if (!resultsResponse.ok) {
              throw new Error("Failed to get results");
            }
            const resultsData = await resultsResponse.json();
            setResults(resultsData);
            setLoading(false);
          } else if (statusData.status === "failed") {
            toast.error("Analysis job failed. Please try again later.");
            setLoading(false);
          } else if (statusData.status === "TIMED_OUT") {
            toast.error(
              "Analysis timed out. The repository may be too large."
            );
            setLoading(false);
          } else {
            setTimeout(pollStatus, 2000);
          }
        };

        setTimeout(pollStatus, 2000);
      } else {
        setResults(analyzeData);
        setHistory((prev) => [
          {
            id: analyzeData.id,
            owner: analyzeData.owner,
            name: analyzeData.name,
          },
          ...prev,
        ]);
        setLoading(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unknown error occurred");
      }
      setLoading(false);
    }
  };

  const handleSelectRepo = async (repo: HistoryItem) => {
    setLoading(true);
    setResults(null);
    try {
      const response = await fetch(`${API_URL}/results/${repo.id}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setSearchParams({ repo_id: repo.id });
      } else {
        toast.error("Failed to fetch analysis results.");
      }
    } catch (error) {
      toast.error("An unknown error occurred while fetching results.");
    }
    setLoading(false);
  };

  const handleNewChat = () => {
    setResults(null);
    setSearchParams({});
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleCopyLink = () => {
    if (results) {
      const url = new URL(window.location.href);
      url.search = "";
      url.searchParams.set("repo_id", results.id);
      navigator.clipboard.writeText(url.toString());
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full transition-colors duration-300">
        <Toaster />
        <Sidebar collapsible="icon" className="border-r border-border/20 bg-muted/10">
          <SidebarHeader className="p-4 bg-transparent border-b border-border/10 flex flex-col gap-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
             <Button 
              onClick={handleNewChat} 
              className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary shadow-sm border border-primary/20 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
              variant="outline"
              size="default"
             >
                <Plus className="w-5 h-5 shrink-0" />
                <span className="font-medium group-data-[collapsible=icon]:hidden truncate">New Chat</span>
             </Button>

            <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:hidden">
               <h2 className="text-xs font-bold text-muted-foreground/50 uppercase tracking-wider">
                 History
               </h2>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2 pt-2">
            <SidebarMenu>
              {history.map((repo) => (
                <SidebarMenuItem key={repo.id}>
                  <SidebarMenuButton 
                     onClick={() => handleSelectRepo(repo)}
                     className="hover:bg-accent/10 hover:text-accent transition-colors data-[active=true]:bg-accent/20 data-[active=true]:text-accent text-muted-foreground font-medium group-data-[collapsible=icon]:justify-center"
                     tooltip={`${repo.owner}/${repo.name}`}
                  >
                    <span className="truncate">{repo.owner}/{repo.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset className="bg-background transition-all duration-300">
          <main className="flex flex-col h-full relative overflow-hidden">
            <header className="absolute top-4 left-4 z-50 flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            </header>
            
            <div className="absolute top-4 right-4 z-50">
               <ThemeToggle />
            </div>

            <div className="flex-1 overflow-auto w-full relative">
              <AnimatePresence mode="wait">
                {!results && !loading && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ChatInput onAnalysis={handleAnalysis} loading={loading} />
                   </div>
                )}

                {loading && (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full space-y-6"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
                      <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full animate-pulse delay-75" />
                      <Spinner className="w-16 h-16 text-primary relative z-10" />
                    </div>
                    <p className="text-xl text-foreground/80 font-medium tracking-tight animate-pulse">
                      Weaving your code's fable...
                    </p>
                  </motion.div>
                )}

                {results && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="container max-w-[1600px] mx-auto py-8 px-4 pb-12"
                  >
                    <div className="flex justify-between items-center mb-6 pl-10">
                      <h2 className="text-2xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent hidden md:block">
                        Analysis Results
                      </h2>
                      <div className="space-x-2 px-8">
                         <span className="text-sm text-muted-foreground mr-4 font-mono">{results.owner}/{results.name}</span>
                        <Button
                            onClick={handleShare}
                            variant="outline"
                            size="sm"
                            className="text-foreground hover:bg-primary/10 hover:text-primary transition-colors border-primary/20"
                        >
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </Button>
                      </div>
                    </div>
                    <ResultsDisplay data={results} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
          </main>
        </SidebarInset>
        
        <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <AlertDialogContent className="bg-card border-primary/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Share The Fable</AlertDialogTitle>
              <AlertDialogDescription>
                Share this analysis of <span className="text-foreground font-medium">{results?.owner}/{results?.name}</span> with the world.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center space-x-2 pt-4">
              <Input
                value={
                  results
                    ? `${window.location.origin}?repo_id=${results.id}`
                    : ""
                }
                readOnly
                className="bg-muted/50 border-primary/10 focus-visible:ring-primary/20"
              />
              <Button onClick={handleCopyLink} size="sm" className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SidebarProvider>
  );
}

export default App;
