/**
 * DEMO DATA — for local development and client demonstrations only.
 *
 * Every record is flagged `isDemo = true`, shows a "Demo listing" badge, is
 * excluded from the sitemap/structured data and is noindexed. Employers are
 * deliberately not named; salaries are illustrative only. Remove before
 * launch with `npm run db:demo:remove`.
 *
 * Refuses to run when NODE_ENV=production unless ALLOW_DEMO_DATA=true.
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { jobSlug, slugify } from "../src/lib/domain/slug";
import type { EmploymentType, WorkArrangement, SalaryPeriod } from "../src/generated/prisma/enums";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_DATA !== "true") {
  console.error("Refusing to load demo data in production. Set ALLOW_DEMO_DATA=true for a staging/demo deployment.");
  process.exit(1);
}

interface DemoJob {
  title: string;
  category: string;
  employmentType: EmploymentType;
  workArrangement: WorkArrangement;
  state: string;
  city?: string;
  salary?: [number, number, SalaryPeriod];
  experience?: [number, number?];
  deadlineInDays?: number;
  featured?: boolean;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  skills: string[];
}

const DEMO_EMPLOYER = "Demo Company (fictional)";

const jobs: DemoJob[] = [
  {
    title: "Accounts Officer",
    category: "Accounting & Finance",
    employmentType: "FULL_TIME",
    workArrangement: "ONSITE",
    state: "Ogun",
    city: "Abeokuta",
    salary: [150000, 220000, "MONTH"],
    experience: [2, 4],
    deadlineInDays: 21,
    featured: true,
    summary: "Maintain accurate financial records, prepare reconciliations and support month-end reporting for a growing business.",
    description:
      "This is a demonstration vacancy used to preview the job board.\n\nThe Accounts Officer will keep the books in order, process payments and receipts, and help the finance lead prepare reliable monthly reports.",
    responsibilities: [
      "Record daily transactions and maintain the general ledger",
      "Prepare bank reconciliations and petty cash reports",
      "Process vendor invoices and staff reimbursements",
      "Support month-end close and statutory remittances",
    ],
    requirements: ["2–4 years' experience in a similar role", "Good working knowledge of Microsoft Excel", "Attention to detail and integrity"],
    qualifications: ["HND or B.Sc. in Accounting or a related field", "ICAN or ATS (in view) is an advantage"],
    skills: ["Bookkeeping", "Microsoft Excel", "Reconciliation", "Sage or QuickBooks"],
  },
  {
    title: "Customer Service Representative",
    category: "Customer Service",
    employmentType: "FULL_TIME",
    workArrangement: "ONSITE",
    state: "Lagos",
    city: "Ikeja",
    salary: [100000, 130000, "MONTH"],
    experience: [1],
    deadlineInDays: 14,
    summary: "Be the first point of contact for customers by phone, email and in person, resolving enquiries quickly and courteously.",
    description:
      "This is a demonstration vacancy used to preview the job board.\n\nYou'll handle customer enquiries, log issues accurately and work with other teams to resolve them.",
    responsibilities: ["Respond to customer calls, emails and walk-ins", "Log and track customer issues to resolution", "Escalate complex cases appropriately"],
    requirements: ["At least 1 year of customer-facing experience", "Excellent spoken and written English", "Calm and professional manner"],
    qualifications: ["OND, HND or B.Sc. in any discipline"],
    skills: ["Customer service", "Communication", "CRM software"],
  },
  {
    title: "Graduate Trainee — Sales",
    category: "Sales & Marketing",
    employmentType: "FULL_TIME",
    workArrangement: "HYBRID",
    state: "Oyo",
    city: "Ibadan",
    experience: [0, 1],
    deadlineInDays: 30,
    featured: true,
    summary: "A structured trainee role for recent graduates who want to build a career in sales and business development.",
    description:
      "This is a demonstration vacancy used to preview the job board.\n\nTrainees receive on-the-job training while supporting the sales team with prospecting, client visits and reporting.",
    responsibilities: ["Identify and contact prospective customers", "Support client visits and product demonstrations", "Prepare weekly sales activity reports"],
    requirements: ["Graduated within the last three years", "Confident communicator", "Willingness to travel within the state"],
    qualifications: ["OND, HND or B.Sc. in any discipline", "NYSC status is not required to apply"],
    skills: ["Sales", "Negotiation", "Microsoft Office"],
  },
  {
    title: "Front-End Developer (React)",
    category: "Information Technology",
    employmentType: "CONTRACT",
    workArrangement: "REMOTE",
    state: "Nationwide",
    salary: [400000, 650000, "MONTH"],
    experience: [3, 5],
    deadlineInDays: 10,
    summary: "Build accessible, responsive web interfaces with React and TypeScript on a six-month remote contract.",
    description:
      "This is a demonstration vacancy used to preview the job board.\n\nYou'll work with a small product team to deliver new features and improve performance and accessibility.",
    responsibilities: ["Build UI features with React and TypeScript", "Write tests and review pull requests", "Improve accessibility and performance"],
    requirements: ["3+ years of professional front-end experience", "Strong TypeScript and React skills", "Reliable internet connection"],
    qualifications: ["Degree or equivalent practical experience"],
    skills: ["React", "TypeScript", "CSS", "Accessibility", "Git"],
  },
  {
    title: "Administrative Assistant (Part-time)",
    category: "Administration & Office Support",
    employmentType: "PART_TIME",
    workArrangement: "ONSITE",
    state: "Ogun",
    city: "Abeokuta",
    salary: [60000, 80000, "MONTH"],
    deadlineInDays: 18,
    summary: "Provide administrative support three days a week: scheduling, filing, correspondence and front-desk duties.",
    description:
      "This is a demonstration vacancy used to preview the job board.\n\nIdeal for someone looking for flexible, part-time office work.",
    responsibilities: ["Manage calendars and appointments", "Maintain paper and digital filing", "Receive visitors and handle calls"],
    requirements: ["Good organisational skills", "Basic computer literacy"],
    qualifications: ["SSCE minimum; OND/ND is an advantage"],
    skills: ["Microsoft Word", "Scheduling", "Filing"],
  },
  {
    title: "Logistics Coordinator",
    category: "Logistics & Transport",
    employmentType: "FULL_TIME",
    workArrangement: "ONSITE",
    state: "Rivers",
    city: "Port Harcourt",
    salary: [180000, 250000, "MONTH"],
    experience: [2, 5],
    summary: "Plan and track deliveries, manage drivers' schedules and keep inventory movements accurately recorded.",
    description: "This is a demonstration vacancy used to preview the job board.\n\nYou'll coordinate daily dispatch and work closely with warehouse and sales teams.",
    responsibilities: ["Plan daily delivery routes", "Track shipments and resolve delays", "Maintain delivery and inventory records"],
    requirements: ["2+ years in logistics or dispatch", "Good knowledge of Port Harcourt and environs"],
    qualifications: ["OND, HND or B.Sc. in any discipline"],
    skills: ["Route planning", "Inventory management", "Microsoft Excel"],
  },
  {
    title: "HR Intern",
    category: "Human Resources",
    employmentType: "INTERNSHIP",
    workArrangement: "HYBRID",
    state: "FCT (Abuja)",
    city: "Wuse",
    salary: [50000, 50000, "MONTH"],
    deadlineInDays: 25,
    summary: "A six-month internship supporting recruitment, onboarding and HR records.",
    description: "This is a demonstration vacancy used to preview the job board.\n\nInterns rotate across recruitment, onboarding and HR administration.",
    responsibilities: ["Screen CVs and schedule interviews", "Prepare onboarding documents", "Update HR records"],
    requirements: ["Interest in a career in HR", "Good written communication"],
    qualifications: ["Undergraduate or recent graduate (OND, HND or B.Sc.)"],
    skills: ["Recruitment", "Record keeping", "Communication"],
  },
  {
    title: "Event Support Staff (Temporary)",
    category: "Hospitality & Catering",
    employmentType: "TEMPORARY",
    workArrangement: "ONSITE",
    state: "Lagos",
    city: "Victoria Island",
    deadlineInDays: 7,
    summary: "Short-term event staff for a two-week conference: registration desk, ushering and guest support.",
    description: "This is a demonstration vacancy used to preview the job board.\n\nShifts are scheduled in advance; training is provided on the first day.",
    responsibilities: ["Register and direct guests", "Support session logistics", "Assist with guest enquiries"],
    requirements: ["Available for the full two weeks", "Friendly and professional"],
    qualifications: ["SSCE minimum"],
    skills: ["Customer service", "Teamwork"],
  },
];

async function main() {
  const categories = await db.jobCategory.findMany();
  if (categories.length === 0) throw new Error("Run `npm run db:seed` first to create categories.");
  const bySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const existing = await db.job.count({ where: { isDemo: true } });
  if (existing > 0) {
    console.log(`${existing} demo jobs already exist — nothing to do. Remove them with npm run db:demo:remove.`);
    return;
  }

  const now = Date.now();
  for (const [i, j] of jobs.entries()) {
    const categoryId = bySlug.get(slugify(j.category));
    if (!categoryId) throw new Error(`Unknown category ${j.category}`);
    await db.job.create({
      data: {
        slug: jobSlug(j.title, j.city ?? j.state),
        title: j.title,
        employerName: DEMO_EMPLOYER,
        showEmployer: false,
        summary: j.summary,
        description: j.description,
        responsibilities: j.responsibilities,
        requirements: j.requirements,
        qualifications: j.qualifications,
        skills: j.skills,
        employmentType: j.employmentType,
        workArrangement: j.workArrangement,
        state: j.state,
        city: j.city ?? null,
        salaryMin: j.salary?.[0] ?? null,
        salaryMax: j.salary?.[1] ?? null,
        salaryPeriod: j.salary?.[2] ?? null,
        experienceYearsMin: j.experience?.[0] ?? null,
        experienceYearsMax: j.experience?.[1] ?? null,
        deadline: j.deadlineInDays ? new Date(now + j.deadlineInDays * 86_400_000) : null,
        status: "PUBLISHED",
        publishedAt: new Date(now - i * 86_400_000),
        featured: j.featured ?? false,
        isDemo: true,
        categoryId,
      },
    });
  }
  // One expired and one draft listing, to demonstrate that neither appears on the board.
  const adminCategory = bySlug.get(slugify("Administration & Office Support"))!;
  await db.job.create({
    data: {
      slug: jobSlug("Receptionist expired demo", "Abeokuta"),
      title: "Receptionist",
      summary: "Demonstration of an expired vacancy — it should not appear on the job board.",
      description: "This is a demonstration vacancy whose deadline has passed. It is used to verify that expired jobs are hidden.",
      responsibilities: ["Front desk duties"],
      requirements: ["Good communication"],
      qualifications: [],
      skills: [],
      employmentType: "FULL_TIME",
      workArrangement: "ONSITE",
      state: "Ogun",
      city: "Abeokuta",
      deadline: new Date(now - 3 * 86_400_000),
      status: "PUBLISHED",
      publishedAt: new Date(now - 40 * 86_400_000),
      isDemo: true,
      categoryId: adminCategory,
    },
  });
  await db.job.create({
    data: {
      slug: jobSlug("Office manager draft demo", "Abeokuta"),
      title: "Office Manager",
      summary: "Demonstration of a draft vacancy — it should only be visible in the admin dashboard.",
      description: "This is a demonstration draft vacancy used to verify that drafts are never shown publicly.",
      responsibilities: ["Manage office operations"],
      requirements: ["3+ years' experience"],
      qualifications: [],
      skills: [],
      employmentType: "FULL_TIME",
      workArrangement: "ONSITE",
      state: "Ogun",
      city: "Abeokuta",
      status: "DRAFT",
      isDemo: true,
      categoryId: adminCategory,
    },
  });
  console.log(`Loaded ${jobs.length + 2} DEMO jobs (flagged isDemo=true).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
