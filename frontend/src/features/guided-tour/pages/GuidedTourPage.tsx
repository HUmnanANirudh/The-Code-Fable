import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api } from "@/services/api";
import { useRepository } from "../../repositories/hooks/useRepository";

export function GuidedTourPage() {
  const { repoId } = useParams({ strict: false }) as { repoId: string };
  const { data: repo } = useRepository(repoId);

  const { data, isLoading } = useQuery({
    queryKey: ['guided-tour', repoId],
    queryFn: () => api.generate.guidedTour(repoId),
    enabled: !!repo?.last_analyzed,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Guided Tour</h1>
        <p className="text-muted-foreground">Interactive step-by-step repository walkthrough.</p>
      </div>

      <div className="space-y-4">
        {!repo?.last_analyzed ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            This repository is still being analyzed. Guided tour will appear after analysis completes.
          </div>
        ) : null}
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : repo?.last_analyzed ? (
          <div className="p-6 border border-border rounded-lg bg-card linear-card">
            <article className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#1f2023] prose-pre:border prose-pre:border-border">
              <ReactMarkdown>
                {data?.markdown || "Could not generate tour."}
              </ReactMarkdown>
            </article>
          </div>
        ) : null}
      </div>
    </div>
  );
}
