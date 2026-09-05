import { ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  danger = true,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="mb-6 text-sm text-booth-ink/70 dark:text-booth-paper/70">{description}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-booth-plum-200 bg-white/40 px-6 py-16 text-center dark:border-white/10 dark:bg-white/5">
      {icon && <div className="mb-4 text-booth-gold-500">{icon}</div>}
      <h3 className="font-display text-lg text-booth-ink dark:text-booth-paper">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-booth-ink/60 dark:text-booth-paper/60">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading your memories..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-booth-ink/50 dark:text-booth-paper/50">
      <Loader2 className="animate-spin" size={24} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "gold" | "rose";
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: "bg-booth-plum-50 text-booth-plum-600 dark:bg-white/10 dark:text-booth-paper/80",
    gold: "bg-booth-gold-300/30 text-booth-gold-500",
    rose: "bg-booth-rose-300/30 text-booth-rose-500",
  };
  return (
    <span className={clsx("rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
