import { useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useRepository } from "../../repositories/hooks/useRepository";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ArchitecturePage() {
  const { repoId } = useParams({ strict: false }) as { repoId: string };
  const { data: repo, isLoading, error } = useRepository(repoId);
  const modules = repo?.modules?.nodes ?? [];
  const moduleEdges = repo?.modules?.edges ?? [];

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
        Failed to load architecture data.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Architecture</h1>
        <p className="text-muted-foreground">Module summary from the latest analysis. Diagrams are intentionally removed here.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Modules</CardDescription>
            <CardTitle className="text-3xl">{modules.length || "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Relationships</CardDescription>
            <CardTitle className="text-3xl">{moduleEdges.length || "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle className="text-3xl">{repo?.last_analyzed ? "Ready" : "Analyzing"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module List</CardTitle>
          <CardDescription>Grouped modules and their fan-in / fan-out data.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {modules.length > 0 ? (
            modules.map((module: any) => (
              <div key={module.id} className="rounded-lg border border-border bg-card/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{module.data?.label ?? module.id}</div>
                    <div className="text-xs text-muted-foreground">{module.data?.files ?? 0} files</div>
                  </div>
                  <Badge variant="outline">{module.data?.layer ?? "module"}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div>In {module.data?.fan_in ?? 0}</div>
                  <div>Out {module.data?.fan_out ?? 0}</div>
                  <div>Cen {module.data?.centrality ?? 0}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No module summary is available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
