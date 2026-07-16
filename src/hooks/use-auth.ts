"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api-client";
import {
  isAdminRole,
  isTrainerRole,
  portalHomeForRole,
} from "@/lib/auth-cookies";
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

  useEffect(() => {
    if (meQuery.isError) {
      router.replace("/login");
      router.refresh();
    }
  }, [meQuery.isError, router]);

  const logoutMutation = useMutation({
    mutationFn: () => apiPost("/auth/logout"),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["auth"] });
      router.push("/login");
      router.refresh();
    },
  });

  return { meQuery, logoutMutation };
}

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

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
      const from = searchParams.get("from");
      const defaultHome = portalHomeForRole(data.role);
      const isTrainerPortalPath =
        !!from && (from === "/trainer" || from.startsWith("/trainer/"));

      let destination = defaultHome;
      if (from && from.startsWith("/") && !from.startsWith("/login")) {
        if (isTrainerRole(data.role) && isTrainerPortalPath) {
          destination = from;
        } else if (isAdminRole(data.role) && !isTrainerPortalPath) {
          destination = from;
        }
      }

      router.push(destination);
      router.refresh();
    },
  });

  return { loginMutation };
}
