import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ResultsDisplay from "./components/ResultsDisplay";
import { Spinner } from "./components/ui/spinner";
import type { AnalysisResult } from "./types";
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
import { Copy, Share2 } from "lucide-react";
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
} from "./components/ui/sidebar";

const API_URL = "http://localhost:8000/api/v1";

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [searchParams] = useSearchParams();

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
            setHistory((prev) => [resultsData, ...prev]);
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
        setResults(analyzeData.repo);
        setHistory((prev) => [analyzeData.repo, ...prev]);
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

  const handleSelectRepo = (repo: AnalysisResult) => {
    setResults(repo);
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleCopyLink = () => {
    if (results) {
      const url = new URL(window.location.href);
      url.searchParams.set("repo_id", results.id);
      navigator.clipboard.writeText(url.toString());
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Toaster />
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-lg font-semibold">Analysis History</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {history.map((repo) => (
                <SidebarMenuItem key={repo.id}>
                  <SidebarMenuButton onClick={() => handleSelectRepo(repo)}>
                    {repo.owner}/{repo.name}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <main className="flex flex-col h-full">
            <div className="flex-1 p-4 overflow-auto">
              {!results && !loading && (
                <div className="flex flex-col items-center justify-center h-full">
                  <h1 className="text-2xl font-semibold">The Code Fable</h1>
                  <p className="text-muted-foreground">
                    Enter a GitHub repository URL to generate its fable.
                  </p>
                </div>
              )}
              {loading && (
                <div className="flex flex-col items-center justify-center h-full">
                  <Spinner />
                  <p className="mt-2">
                    Analyzing... Thinking... Digesting the repo...
                  </p>
                </div>
              )}
              {results && (
                <>
                  <Button
                    onClick={handleShare}
                    className="absolute top-4 right-4"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <ResultsDisplay data={results} />
                </>
              )}
            </div>
            <ChatInput onAnalysis={handleAnalysis} loading={loading} />
          </main>
        </SidebarInset>
        <AlertDialog key={results?.id} open={showShareDialog} onOpenChange={setShowShareDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Share Analysis</AlertDialogTitle>
              <AlertDialogDescription>
                Share this analysis of {results?.owner}/{results?.name} with others via a link.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center space-x-2">
              <Input
                value={
                  results
                    ? `${window.location.origin}?repo_id=${results.id}`
                    : ""
                }
                readOnly
              />
              <Button onClick={handleCopyLink} size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SidebarProvider>
  );
}

export default App;
