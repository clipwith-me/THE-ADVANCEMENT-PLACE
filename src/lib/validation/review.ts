import { z } from "zod";
import { REVIEWER_TYPES } from "../domain/labels";
import { emailField, honeypot, requiredText } from "./common";

export const reviewSchema = z.object({
  name: requiredText("Name", 2, 80),
  email: emailField,
  reviewerType: z.enum(REVIEWER_TYPES, { error: "Tell us how you know us" }),
  rating: z.coerce
    .number({ error: "Choose a rating" })
    .int("Choose a rating")
    .min(1, "Choose a rating from 1 to 5 stars")
    .max(5, "Choose a rating from 1 to 5 stars"),
  comment: requiredText("Review", 20, 1000),
  consent: z.literal("on", { error: "Please confirm we may publish your review" }),
  website: honeypot,
});

export const sitePhotoCaptionSchema = z.object({
  caption: requiredText("Caption", 3, 160),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
