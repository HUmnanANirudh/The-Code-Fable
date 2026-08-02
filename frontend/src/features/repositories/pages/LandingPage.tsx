import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { repositoryApi } from "../api/repository.api";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export function LandingPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const navigate = useNavigate();

  const analyzeMutation = useMutation({
    mutationFn: repositoryApi.createRepository,
    onSuccess: (data) => {
      if (data?.id) {
        navigate({ to: "/repositories/$repoId", params: { repoId: data.id } });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to analyze repository");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;
    
    try {
      const urlParts = new URL(repoUrl);
      const pathParts = urlParts.pathname.split("/").filter(Boolean);
      if (pathParts.length < 2) {
        throw new Error("Invalid GitHub repository URL");
      }
      const [owner, repo] = pathParts;
      analyzeMutation.mutate(`${owner}/${repo}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Invalid repository URL format");
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-32 px-4">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-semibold tracking-tight mb-3">CodePilot</h1>
        <p className="text-[15px] text-muted-foreground max-w-md mx-auto">
          Enter a GitHub repository URL to generate deep architectural insights and interactive dependency graphs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative group">
          <Input
            type="url"
            placeholder="https://github.com/owner/repo"
            className="w-full text-base h-12 pl-4 pr-12 bg-card border-border/50 transition-all hover:border-border focus:ring-1 focus:ring-primary shadow-sm"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={analyzeMutation.isPending}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <Button 
              type="submit" 
              size="icon"
              className="h-8 w-8 rounded-md bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105" 
              disabled={!repoUrl || analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-xs">&rarr;</span>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
