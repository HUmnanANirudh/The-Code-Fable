import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRepository } from "../../repositories/hooks/useRepository";
import { api } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


export function HealthDashboardPage() {
  const { repoId } = useParams({ strict: false }) as { repoId: string };
  const { data: repo, isLoading: isRepoLoading } = useRepository(repoId);
  const { data, isLoading, error } = useQuery({
    queryKey: ["health", repoId],
    queryFn: () => api.analytics.health(repoId),
    enabled: !!repoId && !!repo?.last_analyzed,
    refetchInterval: (query) => (query.state.data ? false : 3000),
  });

  const health = data?.health;
  const workspaceDependencies = health?.workspace_dependencies;
  const codeSplitting = health?.code_splitting;

  if (isRepoLoading && !repo) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        Failed to load health dashboard.
      </div>
    );
  }

  const languageMetrics = health?.language_distribution || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Repository Health</h1>
        <p className="text-muted-foreground">Real metrics from the stored repository analysis and GitHub language data.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Files</CardDescription>
            <CardTitle className="text-3xl">{health?.file_count ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Modules</CardDescription>
            <CardTitle className="text-3xl">{health?.module_count ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tech Stack</CardDescription>
            <CardTitle className="text-3xl">{health?.tech_stack?.length ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {health?.tech_stack?.length ? (
          health.tech_stack.map((language: string) => (
            <Badge key={language} variant="secondary">
              {language}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No tech stack data yet.</p>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Dependencies</CardTitle>
            <CardDescription>Installed backend and frontend packages in this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Code Split Quality</CardTitle>
            <CardDescription>How concentrated the dependency graph is across top-level folders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-card/60 p-4">
                <div className="text-xs text-muted-foreground">Score</div>
                <div className="mt-1 text-3xl font-semibold">{codeSplitting?.score ?? "—"}</div>
              </div>
              <div className="rounded-lg border border-border bg-card/60 p-4">
                <div className="text-xs text-muted-foreground">Verdict</div>
                <div className="mt-1 text-2xl font-semibold">{codeSplitting?.verdict ?? "—"}</div>
              </div>
              <div className="rounded-lg border border-border bg-card/60 p-4">
                <div className="text-xs text-muted-foreground">Cross-boundary</div>
                <div className="mt-1 text-2xl font-semibold">{codeSplitting?.cross_boundary_edges ?? "—"}</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Cross-boundary ratio: {codeSplitting?.cross_boundary_ratio ?? "—"}</p>
              <p>Concentration ratio: {codeSplitting?.concentration_ratio ?? "—"}</p>
              <p>
                Top groups: {codeSplitting?.top_level_groups?.length
                  ? codeSplitting.top_level_groups.map(([group, count]: [string, number]) => `${group} (${count})`).join(", ")
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Language Distribution</CardTitle>
          <CardDescription>Byte counts returned from the GitHub languages API.</CardDescription>
        </CardHeader>
        <CardContent>
          {languageMetrics.length > 0 ? (
            <div className="space-y-2">
              {languageMetrics.map((language: any) => (
                <div key={language.language} className="rounded-lg border border-border bg-card/60 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-medium">{language.language}</div>
                    <Badge variant="secondary">{language.bytes} bytes</Badge>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(4, Math.min(100, language.share || 0))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Language data is not available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
