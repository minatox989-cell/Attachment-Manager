import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { WorkerFilters } from "@shared/schema";

export function useWorkers(filters?: WorkerFilters) {
  const queryKey = [api.workers.list.path, filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Build query string manually or via URLSearchParams since buildUrl is for path params
      const params = new URLSearchParams();
      if (filters?.pincode) params.append("pincode", filters.pincode);
      if (filters?.workerType) params.append("workerType", filters.workerType);
      
      const url = `${api.workers.list.path}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workers");
      return await res.json();
    },
  });
}

export function useWorker(id: number) {
  return useQuery({
    queryKey: [api.workers.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.workers.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch worker details");
      return await res.json();
    },
    enabled: !!id,
  });
}

export function useToggleAvailability() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ isAvailable }: { isAvailable: boolean }) => {
      const res = await fetch(api.workers.toggleAvailability.path, {
        method: api.workers.toggleAvailability.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update availability");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: "Status Updated", description: "Your availability has been changed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update status", variant: "destructive" });
    },
  });
}
