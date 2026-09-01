"use client";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore, type ToastVariant } from "@/lib/toast-store";

const variantStyles: Record<ToastVariant, { icon: typeof CheckCircle2; border: string; iconColor: string }> = {
  success: { icon: CheckCircle2, border: "border-gruvbox-green/50", iconColor: "text-gruvbox-green" },
  error: { icon: XCircle, border: "border-gruvbox-red/50", iconColor: "text-gruvbox-red" },
  info: { icon: Info, border: "border-gruvbox-blue/50", iconColor: "text-gruvbox-blue" },
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
      {toasts.map((toast) => {
        const { icon: Icon, border, iconColor } = variantStyles[toast.variant];
        return (
          <div
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            className={`animate-toast-in pointer-events-auto flex w-full max-w-sm cursor-pointer items-start gap-3 rounded-lg border ${border} bg-gruvbox-surface px-4 py-3 shadow-lg`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gruvbox-text">{toast.message}</p>
              {toast.description && <p className="mt-0.5 text-xs text-gruvbox-gray">{toast.description}</p>}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
              className="shrink-0 text-gruvbox-gray hover:text-gruvbox-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}