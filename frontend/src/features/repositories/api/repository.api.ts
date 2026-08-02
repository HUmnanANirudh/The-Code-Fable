import { api } from "@/services/api";

export const repositoryApi = {
  getRepositories: () => api.repositories.list(),
  getRepository: (id: string) => api.repositories.get(id),
  createRepository: (repo: string) => api.repositories.create(repo),
  analyzeRepository: (repo: string) => api.repositories.create(repo),
  reindexRepository: (repoId: string) => api.repositories.reindex(repoId),
};
