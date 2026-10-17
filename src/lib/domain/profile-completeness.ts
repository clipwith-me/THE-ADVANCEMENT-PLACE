/**
 * The single source of truth for "is this candidate profile complete enough
 * to access the job board and apply?". The server evaluates this on every
 * gated request and action; the UI only displays its result.
 *
 * NYSC status is intentionally NOT a requirement.
 */
export interface CompletenessInput {
  name: string | null | undefined;
  email: string | null | undefined;
  phone: string | null | undefined;
  state: string | null | undefined;
  headline: string | null | undefined;
  highestQualification: string | null | undefined;
  skillCount: number;
  hasCv: boolean;
  hasPhoto: boolean;
}

export interface CompletenessPolicy {
  requireCv: boolean;
  requirePhoto: boolean;
}

export type RequirementKey = "name" | "email" | "phone" | "location" | "headline" | "qualification" | "skills" | "photo" | "cv";

export const REQUIREMENT_LABEL: Record<RequirementKey, string> = {
  name: "Full name",
  email: "Email address",
  phone: "Phone number",
  location: "Location (state)",
  headline: "Your experience",
  qualification: "Highest qualification",
  skills: "At least one skill",
  photo: "Passport photograph",
  cv: "CV / résumé (PDF or DOCX)",
};

export interface CompletenessResult {
  complete: boolean;
  missing: RequirementKey[];
  /** The requirements that apply under the current policy, in display order. */
  checked: RequirementKey[];
  completed: number;
  total: number;
  percent: number;
}

const filled = (v: string | null | undefined) => typeof v === "string" && v.trim().length > 0;

export function evaluateProfileCompleteness(input: CompletenessInput, policy: CompletenessPolicy): CompletenessResult {
  const checks: [RequirementKey, boolean][] = [
    ["name", filled(input.name)],
    ["email", filled(input.email)],
    ["phone", filled(input.phone)],
    ["location", filled(input.state)],
    ["headline", filled(input.headline)],
    ["qualification", filled(input.highestQualification)],
    ["skills", input.skillCount > 0],
  ];
  if (policy.requirePhoto) checks.push(["photo", input.hasPhoto]);
  if (policy.requireCv) checks.push(["cv", input.hasCv]);

  const missing = checks.filter(([, ok]) => !ok).map(([k]) => k);
  const total = checks.length;
  const completed = total - missing.length;
  return { complete: missing.length === 0, missing, checked: checks.map(([k]) => k), completed, total, percent: Math.round((completed / total) * 100) };
}
