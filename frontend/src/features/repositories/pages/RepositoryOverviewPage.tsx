import { useParams } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { Loader2, Sparkles, Bot } from "lucide-react";
import { useRepository } from "../hooks/useRepository";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

export function RepositoryOverviewPage() {
  const { repoId } = useParams({ strict: false }) as { repoId: string };
  const { data: repo, isLoading, error } = useRepository(repoId);

  const intelligence = repo?.intelligence ?? {};

  if (isLoading && !repo) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">Failed to load repository data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{repo.owner}/{repo.name}</h1>
            <Badge variant={repo.last_analyzed ? "default" : "secondary"}>{repo.last_analyzed ? "Analyzed" : "Analyzing"}</Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            {repo.last_analyzed
              ? `Last analyzed ${new Date(repo.last_analyzed).toLocaleString()}`
              : "This repository is still being analyzed. The page refreshes every 3 seconds."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{intelligence.stars ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{intelligence.contributors ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{intelligence.recent_commits ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open PRs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{intelligence.open_prs ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{intelligence.tech_stack?.length ?? "—"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" /> What it is</CardTitle>
            <CardDescription>Repository narrative from the latest analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            {repo.narrative ? (
              <article className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#1f2023] prose-pre:border prose-pre:border-border">
                <ReactMarkdown>{repo.narrative}</ReactMarkdown>
              </article>
            ) : (
              <p className="text-sm text-muted-foreground">No narrative is available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4" /> How it works</CardTitle>
            <CardDescription>Architecture narrative from the latest analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            {repo.how_it_works ? (
              <article className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#1f2023] prose-pre:border prose-pre:border-border">
                <ReactMarkdown>{repo.how_it_works}</ReactMarkdown>
              </article>
            ) : (
              <p className="text-sm text-muted-foreground">No architecture narrative is available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Tech Stack</CardTitle>
          <CardDescription>Languages and frameworks detected in the analysis.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(intelligence.tech_stack || []).length > 0 ? (
            intelligence.tech_stack.map((item: string) => <Badge key={item} variant="secondary">{item}</Badge>)
          ) : (
            <p className="text-sm text-muted-foreground">No stack data captured yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}