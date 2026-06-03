"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api-client";
import type { UserProfile } from "@/lib/types/api";

export function useAuth() {
  const router = useRouter();
  const qc = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) throw new Error("Unauthorized");
      const json = await res.json();
      return json.data as UserProfile;
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (payload: { identifier: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? "Login gagal");
      return json.data as UserProfile;
    },
    onSuccess: (data) => {
      qc.setQueryData(["auth", "me"], data);
      router.push("/");
      router.refresh();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiPost("/auth/logout"),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["auth"] });
      router.push("/login");
      router.refresh();
    },
  });

  return { meQuery, loginMutation, logoutMutation };
}
