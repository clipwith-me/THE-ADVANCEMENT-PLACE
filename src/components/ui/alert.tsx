import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "danger";

const tones: Record<Tone, { box: string; icon: typeof Info }> = {
  info: { box: "border-info-700/20 bg-info-50 text-info-700", icon: Info },
  success: { box: "border-success-700/20 bg-success-50 text-success-700", icon: CheckCircle2 },
  warning: { box: "border-warning-700/25 bg-warning-50 text-warning-700", icon: AlertTriangle },
  danger: { box: "border-danger-700/20 bg-danger-50 text-danger-700", icon: XCircle },
};

export function Alert({
  tone = "info",
  title,
  children,
  className = "",
  live,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
  /** Announce to screen readers when it appears (form feedback). */
  live?: boolean;
}) {
  const { box, icon: Icon } = tones[tone];
  return (
    <div
      className={`flex gap-3 rounded-md border px-4 py-3 text-sm ${box} ${className}`}
      role={live ? (tone === "danger" ? "alert" : "status") : undefined}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-ink-800 [&_a]:font-semibold [&_a]:underline">{children}</div>}
      </div>
    </div>
  );
}
