import { useState } from "react";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import ResultsDisplay from "./components/ResultsDisplay";
import { Spinner } from "./components/ui/spinner";

const API_URL = "http://localhost:8000";

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);

  const handleAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const urlParts = new URL(repoUrl);
      const pathParts = urlParts.pathname.split("/").filter(Boolean);
      if (pathParts.length < 2) {
        throw new Error("Invalid GitHub repository URL");
      }
      const [owner, repo] = pathParts;

      const analyzeResponse = await fetch(
        `${API_URL}/api/analyze?repo=${owner}/${repo}`
      );
      if (!analyzeResponse.ok) {
        throw new Error("Failed to start analysis");
      }
      const analyzeData = await analyzeResponse.json();
      setJobId(analyzeData.job_id);

      // Poll for status
      const pollStatus = async () => {
        const statusResponse = await fetch(
          `${API_URL}/api/status/${analyzeData.job_id}`
        );
        if (!statusResponse.ok) {
          throw new Error("Failed to get job status");
        }
        const statusData = await statusResponse.json();

        if (statusData.status === "SUCCESS") {
          const resultsResponse = await fetch(
            `${API_URL}/api/results/${analyzeData.job_id}`
          );
          if (!resultsResponse.ok) {
            throw new Error("Failed to get results");
          }
          const resultsData = await resultsResponse.json();
          setResults(resultsData);
          setLoading(false);
        } else if (statusData.status === "FAILURE") {
          throw new Error("Analysis job failed");
        } else {
          setTimeout(pollStatus, 2000);
        }
      };

      setTimeout(pollStatus, 2000);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle>The Code Fable</CardTitle>
          <CardDescription>
            Enter a GitHub repository URL to generate its fable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="repoUrl">Repository URL</Label>
              <Input
                id="repoUrl"
                placeholder="https://github.com/vercel/next.js"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAnalysis} className="w-full" disabled={loading}>
            {loading ? <Spinner /> : "Analyze"}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Card className="w-[450px] mt-4 bg-destructive text-destructive-foreground">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {results && <ResultsDisplay data={results} />}
    </div>
  );
}

export default App;
