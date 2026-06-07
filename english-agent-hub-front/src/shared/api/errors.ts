import { isAxiosError } from "./axios";
import type { ApiErrorResponse } from "@/shared/types/error";

export function getApiError(e: unknown): ApiErrorResponse | null {
  if (!isAxiosError<ApiErrorResponse>(e)) return null;
  return e.response?.data ?? null;
}

export function getFieldErrors(e: unknown): Record<string, string> {
  return getApiError(e)?.fieldErrors ?? {};
}

export function getErrorMessage(e: unknown, fallback = "요청을 처리하지 못했습니다."): string {
  return getApiError(e)?.message ?? fallback;
}
