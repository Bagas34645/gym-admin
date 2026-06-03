import { parseApiResponse, ApiClientError } from "@/lib/api-envelope";
import type { PaginationMeta } from "@/lib/types/api";

type QueryValue = string | number | boolean | undefined | null;

function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { params?: Record<string, QueryValue> },
): Promise<{ data: T; meta?: PaginationMeta; message: string }> {
  const { params, ...rest } = init ?? {};
  const url = `/api${path}${buildQuery(params)}`;
  const res = await fetch(url, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(rest.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...rest.headers,
    },
    credentials: "include",
  });
  return parseApiResponse<T>(res);
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, QueryValue>,
) {
  return apiFetch<T>(path, { method: "GET", params });
}

export async function apiPost<T>(path: string, body?: unknown) {
  return apiFetch<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T>(path: string, body?: unknown) {
  return apiFetch<T>(path, {
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(path: string) {
  return apiFetch<T>(path, { method: "DELETE" });
}

export async function apiUpload<T>(path: string, formData: FormData) {
  return apiFetch<T>(path, { method: "POST", body: formData });
}

export { ApiClientError };
