import {
  Archive,
  BadgeCheck,
  CalendarClock,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleSlash,
  Clock,
  FileEdit,
  Inbox,
  Loader,
  Lock,
  MessageSquare,
  Star,
  Undo2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  APPLICATION_STATUS_LABEL,
  ENQUIRY_STATUS_LABEL,
  JOB_STATUS_LABEL,
  type ApplicationStatusValue,
  type EnquiryStatusValue,
  type JobStatusValue,
} from "@/lib/domain/labels";

// Every status pairs colour with an icon AND text — never colour alone.
type Style = { cls: string; icon: LucideIcon };

const neutral = "bg-ink-100 text-ink-700 ring-ink-300";
const brand = "bg-brand-50 text-brand-800 ring-brand-200";
const good = "bg-success-50 text-success-700 ring-success-700/20";
const warn = "bg-warning-50 text-warning-700 ring-warning-700/20";
const bad = "bg-danger-50 text-danger-700 ring-danger-700/20";
const info = "bg-info-50 text-info-700 ring-info-700/20";

const application: Record<ApplicationStatusValue, Style> = {
  SUBMITTED: { cls: info, icon: Inbox },
  UNDER_REVIEW: { cls: warn, icon: Loader },
  SHORTLISTED: { cls: brand, icon: Star },
  INTERVIEW: { cls: brand, icon: MessageSquare },
  SUCCESSFUL: { cls: good, icon: BadgeCheck },
  UNSUCCESSFUL: { cls: neutral, icon: CircleSlash },
  WITHDRAWN: { cls: neutral, icon: Undo2 },
};

const job: Record<JobStatusValue, Style> = {
  DRAFT: { cls: neutral, icon: FileEdit },
  PUBLISHED: { cls: good, icon: CircleCheck },
  CLOSED: { cls: warn, icon: Lock },
  ARCHIVED: { cls: neutral, icon: Archive },
};

const enquiry: Record<EnquiryStatusValue, Style> = {
  NEW: { cls: info, icon: CircleDot },
  IN_PROGRESS: { cls: warn, icon: Clock },
  RESOLVED: { cls: good, icon: CircleCheck },
};

function Pill({ style, label, className = "" }: { style: Style; label: string; className?: string }) {
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style.cls} ${className}`}>
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}

export const ApplicationStatusBadge = ({ status }: { status: ApplicationStatusValue }) => (
  <Pill style={application[status]} label={APPLICATION_STATUS_LABEL[status]} />
);
export const JobStatusBadge = ({ status }: { status: JobStatusValue }) => <Pill style={job[status]} label={JOB_STATUS_LABEL[status]} />;
export const EnquiryStatusBadge = ({ status }: { status: EnquiryStatusValue }) => (
  <Pill style={enquiry[status]} label={ENQUIRY_STATUS_LABEL[status]} />
);
export const ExpiredBadge = () => <Pill style={{ cls: warn, icon: CalendarClock }} label="Deadline passed" />;
export const DemoBadge = () => (
  <Pill style={{ cls: "bg-ink-900 text-white ring-ink-900", icon: CircleDashed }} label="Demo listing" className="uppercase tracking-wide" />
);
export const RejectedBadge = () => <Pill style={{ cls: bad, icon: XCircle }} label="Suspended" />;
