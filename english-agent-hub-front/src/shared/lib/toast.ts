import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/errors";

export function toastError(e: unknown, fallback = "요청을 처리하지 못했습니다.") {
  toast.error(getErrorMessage(e, fallback));
}

export { toast };
