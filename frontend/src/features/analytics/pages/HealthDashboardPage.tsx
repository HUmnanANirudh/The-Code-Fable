import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRepository } from "../../repositories/hooks/useRepository";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
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
  const { data: repo } = useRepository(repoId);
  const { data, isLoading, error } = useQuery({
    queryKey: ["health", repoId],
    queryFn: () => api.analytics.health(repoId),
    enabled: !!repoId && !!repo?.last_analyzed,
    refetchInterval: (query) => (query.state.data ? false : 3000),
  });

  const health = data?.health;
  const dependencyMetrics = health?.dependency_metrics;

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

  const fanMetrics = dependencyMetrics?.top_files || [];
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
            <CardTitle>Language Distribution</CardTitle>
            <CardDescription>Byte counts returned from the GitHub languages API.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[360px] w-full">
              {languageMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={languageMetrics}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="language" tickMargin={10} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bytes" name="Bytes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                  Language data is not available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Connected Files</CardTitle>
            <CardDescription>Files with the highest incoming and outgoing dependency counts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[360px] w-full">
              {fanMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fanMetrics.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="id" tickMargin={10} interval={0} angle={-15} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="in_degree" name="Incoming" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="out_degree" name="Outgoing" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                  Dependency data is not available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Dependencies</CardTitle>
          <CardDescription>Files with the highest total dependency degree.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {fanMetrics.length > 0 ? (
            fanMetrics.slice(0, 6).map((module: any) => (
              <div key={module.id} className="rounded-lg border border-border bg-card/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium break-all">{module.id}</div>
                    <div className="text-xs text-muted-foreground">{module.group}</div>
                  </div>
                  <Badge variant="outline">{module.degree}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div>In {module.in_degree}</div>
                  <div>Out {module.out_degree}</div>
                  <div>Degree {module.degree}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No dependency metrics are available yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dependency List</CardTitle>
          <CardDescription>All file-to-file dependencies extracted from the analysis graph.</CardDescription>
        </CardHeader>
        <CardContent>
          {dependencyMetrics?.dependencies?.length ? (
            <div className="max-h-[420px] overflow-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background/95 text-left">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {dependencyMetrics.dependencies.map((edge: any, index: number) => (
                    <tr key={`${edge.source}-${edge.target}-${index}`} className="border-b border-border/60 last:border-b-0">
                      <td className="px-4 py-2 break-all text-muted-foreground">{edge.source}</td>
                      <td className="px-4 py-2 break-all">{edge.target}</td>
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
