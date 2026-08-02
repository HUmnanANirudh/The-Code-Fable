import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRepository } from "../../repositories/hooks/useRepository";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";

export function DependencyGraphPage() {
  const { repoId } = useParams({ strict: false }) as { repoId: string };
  const { data: repo, isLoading, error } = useRepository(repoId);
  const { data: health } = useQuery({
    queryKey: ["health", repoId],
    queryFn: () => api.analytics.health(repoId),
    enabled: !!repoId && !!repo?.last_analyzed,
  });
  const workspaceDependencies = health?.health?.workspace_dependencies;

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
        <p className="text-muted-foreground">All file-to-file dependencies extracted from the stored analysis graph.</p>
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
          <CardTitle>Project Dependencies</CardTitle>
          <CardDescription>Installed backend and frontend packages in this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-sm font-medium">Backend</div>
              <div className="flex flex-wrap gap-2">
                {workspaceDependencies?.backend?.length ? (
                  workspaceDependencies.backend.map((dependency: any) => (
                    <Badge key={dependency.display} variant="secondary">
                      {dependency.display}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No backend dependency list available.</p>
                )}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Frontend</div>
              <div className="flex flex-wrap gap-2">
                {workspaceDependencies?.frontend?.length ? (
                  workspaceDependencies.frontend.map((dependency: any) => (
                    <Badge key={dependency.display} variant="secondary">
                      {dependency.display}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No frontend dependency list available.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dependency List</CardTitle>
          <CardDescription>Every edge in the file graph, in plain text.</CardDescription>
        </CardHeader>
        <CardContent>
          {repo?.graph?.links?.length ? (
            <div className="max-h-[520px] overflow-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background/95 text-left">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {repo.graph.links.map((link: any, index: number) => (
                    <tr key={`${link.source}-${link.target}-${index}`} className="border-b border-border/60 last:border-b-0">
                      <td className="px-4 py-2 break-all text-muted-foreground">{link.source}</td>
                      <td className="px-4 py-2 break-all">{link.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No dependencies were captured yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
