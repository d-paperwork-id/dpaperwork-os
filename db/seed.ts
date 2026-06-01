import { nanoid } from "nanoid";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type * as schema from "./schema";
import {
  workspaceAgentConfig,
  userAgentAssignments,
  contextMd,
  contextMdVersions,
  domains,
  domainFields,
  domainRecords,
} from "./schema";

type Tx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

const AGENTS = ["pm", "chief-of-staff", "executive-assistant"] as const;

export async function seedWorkspace(
  tx: Tx,
  workspaceId: string,
  userId: string,
): Promise<void> {
  // 1. Agent configs
  await tx.insert(workspaceAgentConfig).values(
    AGENTS.map((agentId) => ({
      workspaceId,
      agentId,
      isEnabled: true,
      allowedTools: [] as string[],
      allowedIntegrations: [] as string[],
    })),
  );

  // 2. Agent assignments for creator
  await tx.insert(userAgentAssignments).values(
    AGENTS.map((agentId) => ({
      id: `${workspaceId}_${agentId}`,
      workspaceId,
      userId,
      agentId,
    })),
  );

  // 3. context_md (empty)
  const contextVersionId = `ver_${nanoid(16)}`;
  await tx.insert(contextMdVersions).values({
    id: contextVersionId,
    workspaceId,
    content: "",
    createdByUserId: userId,
  });
  await tx.insert(contextMd).values({
    workspaceId,
    content: "",
    currentVersionId: contextVersionId,
    updatedByUserId: userId,
  });

  // 4. role_md per agent
  // for (const agentId of AGENTS) {
  //   const content = DEFAULT_ROLE_CONTENT[agentId] ?? "";
  //   const versionId = `ver_${nanoid(16)}`;
  //   await tx.insert(roleMdVersions).values({
  //     id: versionId,
  //     workspaceId,
  //     agentId,
  //     content,
  //     createdByUserId: userId,
  //   });
  //   await tx.insert(roleMd).values({
  //     workspaceId,
  //     agentId,
  //     content,
  //     currentVersionId: versionId,
  //     updatedByUserId: userId,
  //   });
  // }

  // 5. Default domains
  const customersId = `dom_${nanoid(16)}`;
  const dealsId = `dom_${nanoid(16)}`;
  const vendorsId = `dom_${nanoid(16)}`;
  const teamId = `dom_${nanoid(16)}`;
  const tasksId = `dom_${nanoid(16)}`;
  const linkedInId = `dom_${nanoid(16)}`;

  await tx.insert(domains).values([
    {
      id: customersId,
      workspaceId,
      name: "Design Partners",
      slug: "design-partners",
      icon: "users",
      createdByUserId: userId,
    },
    {
      id: dealsId,
      workspaceId,
      name: "Deals",
      slug: "deals",
      icon: "handshake",
      createdByUserId: userId,
    },
    {
      id: vendorsId,
      workspaceId,
      name: "Vendors",
      slug: "vendors",
      icon: "truck",
      createdByUserId: userId,
    },
    {
      id: teamId,
      workspaceId,
      name: "Team",
      slug: "team",
      icon: "user-check",
      createdByUserId: userId,
    },
    {
      id: tasksId,
      workspaceId,
      name: "Tasks",
      slug: "tasks",
      icon: "check-square",
      createdByUserId: userId,
    },
    {
      id: linkedInId,
      workspaceId,
      name: "LinkedIn Posts",
      slug: "linkedin-posts",
      icon: "linkedin",
      createdByUserId: userId,
    },
  ]);

  // 6. Default domain fields
  await tx.insert(domainFields).values([
    // Design Partners — dpaperwork's own clients
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: customersId,
      workspaceId,
      name: "Name",
      slug: "name",
      type: "text",
      position: 0,
      isRequired: true,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: customersId,
      workspaceId,
      name: "Company",
      slug: "company",
      type: "text",
      position: 1,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: customersId,
      workspaceId,
      name: "Email",
      slug: "email",
      type: "text",
      position: 2,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: customersId,
      workspaceId,
      name: "Industry",
      slug: "industry",
      type: "text",
      position: 3,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: customersId,
      workspaceId,
      name: "Onboarding Stage",
      slug: "onboarding_stage",
      type: "single_select",
      position: 4,
      options: {
        choices: [
          { value: "intro_call_done", label: "Intro Call Done" },
          { value: "workspace_setup", label: "Workspace Setup" },
          { value: "first_routine_live", label: "First Routine Live" },
          { value: "active", label: "Active" },
        ],
      },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: customersId,
      workspaceId,
      name: "MRR",
      slug: "mrr",
      type: "number",
      position: 5,
      options: { format: "currency" },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: customersId,
      workspaceId,
      name: "Next Check-in",
      slug: "next_checkin",
      type: "date",
      position: 6,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: customersId,
      workspaceId,
      name: "Notes",
      slug: "notes",
      type: "long_text",
      position: 7,
    },

    // Deals
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: dealsId,
      workspaceId,
      name: "Name",
      slug: "name",
      type: "text",
      position: 0,
      isRequired: true,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: dealsId,
      workspaceId,
      name: "Contact",
      slug: "contact",
      type: "domain_ref",
      position: 1,
      options: { target_domain_id: customersId },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: dealsId,
      workspaceId,
      name: "Setup Fee",
      slug: "setup_fee",
      type: "number",
      position: 2,
      options: { format: "currency" },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: dealsId,
      workspaceId,
      name: "MRR",
      slug: "mrr",
      type: "number",
      position: 3,
      options: { format: "currency" },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: dealsId,
      workspaceId,
      name: "Stage",
      slug: "stage",
      type: "single_select",
      position: 4,
      options: {
        choices: [
          { value: "prospect", label: "Prospect" },
          { value: "intro_call", label: "Intro Call" },
          { value: "proposal_sent", label: "Proposal Sent" },
          { value: "negotiation", label: "Negotiation" },
          { value: "closed_won", label: "Closed Won" },
          { value: "closed_lost", label: "Closed Lost" },
        ],
      },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: dealsId,
      workspaceId,
      name: "Expected Close Date",
      slug: "expected_close_date",
      type: "date",
      position: 5,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: dealsId,
      workspaceId,
      name: "Notes",
      slug: "notes",
      type: "long_text",
      position: 6,
    },

    // Vendors
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: vendorsId,
      workspaceId,
      name: "Name",
      slug: "name",
      type: "text",
      position: 0,
      isRequired: true,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: vendorsId,
      workspaceId,
      name: "Category",
      slug: "category",
      type: "text",
      position: 1,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: vendorsId,
      workspaceId,
      name: "Contact",
      slug: "contact",
      type: "text",
      position: 2,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: vendorsId,
      workspaceId,
      name: "Monthly Cost",
      slug: "monthly_cost",
      type: "number",
      position: 3,
      options: { format: "currency" },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: vendorsId,
      workspaceId,
      name: "Status",
      slug: "status",
      type: "single_select",
      position: 4,
      options: {
        choices: [
          { value: "active", label: "Active" },
          { value: "evaluating", label: "Evaluating" },
          { value: "cancelled", label: "Cancelled" },
        ],
      },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: vendorsId,
      workspaceId,
      name: "Renewal Date",
      slug: "renewal_date",
      type: "date",
      position: 5,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: vendorsId,
      workspaceId,
      name: "Notes",
      slug: "notes",
      type: "long_text",
      position: 6,
    },

    // Team
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: teamId,
      workspaceId,
      name: "Name",
      slug: "name",
      type: "text",
      position: 0,
      isRequired: true,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: teamId,
      workspaceId,
      name: "Role",
      slug: "role",
      type: "text",
      position: 1,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: teamId,
      workspaceId,
      name: "Start Date",
      slug: "start_date",
      type: "date",
      position: 2,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: teamId,
      workspaceId,
      name: "Status",
      slug: "status",
      type: "single_select",
      position: 3,
      options: {
        choices: [
          { value: "active", label: "Active" },
          { value: "contractor", label: "Contractor" },
          { value: "departed", label: "Departed" },
        ],
      },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: teamId,
      workspaceId,
      name: "Notes",
      slug: "notes",
      type: "long_text",
      position: 4,
    },

    // Tasks
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: tasksId,
      workspaceId,
      name: "Title",
      slug: "title",
      type: "text",
      position: 0,
      isRequired: true,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: tasksId,
      workspaceId,
      name: "Status",
      slug: "status",
      type: "single_select",
      position: 1,
      options: {
        choices: [
          { value: "todo", label: "To Do" },
          { value: "in_progress", label: "In Progress" },
          { value: "blocked", label: "Blocked" },
          { value: "done", label: "Done" },
        ],
      },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: tasksId,
      workspaceId,
      name: "Area",
      slug: "area",
      type: "single_select",
      position: 2,
      options: {
        choices: [
          { value: "product", label: "Product" },
          { value: "sales", label: "Sales" },
          { value: "onboarding", label: "Onboarding" },
          { value: "content", label: "Content" },
          { value: "ops", label: "Ops" },
        ],
      },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: tasksId,
      workspaceId,
      name: "Due Date",
      slug: "due_date",
      type: "date",
      position: 3,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: tasksId,
      workspaceId,
      name: "Notes",
      slug: "notes",
      type: "long_text",
      position: 4,
    },

    // LinkedIn Posts
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: linkedInId,
      workspaceId,
      name: "Title",
      slug: "title",
      type: "text",
      position: 0,
      isRequired: true,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: linkedInId,
      workspaceId,
      name: "Hook",
      slug: "hook",
      type: "text",
      position: 1,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: linkedInId,
      workspaceId,
      name: "Content",
      slug: "content",
      type: "long_text",
      position: 2,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: linkedInId,
      workspaceId,
      name: "Status",
      slug: "status",
      type: "single_select",
      position: 3,
      options: {
        choices: [
          { value: "idea", label: "Idea" },
          { value: "draft", label: "Draft" },
          { value: "scheduled", label: "Scheduled" },
          { value: "published", label: "Published" },
        ],
      },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: linkedInId,
      workspaceId,
      name: "Published Date",
      slug: "published_date",
      type: "date",
      position: 4,
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: linkedInId,
      workspaceId,
      name: "Likes",
      slug: "likes",
      type: "number",
      position: 5,
      options: { format: "plain" },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: linkedInId,
      workspaceId,
      name: "Comments",
      slug: "comments",
      type: "number",
      position: 6,
      options: { format: "plain" },
    },
    {
      id: `dom_f_${nanoid(12)}`,
      domainId: linkedInId,
      workspaceId,
      name: "Topic",
      slug: "topic",
      type: "single_select",
      position: 7,
      options: {
        choices: [
          { value: "build_in_public", label: "Build in Public" },
          { value: "product_demo", label: "Product Demo" },
          { value: "founder_story", label: "Founder Story" },
          { value: "insight", label: "Insight" },
          { value: "case_study", label: "Case Study" },
        ],
      },
    },
  ]);

  // 7. Mock records — dpaperwork as the business
  await tx.insert(domainRecords).values([
    // --- Design Partners ---
    {
      id: `rec_${nanoid(16)}`,
      domainId: customersId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        name: "Arjun Mehta",
        company: "GrowFast (SaaS startup)",
        email: "arjun@growfast.in",
        industry: "B2B SaaS",
        onboarding_stage: "first_routine_live",
        mrr: 10000,
        next_checkin: "2025-06-06",
        notes:
          "First design partner. Intro call May 12. Workspace set up May 15. Weekly company update routine went live May 19 — Arjun said the Monday brief was the first time he felt 'on top of everything' without opening 4 tools. Follow up Friday to capture feedback for LinkedIn.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: customersId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        name: "Priya Nair",
        company: "BlueWave Consulting",
        email: "priya@bluewave.co",
        industry: "Management Consulting",
        onboarding_stage: "workspace_setup",
        mrr: 10000,
        next_checkin: "2025-06-04",
        notes:
          "Second design partner. Signed May 22 after seeing Arjun's LinkedIn reaction post. Workspace being set up this week. First priority: Clients domain + weekly brief for her team of 6. Has strong opinions on the UI — capture them.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: customersId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        name: "Vikram Joshi",
        company: "NexGen Retail",
        email: "vikram@nexgenretail.com",
        industry: "Retail Operations",
        onboarding_stage: "intro_call_done",
        mrr: 0,
        next_checkin: "2025-06-05",
        notes:
          "Intro call May 28. Runs a 12-person retail ops team. Main pain: Monday morning sync takes 2 hours because data is across WhatsApp, Excel, and email. Wants to see a live demo with his actual domain structure before signing. Prepare demo by Thursday.",
      },
    },

    // --- Deals ---
    {
      id: `rec_${nanoid(16)}`,
      domainId: dealsId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        name: "GrowFast — Design Partner",
        setup_fee: 50000,
        mrr: 10000,
        stage: "closed_won",
        expected_close_date: "2025-05-15",
        notes: "Closed May 15. Setup fee paid. First design partner.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: dealsId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        name: "BlueWave Consulting — Design Partner",
        setup_fee: 50000,
        mrr: 10000,
        stage: "closed_won",
        expected_close_date: "2025-05-22",
        notes: "Closed May 22. Inbound from LinkedIn. Setup fee paid.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: dealsId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        name: "NexGen Retail — Design Partner",
        setup_fee: 50000,
        mrr: 10000,
        stage: "proposal_sent",
        expected_close_date: "2025-06-06",
        notes:
          "Proposal sent May 29 after intro call. Vikram wants a live demo showing his use case — retail ops Monday brief. Demo prep is a task this week. High intent.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: dealsId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        name: "Tanvi Shah — Freelance Agency",
        setup_fee: 50000,
        mrr: 10000,
        stage: "intro_call",
        expected_close_date: "2025-06-13",
        notes:
          "Intro call scheduled June 3. Creative agency founder, 8-person team. Found us via LinkedIn post about the Monday brief. Use case: project status + client pipeline rolled up weekly.",
      },
    },

    // --- Vendors ---
    {
      id: `rec_${nanoid(16)}`,
      domainId: vendorsId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        name: "Supabase",
        category: "Database / Auth",
        contact: "support@supabase.io",
        monthly_cost: 2500,
        status: "active",
        renewal_date: "2025-07-01",
        notes:
          "Pro plan. Postgres + auth backend. Review if we need to upgrade once we're at 10 workspaces.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: vendorsId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        name: "Trigger.dev",
        category: "Background Jobs",
        contact: "support@trigger.dev",
        monthly_cost: 1500,
        status: "active",
        renewal_date: "2025-07-01",
        notes:
          "Handles all scheduled routines. Free tier was fine during build, moved to hobby plan once routines went live.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: vendorsId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        name: "Anthropic (Claude API)",
        category: "AI",
        contact: "support@anthropic.com",
        monthly_cost: 4000,
        status: "active",
        renewal_date: null,
        notes:
          "Pay-as-you-go. ~₹4K/month at current usage (2 design partners, weekly routines). Watch this as we scale — prompt caching is saving ~40% on tokens.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: vendorsId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        name: "Vercel",
        category: "Hosting",
        contact: "support@vercel.com",
        monthly_cost: 2000,
        status: "active",
        renewal_date: "2025-07-01",
        notes: "Pro plan. Next.js deployment. No issues.",
      },
    },

    // --- Team ---
    {
      id: `rec_${nanoid(16)}`,
      domainId: teamId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        name: "Sam Joshuva",
        role: "Founder",
        start_date: "2025-01-01",
        status: "active",
        notes: "Building everything. Primary contact for all design partners.",
      },
    },

    // --- Tasks ---
    {
      id: `rec_${nanoid(16)}`,
      domainId: tasksId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        title: "Prepare live demo for Vikram (NexGen Retail)",
        status: "in_progress",
        area: "sales",
        due_date: "2025-06-05",
        notes:
          "Build a demo workspace with retail-specific domains: Stock, Stores, Team. Run the Monday brief routine and record the inbox output. Goal: show Vikram exactly what his Monday morning would look like.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: tasksId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        title: "Complete BlueWave workspace setup",
        status: "in_progress",
        area: "onboarding",
        due_date: "2025-06-04",
        notes:
          "Set up Priya's workspace: seed Clients domain, Engagements domain. Fill CONTEXT.md with BlueWave company context. Create first routine (Weekly Client Update, Monday 9am). Walk Priya through it on Wednesday call.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: tasksId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        title: "Capture and publish Arjun's Monday brief reaction",
        status: "todo",
        area: "content",
        due_date: "2025-06-06",
        notes:
          "Arjun said the Monday brief was 'the first time I felt on top of everything without opening 4 tools.' Get a 2-minute Loom or written quote. Turn into LinkedIn post + case study snippet.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: tasksId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        title: "Ship inbox filter by agent + status",
        status: "in_progress",
        area: "product",
        due_date: "2025-06-03",
        notes:
          "Filter bar is built but the Select values aren't wired to the query params yet. Blocked on deciding if status filter should be multi-select or single — leaning single for now.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: tasksId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        title: "Prep for Tanvi Shah intro call (June 3)",
        status: "todo",
        area: "sales",
        due_date: "2025-06-03",
        notes:
          "Creative agency, 8 people. Research her agency before the call. Prepare the 'what does your Monday morning look like now' opener. Have the GrowFast Monday brief example ready to show.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: tasksId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        title: "Write CONTEXT.md template for consulting firms",
        status: "todo",
        area: "onboarding",
        due_date: "2025-06-07",
        notes:
          "BlueWave and potentially Tanvi are consulting firms. A reusable CONTEXT.md template for this vertical will speed up onboarding. Sections: What the firm does, Client types, How engagements work, Team structure, Key metrics.",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: tasksId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        title: "Review prompt caching — Anthropic costs trending up",
        status: "todo",
        area: "ops",
        due_date: "2025-06-10",
        notes:
          "API spend hit ₹4K last month. With 2 design partners running weekly routines it's fine, but model the cost at 10 partners. Cache hit rate should be >60% given CONTEXT.md is stable across calls.",
      },
    },

    // --- LinkedIn Posts ---
    {
      id: `rec_${nanoid(16)}`,
      domainId: linkedInId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        title: "I built an AI that writes my Monday morning brief",
        hook: "Every Monday at 9am I open my laptop and the brief is already there.",
        content:
          "Every Monday at 9am I open my laptop and the brief is already there.\n\nIt reads my live data — open deals, overdue tasks, client check-ins due this week, how last week's LinkedIn post performed — and turns it into a clean 300-word update.\n\nI didn't prompt it this morning. I didn't copy anything from Notion. I just opened my inbox.\n\nThis is what I'm building with dpaperwork. An AI-first operating system for founders who are doing everything themselves.\n\nThe Monday brief is the product's north star moment. If that lands, everything else follows.\n\nBuilding in public. More next week.",
        status: "published",
        published_date: "2025-05-19",
        likes: 1243,
        comments: 89,
        topic: "build_in_public",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: linkedInId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        title: "My first design partner said something I didn't expect",
        hook: "I showed Arjun the Monday brief. He didn't say 'cool demo.'",
        content:
          "I showed Arjun the Monday brief. He didn't say 'cool demo.'\n\nHe said: 'This is the first time I've felt on top of everything without opening 4 tools.'\n\nThat's the sentence I'm building toward.\n\nArjun runs GrowFast, a B2B SaaS. Every Monday he was opening Notion, Linear, his CRM, and WhatsApp just to know where his business stood.\n\ndpaperwork replaced that with one inbox item. His data, his language, his priorities — synthesised by an agent that knows his business.\n\nFirst paying design partner. ₹10K/month. This is real.\n\nIf you run a small team and Mondays feel chaotic, reply or DM. I'm onboarding 3 more design partners this month.",
        status: "published",
        published_date: "2025-05-26",
        likes: 1876,
        comments: 134,
        topic: "case_study",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: linkedInId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        title: "Why I track my LinkedIn posts inside dpaperwork",
        hook: "My Chief of Staff agent told me this post was my top performer last week.",
        content:
          "My Chief of Staff agent told me this post was my top performer last week.\n\nNot because I checked LinkedIn analytics. Because I track every post in a dpaperwork domain — title, hook, status, likes, comments — and the Monday brief reads it.\n\nThis week's brief said:\n→ 'Behind the scenes post' is your top performer: 1,876 likes, 134 comments\n→ You have 1 post scheduled for Monday — the NexGen demo write-up\n→ 2 ideas in draft that haven't moved in 10 days\n\nThe agent doesn't just report. It flags. It tells me what needs attention.\n\nThis is what I mean when I say dpaperwork isn't a tool — it's an operating rhythm.\n\nAny business that creates content regularly could run this same setup.",
        status: "published",
        published_date: "2025-05-28",
        likes: 743,
        comments: 57,
        topic: "product_demo",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: linkedInId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        title: "What the Monday brief will look like for NexGen Retail",
        hook: "Vikram runs a 12-person retail ops team. His Mondays take 2 hours. I'm about to change that.",
        content:
          "Vikram runs a 12-person retail ops team. His Mondays take 2 hours — WhatsApp, Excel, email — just to know where everything stands.\n\nI'm building his demo this week.\n\nHis dpaperwork workspace will have:\n→ Stores domain (12 locations, open issues, last inspection date)\n→ Stock domain (SKUs at risk, reorder flags)\n→ Team domain (who's on shift, pending leave)\n\nThe Monday brief will read all of it and give him a 5-minute start instead of a 2-hour one.\n\nThis is why I'm not building for everyone. I'm finding the people whose Monday mornings are broken, and fixing exactly that.\n\nDemo is Thursday. Fingers crossed.",
        status: "scheduled",
        published_date: "2025-06-02",
        likes: 0,
        comments: 0,
        topic: "founder_story",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: linkedInId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        title: "The insight that changed how I think about AI for business",
        hook: "AI tools fail founders not because they're bad — but because founders don't have time to prompt them well.",
        content:
          "Draft:\n\nAI tools fail founders not because they're bad — but because founders don't have time to prompt them well.\n\nChatGPT, Gemini, Claude — they're all powerful. But using them well requires:\n→ Knowing what to ask\n→ Providing the right context\n→ Reviewing and iterating the output\n\nA founder who's context-switching 50 times a day doesn't have that bandwidth.\n\ndpaperwork solves this differently. The agent already knows your business from CONTEXT.md. It already has your data from domains. You don't prompt it — it runs on a schedule and delivers.\n\nThe insight: the most valuable AI for a founder isn't a chat interface. It's a system that runs without them.\n\n---\nAngle: contrast with 'just use ChatGPT' advice. Position dpaperwork as the structured alternative.",
        status: "draft",
        published_date: null,
        likes: 0,
        comments: 0,
        topic: "insight",
      },
    },
    {
      id: `rec_${nanoid(16)}`,
      domainId: linkedInId,
      workspaceId,
      createdByUserId: userId,
      fields: {
        title:
          "How a consulting firm's Monday brief looks different from a SaaS startup's",
        hook: "Same product. Completely different brief. That's the point.",
        content:
          "Ideas only:\n- Arjun (GrowFast SaaS): brief covers deals, tasks, LinkedIn performance\n- Priya (BlueWave Consulting): brief covers active client engagements, upcoming deliverables, team utilisation\n- Same agent, different domains, different CONTEXT.md\n- The brief reads the business it's been given\n\nKey message: dpaperwork adapts to your business, not the other way around\nFormat: side-by-side comparison of two Monday briefs (screenshots once Priya's is live)",
        status: "idea",
        published_date: null,
        likes: 0,
        comments: 0,
        topic: "case_study",
      },
    },
  ]);
}
