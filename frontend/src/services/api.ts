import { fetcher } from "@/lib/api-client";

export interface RepositoryRecord {
  id: string;
  owner: string;
  name: string;
  last_analyzed: string | null;
  graph?: { nodes?: any[]; links?: any[] } | null;
  modules?: { nodes?: any[]; edges?: any[] } | null;
  tree_viewer?: Record<string, any> | null;
  how_it_works?: string | null;
  narrative?: string | null;
  intelligence?: {
    stars?: number;
    contributors?: number;
    recent_commits?: number;
    open_prs?: number;
    merged_prs?: number;
    total_prs?: number;
    tech_stack?: string[];
    repo_name?: string;
  } | null;
  metrics?: Record<string, any> | null;
  clusters?: Record<string, string[]> | null;
  rebuild_prompt?: Record<string, any> | null;
}

export const api = {
  repositories: {
    list: () => fetcher<RepositoryRecord[]>("/repositories"),
    get: (repoId: string) => fetcher<RepositoryRecord>(`/repositories/${repoId}`),
    create: (repo: string) => fetcher<RepositoryRecord>("/repositories", {
      method: "POST",
      body: JSON.stringify({ repo }),
    }),
    reindex: (repoId: string) => fetcher<{ message: string }>(`/repositories/${repoId}/reindex`, {
      method: "POST",
    }),
  },
  analytics: {
    health: (repoId: string) => fetcher<any>(`/analytics/${repoId}/health`),
    architecture: (repoId: string) => fetcher<any>(`/analytics/${repoId}/architecture`),
    deadCode: (repoId: string) => fetcher<any>(`/analytics/${repoId}/dead-code`),
  },
  generate: {
    onboarding: (repoId: string) => fetcher<any>(`/generate/onboarding/${repoId}`, { method: "POST" }),
    architecture: (repoId: string) => fetcher<any>(`/generate/architecture/${repoId}`, { method: "POST" }),
    guidedTour: (repoId: string) => fetcher<any>(`/generate/guided-tour/${repoId}`, { method: "POST" }),
  },
  search: {
    semantic: (repoId: string, query: string) => fetcher<any>("/search", {
      method: "POST",
      body: JSON.stringify({ repo_id: repoId, query }),
    }),
  },
};