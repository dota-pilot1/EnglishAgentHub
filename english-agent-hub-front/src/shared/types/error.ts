export type ApiErrorResponse = {
  code: string;
  message: string;
  timestamp: string;
  fieldErrors: Record<string, string> | null;
};
