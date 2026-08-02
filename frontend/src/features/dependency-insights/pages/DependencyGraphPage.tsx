import { useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useRepository } from "../../repositories/hooks/useRepository";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DependencyGraphPage() {
  const { repoId } = useParams({ strict: false }) as { repoId: string };
  const { data: repo, isLoading, error } = useRepository(repoId);

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
        Failed to load dependency graph.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Dependencies</h1>
        <p className="text-muted-foreground">Text summary of stored dependency analysis. Visual graphs are removed.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{repo?.owner}/{repo?.name}</CardTitle>
          <CardDescription>
            {repo?.last_analyzed ? `Last analyzed ${new Date(repo.last_analyzed).toLocaleString()}` : "Analysis is still running."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card/60 p-4">
            <div className="text-sm text-muted-foreground">File graph</div>
            <div className="mt-1 text-2xl font-semibold">{repo?.graph?.nodes?.length ?? "—"}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/60 p-4">
            <div className="text-sm text-muted-foreground">Links</div>
            <div className="mt-1 text-2xl font-semibold">{repo?.graph?.links?.length ?? "—"}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/60 p-4">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="mt-1 text-2xl font-semibold">{repo?.last_analyzed ? "Ready" : "Analyzing"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dependency summary</CardTitle>
          <CardDescription>Existing repo data only, no rendered diagram.</CardDescription>
        </CardHeader>
        <CardContent>
          {repo?.graph?.nodes?.length ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Nodes: {repo.graph.nodes.length}</Badge>
              <Badge variant="secondary">Links: {repo.graph.links?.length ?? 0}</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No dependency graph data is available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
