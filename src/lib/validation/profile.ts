import { z } from "zod";
import { NYSC_STATUSES, QUALIFICATIONS } from "../domain/labels";
import { NIGERIAN_STATES, EXTRA_LOCATIONS } from "../domain/nigeria";
import { optionalText, optionalUrl, phoneField, requiredText, splitList } from "./common";

const CANDIDATE_LOCATIONS = [...NIGERIAN_STATES, ...EXTRA_LOCATIONS.filter((l) => l !== "Nationwide")] as const;
const thisYear = new Date().getFullYear();

const skillsField = z
  .string()
  .optional()
  .transform((v) => splitList(v))
  .pipe(
    z
      .array(z.string().max(50, "Each skill must be 50 characters or fewer"))
      .min(1, "Add at least one skill")
      .max(30, "Add up to 30 skills"),
  );

/** Fields required for a complete profile, plus NYSC (optional by design). */
export const coreProfileSchema = z.object({
  name: requiredText("Full name", 2, 120),
  phone: phoneField,
  state: z.enum(CANDIDATE_LOCATIONS, { error: "Select your state or location" }),
  city: optionalText(80),
  headline: requiredText("Your experience", 3, 500),
  highestQualification: z.enum(QUALIFICATIONS, { error: "Select your highest qualification" }),
  qualificationDetail: optionalText(140),
  skills: skillsField,
  nyscStatus: z
    .union([z.enum(NYSC_STATUSES), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
});

export const fullProfileSchema = coreProfileSchema.extend({
  institution: optionalText(160),
  courseOfStudy: optionalText(160),
  graduationYear: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(
      z
        .number({ error: "Enter a valid year" })
        .int("Enter a valid year")
        .min(1950, "Enter a valid year")
        .max(thisYear + 6, "Enter a valid year")
        .optional(),
    ),
  certifications: optionalText(1000),
  portfolioUrl: optionalUrl(),
  linkedinUrl: optionalUrl(
    (h) => h === "linkedin.com" || h.endsWith(".linkedin.com"),
    "Enter a LinkedIn profile link (linkedin.com/in/…)",
  ),
  about: optionalText(2000),
});

export type CoreProfileInput = z.infer<typeof coreProfileSchema>;
export type FullProfileInput = z.infer<typeof fullProfileSchema>;

const yearField = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? Number(v) : undefined))
  .pipe(z.number().int().min(1950).max(thisYear + 6).optional());

export const educationSchema = z
  .object({
    institution: requiredText("Institution", 2, 160),
    qualification: z.enum(QUALIFICATIONS, { error: "Select a qualification" }),
    courseOfStudy: optionalText(160),
    startYear: yearField,
    endYear: yearField,
  })
  .refine((d) => !d.startYear || !d.endYear || d.endYear >= d.startYear, {
    path: ["endYear"],
    message: "End year can't be before start year",
  });

const monthField = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^\d{4}-(0[1-9]|1[0-2])$/.test(v), "Use the month picker (YYYY-MM)")
  .transform((v) => (v ? new Date(`${v}-01T00:00:00Z`) : undefined));

export const experienceSchema = z
  .object({
    employer: requiredText("Employer", 2, 160),
    title: requiredText("Job title", 2, 120),
    startDate: monthField,
    endDate: monthField,
    isCurrent: z
      .string()
      .optional()
      .transform((v) => v === "on"),
    description: optionalText(1500),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    path: ["endDate"],
    message: "End date can't be before start date",
  });
