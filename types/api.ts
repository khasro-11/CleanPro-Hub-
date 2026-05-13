export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: { code: string; message: string; details?: unknown } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function apiError(code: string, message: string, details?: unknown): ApiError {
  return { ok: false, error: { code, message, details } };
}
