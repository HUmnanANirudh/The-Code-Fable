import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronRight, FileText, Folder, Loader2, BookOpen, Map, Network, Search, Skull, Sparkles, Bot, Layers3 } from "lucide-react";
import { useRepository } from "../hooks/useRepository";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Separator } from "../../../components/ui/separator";
import ArchitectureFlow from "../../../components/ArchitectureFlow";

type TreeValue = Record<string, TreeValue | null> | null | undefined;

function TreeNode({ name, value, depth = 0 }: { name: string; value: TreeValue; depth?: number }) {
  const isBranch = !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
  const [open, setOpen] = useState(depth < 1);

  if (!isBranch) {
    return (
      <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground" style={{ paddingLeft: depth * 16 }}>
        <FileText className="h-4 w-4 shrink-0" />
        <span className="truncate">{name}</span>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm font-medium transition-colors hover:bg-accent/20"
        style={{ paddingLeft: depth * 16 }}
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        <Folder className="h-4 w-4 shrink-0 text-amber-400" />
        <span className="truncate">{name}</span>
      </button>
      {open ? (
        <div className="space-y-0.5">
          {Object.entries(value).map(([childName, childValue]) => (
            <TreeNode key={`${depth}-${childName}`} name={childName} value={childValue} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function RepositoryOverviewPage() {
  const { repoId } = useParams({ strict: false }) as { repoId: string };
  const { data: repo, isLoading, error } = useRepository(repoId);

  const intelligence = repo?.intelligence ?? {};
  const modules = repo?.modules?.nodes ?? [];
  const treeViewer = repo?.tree_viewer ?? {};
  const isAnalyzing = !!repo && !repo.last_analyzed;

  if (isLoading && !repo) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
    <div className="max-w-7xl mx-auto space-y-8">
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

        <div className="flex flex-wrap gap-2">
          <Link to="/repositories/$repoId/search" params={{ repoId }} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30">
            <Search className="h-4 w-4" /> Search
          </Link>
          <Link to="/repositories/$repoId/architecture" params={{ repoId }} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30">
            <Network className="h-4 w-4" /> Architecture
          </Link>
          <Link to="/repositories/$repoId/dead-code" params={{ repoId }} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30">
            <Skull className="h-4 w-4" /> Dead Code
          </Link>
          <Link to="/repositories/$repoId/guided-tour" params={{ repoId }} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30">
            <Map className="h-4 w-4" /> Guided Tour
          </Link>
          <Link to="/repositories/$repoId/onboarding" params={{ repoId }} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent/30">
            <BookOpen className="h-4 w-4" /> Onboarding
          </Link>
        </div>
      </div>

      {isAnalyzing ? (
        <Card className="border-dashed bg-card/60">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background/60">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Analyzing repository</h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                CodePilot is building the dependency graph, module map, file tree, and narrative summaries.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {repo.last_analyzed ? (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Stars</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{intelligence.stars ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Contributors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{intelligence.contributors ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Commits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{intelligence.recent_commits ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Open PRs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{intelligence.open_prs ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tech Stack</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{intelligence.tech_stack?.length ?? 0}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" /> What it is</CardTitle>
                  <CardDescription>AI-generated narrative summary of the repository.</CardDescription>
                </CardHeader>
                <CardContent>
                  <article className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#1f2023] prose-pre:border prose-pre:border-border">
                    <ReactMarkdown>{repo.narrative || "Analysis is still generating the narrative."}</ReactMarkdown>
                  </article>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4" /> How it works</CardTitle>
                  <CardDescription>Architecture narrative and execution flow.</CardDescription>
                </CardHeader>
                <CardContent>
                  <article className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#1f2023] prose-pre:border prose-pre:border-border">
                    <ReactMarkdown>{repo.how_it_works || "Analysis is still generating the architecture narrative."}</ReactMarkdown>
                  </article>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Layers3 className="h-4 w-4" /> Modules diagram</CardTitle>
                <CardDescription>Import-derived module groups and fan-in / fan-out relationships.</CardDescription>
              </CardHeader>
              <CardContent className="h-[620px]">
                {modules.length > 0 ? (
                  <ArchitectureFlow data={repo.modules!} />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No module diagram was generated yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
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

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-base">File Tree</CardTitle>
                <CardDescription>Collapsible directory view from the stored analysis.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[520px] rounded-lg border border-border bg-background/40 p-3">
                  <div className="space-y-0.5">
                    {Object.entries(treeViewer).length > 0 ? (
                      Object.entries(treeViewer).map(([name, value]) => (
                        <TreeNode key={name} name={name} value={value as TreeValue} />
                      ))
                    ) : (
                      <p className="p-3 text-sm text-muted-foreground">No file tree was captured yet.</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <Separator />
    </div>
  );
}
