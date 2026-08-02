import { useParams } from "@tanstack/react-router";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRepository } from "../../repositories/hooks/useRepository";
import GraphDisplay from "@/components/GraphDisplay";

export function DependencyGraphPage() {
  // @ts-ignore
  const { repoId } = useParams({ strict: false }) as { repoId: string };
  const { data: repo, isLoading, error } = useRepository(repoId);
  const graphData = repo?.graph ?? { nodes: [], links: [] };

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
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Dependency Insights</h1>
        <p className="text-muted-foreground">File-level dependency relationships from the stored analysis.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{repo?.owner}/{repo?.name}</CardTitle>
          <CardDescription>
            {repo?.last_analyzed ? `Last analyzed ${new Date(repo.last_analyzed).toLocaleString()}` : "Analysis is still running."}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[72vh] min-h-[560px]">
          {graphData.nodes?.length > 0 ? (
            <GraphDisplay graphData={graphData} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-card/40 text-sm text-muted-foreground">
              No dependency graph is available yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
