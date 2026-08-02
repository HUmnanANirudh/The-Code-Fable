import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api } from "@/services/api";
import { useRepository } from "../../repositories/hooks/useRepository";

export function OnboardingDocsPage() {
  const { repoId } = useParams({ strict: false }) as { repoId: string };
  const { data: repo } = useRepository(repoId);

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding', repoId],
    queryFn: () => api.generate.onboarding(repoId),
    enabled: !!repo?.last_analyzed,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Onboarding Documentation</h1>
        <p className="text-muted-foreground">Generated developer onboarding guides.</p>
      </div>

      <div className="linear-card p-8 min-h-[400px]">
        {!repo?.last_analyzed ? (
          <div className="mb-4 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            This repository is still being analyzed. Onboarding docs will appear after analysis completes.
          </div>
        ) : null}
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : repo?.last_analyzed ? (
          <article className="prose prose-invert max-w-none prose-pre:bg-[#1f2023] prose-pre:border prose-pre:border-border">
            <ReactMarkdown>
              {data?.markdown || "Could not generate onboarding documentation."}
            </ReactMarkdown>
          </article>
        ) : null}
      </div>
    </div>
  );
}
