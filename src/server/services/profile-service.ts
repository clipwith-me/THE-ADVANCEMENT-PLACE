import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { forbidden, notFound } from "@/lib/errors";
import { skillKey } from "@/lib/domain/slug";
import { evaluateProfileCompleteness, type CompletenessResult } from "@/lib/domain/profile-completeness";
import { parseOrThrow } from "@/lib/validation/parse";
import { coreProfileSchema, educationSchema, experienceSchema, fullProfileSchema } from "@/lib/validation/profile";
import { audit } from "../audit";
import { enforce, LIMITS } from "../rate-limit";
import { deleteStoredFile, storeDocument, type IncomingFile } from "./file-service";
import { getSettings } from "./settings-service";

const bundleInclude = {
  profile: {
    include: {
      skills: { include: { skill: true }, orderBy: { skill: { name: "asc" } } },
      currentCv: { select: { id: true, originalName: true, sizeBytes: true, createdAt: true, mimeType: true } },
      education: { orderBy: [{ endYear: "desc" }, { createdAt: "desc" }] },
      experience: { orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }] },
    },
  },
} satisfies Prisma.UserInclude;

export type ProfileBundle = Prisma.UserGetPayload<{ include: typeof bundleInclude }>;

/** Loads the signed-in candidate's own profile (creating the row if missing). */
export async function getProfileBundle(userId: string): Promise<ProfileBundle> {
  await db.candidateProfile.upsert({ where: { userId }, update: {}, create: { userId } });
  const user = await db.user.findUnique({ where: { id: userId }, include: bundleInclude });
  if (!user) throw notFound();
  return user;
}

export function completenessOf(user: ProfileBundle, requireCv: boolean): CompletenessResult {
  const p = user.profile;
  return evaluateProfileCompleteness(
    {
      name: user.name,
      email: user.email,
      phone: p?.phone,
      state: p?.state,
      headline: p?.headline,
      highestQualification: p?.highestQualification,
      skillCount: p?.skills.length ?? 0,
      hasCv: Boolean(p?.currentCvId),
    },
    { requireCv },
  );
}

export async function getCompleteness(userId: string): Promise<{ bundle: ProfileBundle; result: CompletenessResult }> {
  const [bundle, settings] = await Promise.all([getProfileBundle(userId), getSettings()]);
  return { bundle, result: completenessOf(bundle, settings.requireCvForProfile) };
}

/** Keeps `completedAt` in line with the live rules after every profile change. */
async function syncCompletedAt(userId: string): Promise<CompletenessResult> {
  const { bundle, result } = await getCompleteness(userId);
  const completedAt = bundle.profile?.completedAt ?? null;
  if (result.complete && !completedAt) {
    await db.candidateProfile.update({ where: { userId }, data: { completedAt: new Date() } });
  } else if (!result.complete && completedAt) {
    await db.candidateProfile.update({ where: { userId }, data: { completedAt: null } });
  }
  return result;
}

async function replaceSkills(tx: Prisma.TransactionClient, profileId: string, names: string[]) {
  await tx.candidateSkill.deleteMany({ where: { profileId } });
  for (const name of names) {
    const slug = skillKey(name);
    const skill = await tx.skill.upsert({ where: { slug }, update: {}, create: { slug, name: name.trim() } });
    await tx.candidateSkill.create({ data: { profileId, skillId: skill.id } });
  }
}

/**
 * Saves profile fields. `mode: "core"` is the setup step (required fields +
 * NYSC); `"full"` also covers the optional sections. Only whitelisted fields
 * are written — userId, role, completedAt etc. can't be mass-assigned.
 */
export async function saveProfile(userId: string, raw: Record<string, string>, mode: "core" | "full"): Promise<CompletenessResult> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "CANDIDATE") throw forbidden();

  const core = mode === "core" ? parseOrThrow(coreProfileSchema, raw) : null;
  const full = mode === "full" ? parseOrThrow(fullProfileSchema, raw) : null;
  const input = (core ?? full)!;

  const data: Prisma.CandidateProfileUpdateInput = {
    phone: input.phone,
    state: input.state,
    city: input.city ?? null,
    headline: input.headline,
    highestQualification: input.highestQualification,
    qualificationDetail: input.qualificationDetail ?? null,
    nyscStatus: input.nyscStatus,
  };
  if (full) {
    Object.assign(data, {
      institution: full.institution ?? null,
      courseOfStudy: full.courseOfStudy ?? null,
      graduationYear: full.graduationYear ?? null,
      certifications: full.certifications ?? null,
      portfolioUrl: full.portfolioUrl ?? null,
      linkedinUrl: full.linkedinUrl ?? null,
      about: full.about ?? null,
    } satisfies Prisma.CandidateProfileUpdateInput);
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { name: input.name } });
    const profile = await tx.candidateProfile.upsert({ where: { userId }, update: {}, create: { userId } });
    await tx.candidateProfile.update({ where: { userId }, data });
    await replaceSkills(tx, profile.id, input.skills);
  });
  return syncCompletedAt(userId);
}

// ─── CV management ───────────────────────────────────────────────────────────

/**
 * Uploads a new CV and makes it current. The previous CV is deleted unless an
 * application still references it (applications keep the CV submitted).
 */
export async function uploadCv(userId: string, file: IncomingFile): Promise<CompletenessResult> {
  await enforce(LIMITS.upload, userId);
  const profile = await db.candidateProfile.upsert({ where: { userId }, update: {}, create: { userId } });
  const previousId = profile.currentCvId;
  await db.$transaction(async (tx) => {
    const stored = await storeDocument(tx, { kind: "CV", ownerId: userId, file });
    await tx.candidateProfile.update({ where: { userId }, data: { currentCvId: stored.id } });
    if (previousId) await removeIfUnreferenced(tx, previousId);
  });
  await audit({ actorId: userId, action: "cv.upload", entityType: "User", entityId: userId });
  return syncCompletedAt(userId);
}

export async function removeCurrentCv(userId: string): Promise<CompletenessResult> {
  const profile = await db.candidateProfile.findUnique({ where: { userId } });
  if (profile?.currentCvId) {
    const id = profile.currentCvId;
    await db.$transaction(async (tx) => {
      await tx.candidateProfile.update({ where: { userId }, data: { currentCvId: null } });
      await removeIfUnreferenced(tx, id);
    });
    await audit({ actorId: userId, action: "cv.remove", entityType: "User", entityId: userId });
  }
  return syncCompletedAt(userId);
}

async function removeIfUnreferenced(tx: Prisma.TransactionClient, fileId: string) {
  const refs = await tx.application.count({ where: { cvFileId: fileId } });
  if (refs === 0) await deleteStoredFile(tx, fileId);
}

// ─── Education & work history ────────────────────────────────────────────────

async function ownProfileId(userId: string): Promise<string> {
  const p = await db.candidateProfile.upsert({ where: { userId }, update: {}, create: { userId }, select: { id: true } });
  return p.id;
}

export async function addEducation(userId: string, raw: Record<string, string>) {
  const input = parseOrThrow(educationSchema, raw);
  const profileId = await ownProfileId(userId);
  if ((await db.educationRecord.count({ where: { profileId } })) >= 10) {
    throw forbidden("You can add up to 10 education records.");
  }
  await db.educationRecord.create({ data: { profileId, ...input } });
}

export async function removeEducation(userId: string, id: string) {
  const profileId = await ownProfileId(userId);
  // Scoped by profileId: another candidate's record ID simply matches nothing.
  await db.educationRecord.deleteMany({ where: { id, profileId } });
}

export async function addExperience(userId: string, raw: Record<string, string>) {
  const input = parseOrThrow(experienceSchema, raw);
  const profileId = await ownProfileId(userId);
  if ((await db.workExperience.count({ where: { profileId } })) >= 15) {
    throw forbidden("You can add up to 15 roles.");
  }
  await db.workExperience.create({
    data: { profileId, ...input, endDate: input.isCurrent ? null : input.endDate },
  });
}

export async function removeExperience(userId: string, id: string) {
  const profileId = await ownProfileId(userId);
  await db.workExperience.deleteMany({ where: { id, profileId } });
}
