import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
  const { data, isLoading, error } = useQuery({
    queryKey: ["health", repoId],
    queryFn: () => api.analytics.health(repoId),
    enabled: !!repoId,
  });

  const health = data?.health;

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

  const fanMetrics = health?.module_metrics || [];
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
            <CardTitle>Fan-In / Fan-Out Distribution</CardTitle>
            <CardDescription>Most connected modules in the analysis graph.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[360px] w-full">
              {fanMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fanMetrics.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tickMargin={10} interval={0} angle={-15} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="fan_in" name="Fan In" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="fan_out" name="Fan Out" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                  Module relationship data is not available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Modules</CardTitle>
          <CardDescription>Sorted by combined fan-in and fan-out.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {fanMetrics.length > 0 ? (
            fanMetrics.slice(0, 6).map((module: any) => (
              <div key={module.id} className="rounded-lg border border-border bg-card/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{module.label}</div>
                    <div className="text-xs text-muted-foreground">{module.files} files</div>
                  </div>
                  <Badge variant="outline">{module.centrality}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div>In {module.fan_in}</div>
                  <div>Out {module.fan_out}</div>
                  <div>Files {module.files}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No module metrics are available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
