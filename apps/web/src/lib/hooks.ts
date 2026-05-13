import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";
import { useWorkspaceStore } from "../store/workspace.store";

// --- Auth ---
export const useRegister = () =>
  useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post("/api/auth/register", data).then((r) => r.data),
  });

export const useLogin = () =>
  useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post("/api/auth/login", data).then((r) => r.data),
  });

// --- Workspaces ---
export const useWorkspaces = () =>
  useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.get("/api/workspaces").then((r) => r.data),
  });

export const useCreateWorkspace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      api.post("/api/workspaces", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });
};

// --- Links ---
export const useLinks = () => {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspace?.id);
  return useQuery({
    queryKey: ["links", workspaceId],
    queryFn: () =>
      api.get(`/api/links?workspaceId=${workspaceId}`).then((r) => r.data),
    enabled: !!workspaceId, // don't run if no workspace selected
  });
};

export const useCreateLink = () => {
  const qc = useQueryClient();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspace?.id);
  return useMutation({
    mutationFn: (data: {
      originalUrl: string;
      customSlug?: string;
      expiresAt?: string;
    }) =>
      api
        .post("/api/links/shorten", { ...data, workspaceId })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links", workspaceId] }),
  });
};
export const useAnalytics = (slug: string | null) => {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspace?.id);
  return useQuery({
    queryKey: ["analytics", slug, workspaceId],
    queryFn: () =>
      api
        .get(`/api/links/${slug}/analytics?workspaceId=${workspaceId}`)
        .then((r) => r.data),
    enabled: !!slug && !!workspaceId,
  });
};
