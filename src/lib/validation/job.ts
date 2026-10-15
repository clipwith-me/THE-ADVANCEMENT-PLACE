import { z } from "zod";
import { EMPLOYMENT_TYPES, SALARY_PERIODS, WORK_ARRANGEMENTS } from "../domain/labels";
import { JOB_LOCATIONS } from "../domain/nigeria";
import { optionalText, requiredText, splitList } from "./common";

const lines = (label: string, maxItems: number, required: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => splitList(v, /\n/).map((l) => l.replace(/^[-•*]\s*/, "")))
    .pipe(
      z
        .array(z.string().max(300, `Each ${label.toLowerCase()} line must be 300 characters or fewer`))
        .max(maxItems, `Up to ${maxItems} ${label.toLowerCase()} lines`)
        .min(required ? 1 : 0, `Add at least one ${label.toLowerCase()} item`),
    );

const optionalInt = (label: string, max: number) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v.replace(/[,\s₦]/g, "")) : undefined))
    .pipe(
      z
        .number({ error: `${label} must be a number` })
        .int(`${label} must be a whole number`)
        .min(0, `${label} can't be negative`)
        .max(max, `${label} is too large`)
        .optional(),
    );

export const jobSchema = z
  .object({
    title: requiredText("Job title", 3, 120),
    categoryId: z.string().min(1, "Select a category").max(40),
    employerName: optionalText(120),
    showEmployer: z
      .string()
      .optional()
      .transform((v) => v === "on"),
    summary: requiredText("Summary", 20, 300),
    description: requiredText("Description", 50, 10_000),
    responsibilities: lines("Responsibilities", 30, true),
    requirements: lines("Requirements", 30, true),
    qualifications: lines("Qualifications", 15, false),
    skills: z
      .string()
      .optional()
      .transform((v) => splitList(v))
      .pipe(z.array(z.string().max(50)).max(25, "Up to 25 skills")),
    employmentType: z.enum(EMPLOYMENT_TYPES, { error: "Select an employment type" }),
    workArrangement: z.enum(WORK_ARRANGEMENTS, { error: "Select a work arrangement" }),
    state: z.enum(JOB_LOCATIONS, { error: "Select a location" }),
    city: optionalText(80),
    salaryMin: optionalInt("Minimum salary", 1_000_000_000),
    salaryMax: optionalInt("Maximum salary", 1_000_000_000),
    salaryPeriod: z
      .union([z.enum(SALARY_PERIODS), z.literal("")])
      .optional()
      .transform((v) => (v ? v : undefined)),
    experienceYearsMin: optionalInt("Minimum experience", 50),
    experienceYearsMax: optionalInt("Maximum experience", 50),
    deadline: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use the date picker (YYYY-MM-DD)"),
    applyInstructions: optionalText(1000),
    featured: z
      .string()
      .optional()
      .transform((v) => v === "on"),
  })
  .superRefine((d, ctx) => {
    if (d.salaryMin != null && d.salaryMax != null && d.salaryMax < d.salaryMin) {
      ctx.addIssue({ code: "custom", path: ["salaryMax"], message: "Maximum salary can't be below the minimum" });
    }
    if ((d.salaryMin != null || d.salaryMax != null) && !d.salaryPeriod) {
      ctx.addIssue({ code: "custom", path: ["salaryPeriod"], message: "Select whether the salary is monthly or yearly" });
    }
    if (d.experienceYearsMin != null && d.experienceYearsMax != null && d.experienceYearsMax < d.experienceYearsMin) {
      ctx.addIssue({ code: "custom", path: ["experienceYearsMax"], message: "Maximum can't be below the minimum" });
    }
    if (d.showEmployer && !d.employerName) {
      ctx.addIssue({ code: "custom", path: ["employerName"], message: "Enter the employer's name or untick “show employer”" });
    }
  });

export type JobInput = z.infer<typeof jobSchema>;

// ─── Public search parameters ────────────────────────────────────────────────

const multi = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : v.split(",")))
    .transform((arr) => arr.filter((x): x is T[number] => (values as readonly string[]).includes(x)));

export const JOB_SORTS = ["newest", "deadline", "salary"] as const;
export type JobSort = (typeof JOB_SORTS)[number];

/** Lenient: bad values are dropped rather than erroring, so shared URLs never 500. */
export const jobSearchSchema = z.object({
  q: z
    .string()
    .optional()
    .transform((v) => (v ? v.trim().slice(0, 100) : undefined)),
  location: z
    .string()
    .optional()
    .transform((v) => (v ? v.trim().slice(0, 60) : undefined)),
  type: multi(EMPLOYMENT_TYPES),
  arrangement: multi(WORK_ARRANGEMENTS),
  category: z
    .string()
    .optional()
    .transform((v) => (v && /^[a-z0-9-]{1,60}$/.test(v) ? v : undefined)),
  sort: z
    .string()
    .optional()
    .transform((v): JobSort => ((JOB_SORTS as readonly string[]).includes(v ?? "") ? (v as JobSort) : "newest")),
  page: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 1 && n <= 1000 ? n : 1;
    }),
});

export type JobSearch = z.infer<typeof jobSearchSchema>;

export function parseJobSearch(params: Record<string, string | string[] | undefined>): JobSearch {
  const flat: Record<string, string | string[] | undefined> = {};
  for (const [k, v] of Object.entries(params)) {
    flat[k] = Array.isArray(v) && !["type", "arrangement"].includes(k) ? v[0] : v;
  }
  const parsed = jobSearchSchema.safeParse(flat);
  return parsed.success ? parsed.data : jobSearchSchema.parse({});
}
