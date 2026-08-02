import { useQuery } from "@tanstack/react-query";
import { repositoryApi } from "../api/repository.api";

export function useRepository(repoId: string) {
  return useQuery({
    queryKey: ["repository", repoId],
    queryFn: () => repositoryApi.getRepository(repoId),
    enabled: !!repoId,
    refetchInterval: (query) => (query.state.data?.last_analyzed ? false : 3000),
    refetchOnWindowFocus: false,
  });
}
