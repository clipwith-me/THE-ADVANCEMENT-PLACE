/**
 * Reference data required in every environment (including production):
 * job categories and the settings row. Idempotent — safe to run repeatedly.
 * Demo vacancies live in prisma/seed-demo.ts and are never loaded here.
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { slugify } from "../src/lib/domain/slug";

export const CATEGORIES = [
  "Administration & Office Support",
  "Sales & Marketing",
  "Customer Service",
  "Accounting & Finance",
  "Banking & Insurance",
  "Information Technology",
  "Engineering & Technical",
  "Healthcare",
  "Education & Training",
  "Hospitality & Catering",
  "Logistics & Transport",
  "Human Resources",
  "Manufacturing & Production",
  "Legal",
  "Media & Creative",
  "Agriculture",
  "Security",
  "Other",
];

async function main() {
  for (const [i, name] of CATEGORIES.entries()) {
    await db.jobCategory.upsert({
      where: { slug: slugify(name) },
      update: { sortOrder: i },
      create: { name, slug: slugify(name), sortOrder: i },
    });
  }
  await db.siteSettings.createMany({ data: [{ id: 1 }], skipDuplicates: true });
  console.log(`Seeded ${CATEGORIES.length} job categories and default site settings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
