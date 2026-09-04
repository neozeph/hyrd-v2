import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApplicationFormInput, ApplicationListParams } from "./application-api";
import {
  createApplicationRequest,
  deleteApplicationRequest,
  getApplicationRequest,
  getApplicationStatsRequest,
  listApplicationsRequest,
  updateApplicationRequest,
} from "./application-api";

export const applicationQueryKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationQueryKeys.all, "list"] as const,
  list: (params: ApplicationListParams) =>
    [...applicationQueryKeys.lists(), params] as const,
  detail: (id: string) => [...applicationQueryKeys.all, "detail", id] as const,
  recent: () => [...applicationQueryKeys.all, "recent"] as const,
  stats: () => [...applicationQueryKeys.all, "stats"] as const,
};

function useInvalidateApplications() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.recent() }),
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.stats() }),
    ]);
}

export function useApplicationListQuery(
  params: ApplicationListParams,
  enabled: boolean,
) {
  return useQuery({
    enabled,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => listApplicationsRequest(params, signal),
    queryKey: applicationQueryKeys.list(params),
  });
}

export function useRecentApplicationsQuery(enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: ({ signal }) =>
      listApplicationsRequest(
        {
          limit: 4,
          page: 1,
          sortBy: "updatedAt",
          sortOrder: "desc",
        },
        signal,
      ),
    queryKey: applicationQueryKeys.recent(),
  });
}

export function useApplicationStatsQuery(enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: ({ signal }) => getApplicationStatsRequest(signal),
    queryKey: applicationQueryKeys.stats(),
  });
}

export function useApplicationDetailQuery(id: string | null, enabled: boolean) {
  return useQuery({
    enabled: enabled && id !== null,
    queryFn: ({ signal }) => getApplicationRequest(id ?? "", signal),
    queryKey: applicationQueryKeys.detail(id ?? "none"),
  });
}

export function useCreateApplicationMutation() {
  const invalidateApplications = useInvalidateApplications();
  return useMutation({
    mutationFn: createApplicationRequest,
    onSuccess: async () => {
      await invalidateApplications();
    },
  });
}

export function useUpdateApplicationMutation(id: string) {
  const queryClient = useQueryClient();
  const invalidateApplications = useInvalidateApplications();
  return useMutation({
    mutationFn: (input: Partial<ApplicationFormInput>) =>
      updateApplicationRequest({ id, input }),
    onSuccess: async (application) => {
      queryClient.setQueryData(applicationQueryKeys.detail(application.id), application);
      await invalidateApplications();
    },
  });
}

export function useDeleteApplicationMutation(id: string) {
  const queryClient = useQueryClient();
  const invalidateApplications = useInvalidateApplications();
  return useMutation({
    mutationFn: () => deleteApplicationRequest(id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: applicationQueryKeys.detail(id) });
      await invalidateApplications();
    },
  });
}
