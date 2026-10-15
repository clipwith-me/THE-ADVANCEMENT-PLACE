/**
 * Human-readable labels for enum values. Kept free of Prisma imports so the
 * same module is safe in client components.
 */
export const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"] as const;
export type EmploymentTypeValue = (typeof EMPLOYMENT_TYPES)[number];
export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentTypeValue, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
};

export const WORK_ARRANGEMENTS = ["ONSITE", "HYBRID", "REMOTE"] as const;
export type WorkArrangementValue = (typeof WORK_ARRANGEMENTS)[number];
export const WORK_ARRANGEMENT_LABEL: Record<WorkArrangementValue, string> = {
  ONSITE: "On-site",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

export const JOB_STATUSES = ["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"] as const;
export type JobStatusValue = (typeof JOB_STATUSES)[number];
export const JOB_STATUS_LABEL: Record<JobStatusValue, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
};

export const SALARY_PERIODS = ["MONTH", "YEAR"] as const;
export type SalaryPeriodValue = (typeof SALARY_PERIODS)[number];

export const QUALIFICATIONS = [
  "SSCE",
  "OND",
  "HND",
  "BACHELORS",
  "PGD",
  "MASTERS",
  "DOCTORATE",
  "PROFESSIONAL_CERTIFICATION",
  "OTHER",
] as const;
export type QualificationValue = (typeof QUALIFICATIONS)[number];
export const QUALIFICATION_LABEL: Record<QualificationValue, string> = {
  SSCE: "SSCE / WAEC / NECO",
  OND: "OND / ND",
  HND: "HND",
  BACHELORS: "Bachelor's degree (B.Sc., B.A., B.Eng., etc.)",
  PGD: "Postgraduate Diploma (PGD)",
  MASTERS: "Master's degree",
  DOCTORATE: "Doctorate (PhD)",
  PROFESSIONAL_CERTIFICATION: "Professional certification",
  OTHER: "Other",
};

export const NYSC_STATUSES = ["COMPLETED", "SERVING", "AWAITING_MOBILISATION", "EXEMPTED", "NOT_APPLICABLE"] as const;
export type NyscStatusValue = (typeof NYSC_STATUSES)[number];
export const NYSC_STATUS_LABEL: Record<NyscStatusValue, string> = {
  COMPLETED: "Completed",
  SERVING: "Currently serving",
  AWAITING_MOBILISATION: "Awaiting mobilisation",
  EXEMPTED: "Exempted",
  NOT_APPLICABLE: "Not applicable",
};

export const APPLICATION_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW",
  "SUCCESSFUL",
  "UNSUCCESSFUL",
  "WITHDRAWN",
] as const;
export type ApplicationStatusValue = (typeof APPLICATION_STATUSES)[number];
export const APPLICATION_STATUS_LABEL: Record<ApplicationStatusValue, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  SUCCESSFUL: "Successful",
  UNSUCCESSFUL: "Not progressed",
  WITHDRAWN: "Withdrawn",
};
/** Statuses an administrator can set (withdrawal belongs to the candidate). */
export const ADMIN_SETTABLE_STATUSES = APPLICATION_STATUSES.filter((s) => s !== "WITHDRAWN");
export const FINAL_APPLICATION_STATUSES: readonly ApplicationStatusValue[] = ["SUCCESSFUL", "UNSUCCESSFUL", "WITHDRAWN"];

export const ENQUIRY_TYPES = ["CAREER_ASSISTANCE", "FREELANCE_OUTSOURCING", "CONTACT"] as const;
export type EnquiryTypeValue = (typeof ENQUIRY_TYPES)[number];
export const ENQUIRY_TYPE_LABEL: Record<EnquiryTypeValue, string> = {
  CAREER_ASSISTANCE: "Career assistance",
  FREELANCE_OUTSOURCING: "Freelance & outsourcing",
  CONTACT: "Contact",
};
export const ENQUIRY_TYPE_SLUG: Record<EnquiryTypeValue, string> = {
  CAREER_ASSISTANCE: "career",
  FREELANCE_OUTSOURCING: "outsourcing",
  CONTACT: "contact",
};
export const ENQUIRY_SLUG_TYPE: Record<string, EnquiryTypeValue> = {
  career: "CAREER_ASSISTANCE",
  outsourcing: "FREELANCE_OUTSOURCING",
  contact: "CONTACT",
};

export const ENQUIRY_STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED"] as const;
export type EnquiryStatusValue = (typeof ENQUIRY_STATUSES)[number];
export const ENQUIRY_STATUS_LABEL: Record<EnquiryStatusValue, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

export const OUTSOURCING_SERVICE_TYPES = [
  "Freelance opportunity",
  "Outsourcing a project",
  "Staffing / recruitment support",
  "Partnership proposal",
  "Other",
] as const;
