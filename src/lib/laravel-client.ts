import axios, { type AxiosRequestConfig, type Method } from "axios";
import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth-cookies";
import type { ApiErrorBody, ApiSuccess } from "@/lib/types/api";

const API_URL = process.env.API_URL ?? "http://localhost:8000/v1";

export const laravel = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

async function getTokens() {
  const jar = await cookies();
  return {
    access: jar.get(ACCESS_TOKEN_COOKIE)?.value,
    refresh: jar.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}

async function setTokens(access: string, refresh: string) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(ACCESS_TOKEN_COOKIE, access, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  jar.set(REFRESH_TOKEN_COOKIE, refresh, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearTokens() {
  const jar = await cookies();
  jar.delete(ACCESS_TOKEN_COOKIE);
  jar.delete(REFRESH_TOKEN_COOKIE);
}

async function refreshAccessToken(refresh: string): Promise<boolean> {
  try {
    const { data } = await axios.post<ApiSuccess<{
      access_token: string;
      refresh_token: string;
    }>>(`${API_URL}/auth/refresh`, { refresh_token: refresh });
    if (data.success && data.data) {
      await setTokens(data.data.access_token, data.data.refresh_token);
      return true;
    }
  } catch {
    await clearTokens();
  }
  return false;
}

export async function laravelRequest<T>(
  method: Method,
  path: string,
  options?: {
    data?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string>;
    retry?: boolean;
  },
): Promise<{ data: T; meta?: ApiSuccess<T>["meta"]; message: string; status: number }> {
  const tokens = await getTokens();
  const config: AxiosRequestConfig = {
    method,
    url: path.startsWith("/") ? path : `/${path}`,
    data: options?.data,
    params: options?.params,
    headers: {
      ...options?.headers,
      ...(tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
    },
  };

  try {
    const res = await laravel.request<ApiSuccess<T> | ApiErrorBody>(config);
    const body = res.data;
    if (!body.success) {
      const err = body as ApiErrorBody;
      throw Object.assign(new Error(err.message), {
        status: res.status,
        errorCode: err.error_code,
        errors: err.errors,
      });
    }
    return {
      data: body.data as T,
      meta: body.meta,
      message: body.message,
      status: res.status,
    };
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      tokens.refresh &&
      options?.retry !== false
    ) {
      const ok = await refreshAccessToken(tokens.refresh);
      if (ok) {
        return laravelRequest<T>(method, path, { ...options, retry: false });
      }
    }
    if (axios.isAxiosError(error) && error.response?.data) {
      const body = error.response.data as ApiErrorBody;
      throw Object.assign(new Error(body.message ?? "Request gagal"), {
        status: error.response.status,
        errorCode: body.error_code,
        errors: body.errors,
      });
    }
    throw error;
  }
}

export async function laravelMultipart<T>(
  path: string,
  formData: FormData,
): Promise<{ data: T; message: string }> {
  const tokens = await getTokens();
  const res = await fetch(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
    },
    body: formData,
  });
  const body = (await res.json()) as ApiSuccess<T> | ApiErrorBody;
  if (!body.success) {
    throw Object.assign(new Error(body.message), { status: res.status, errors: body.errors });
  }
  return { data: body.data as T, message: body.message };
}

export { setTokens, getTokens };
