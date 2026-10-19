import { z } from "zod";
import { OUTSOURCING_SERVICE_TYPES, QUALIFICATIONS } from "../domain/labels";
import { emailField, honeypot, optionalPhoneField, optionalText, phoneField, requiredText } from "./common";

const consent = z.literal("on", { error: "Please confirm we may use these details to respond to you" });

export const contactSchema = z.object({
  name: requiredText("Name", 2, 120),
  email: emailField,
  phone: phoneField,
  subject: requiredText("Subject", 3, 140),
  message: requiredText("Message", 10, 5000),
  consent,
  website: honeypot,
});

export const careerAssistanceSchema = z.object({
  name: requiredText("Name", 2, 120),
  email: emailField,
  phone: phoneField,
  qualification: z.enum(QUALIFICATIONS, { error: "Select your highest qualification" }),
  courseOfStudy: optionalText(160),
  careerInterests: requiredText("Career interests", 3, 500),
  message: requiredText("Message", 10, 5000),
  consent,
  website: honeypot,
});

export const outsourcingSchema = z.object({
  name: requiredText("Name", 2, 120),
  email: emailField,
  phone: optionalPhoneField,
  organization: optionalText(160),
  serviceType: z.enum(OUTSOURCING_SERVICE_TYPES, { error: "Select the type of service" }),
  message: requiredText("Project description", 20, 5000),
  consent,
  website: honeypot,
});

export type ContactInput = z.infer<typeof contactSchema>;
export type CareerAssistanceInput = z.infer<typeof careerAssistanceSchema>;
export type OutsourcingInput = z.infer<typeof outsourcingSchema>;
