import { useParams } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { repositoryApi } from "../api/repository.api";
import { useRepository } from "../hooks/useRepository";

export function RepositorySettingsPage() {
  const { repoId } = useParams({ strict: false }) as { repoId: string };
  const queryClient = useQueryClient();
  const { data: repo, isLoading, error, refetch } = useRepository(repoId);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const reindexMutation = useMutation({
    mutationFn: () => repositoryApi.reindexRepository(repoId),
    onSuccess: async (data) => {
      setStatusMessage(data.message || null);
      toast.success(data.message || "Re-index started");
      await queryClient.invalidateQueries({ queryKey: ["repository", repoId] });
      await refetch();
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "Failed to start re-index");
      setStatusMessage("Failed to start re-index");
    },
  });

  if (isLoading && !repo) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        Failed to load repository settings.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage repository analysis refresh.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Re-index Repository</CardTitle>
          <CardDescription>Trigger a fresh analysis and refresh the stored repository data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => reindexMutation.mutate()} disabled={reindexMutation.isPending}>
              {reindexMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Re-index
            </Button>
            <Badge variant={repo?.last_analyzed ? "default" : "secondary"}>
              {repo?.last_analyzed ? "Ready" : "Analyzing"}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>Repository: {repo?.owner}/{repo?.name}</p>
            <p>Last analyzed: {repo?.last_analyzed ? new Date(repo.last_analyzed).toLocaleString() : "Not analyzed yet"}</p>
            {statusMessage ? <p>{statusMessage}</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
