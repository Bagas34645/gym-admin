import type { ApiErrorBody, ApiSuccess, PaginationMeta } from "@/lib/types/api";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorCode?: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export type Unwrapped<T> = { data: T; meta?: PaginationMeta; message: string };

export function unwrapApi<T>(body: ApiSuccess<T> | ApiErrorBody): Unwrapped<T> {
  if (!body.success) {
    const err = body as ApiErrorBody;
    throw new ApiClientError(
      err.message,
      400,
      err.error_code,
      err.errors,
    );
  }
  return {
    data: body.data,
    meta: body.meta,
    message: body.message,
  };
}

export async function parseApiResponse<T>(res: Response): Promise<Unwrapped<T>> {
  const body = (await res.json()) as ApiSuccess<T> | ApiErrorBody;
  if (!body.success) {
    const err = body as ApiErrorBody;
    throw new ApiClientError(
      err.message,
      res.status,
      err.error_code,
      err.errors,
    );
  }
  return {
    data: body.data,
    meta: body.meta,
    message: body.message,
  };
}
