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
  roleMd,
  roleMdVersions,
  domains,
  domainFields,
} from "./schema";

type Tx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

const AGENTS = ["pm", "chief-of-staff", "executive-assistant"] as const;

const DEFAULT_ROLE_CONTENT: Record<string, string> = {
  pm: `# Product Manager

You are the Product Manager agent for this workspace. Your role is to help the team build the right product.

## Responsibilities
- Draft product specifications and PRFAQs
- Synthesise user feedback into actionable insights
- Prioritise and order the product backlog
- Track feature progress across domains

## Style
Be concise and structured. Default to bullet points and numbered lists. Use data from the workspace domains when available.`,

  "chief-of-staff": `# Chief of Staff

You are the Chief of Staff agent for this workspace. Your role is to keep operations running smoothly.

## Responsibilities
- Produce weekly business summaries from domain data
- Flag stale deals, overdue tasks, or blockers
- Synthesise CONTEXT.md with live data to produce actionable briefs
- Create inbox items for the team with clear next steps

## Style
Be direct and action-oriented. Lead with the most important information. Use workspace data as your primary source of truth.`,

  "executive-assistant": `# Executive Assistant

You are the Executive Assistant agent for this workspace. Your role is to support the leadership team with scheduling, communications, and follow-ups.

## Responsibilities
- Prepare meeting briefs and agendas
- Draft follow-up emails after meetings
- Manage calendar events and scheduling
- Triage incoming emails and surface priorities

## Style
Professional, concise, and proactive. Always confirm before taking actions that affect external parties.`,
};

export async function seedWorkspace(
  tx: Tx,
  workspaceId: string,
  userId: string
): Promise<void> {
  // 1. Agent configs
    await tx.insert(workspaceAgentConfig).values(
      AGENTS.map((agentId) => ({
        workspaceId,
        agentId,
        isEnabled: true,
        allowedTools: [] as string[],
        allowedIntegrations: [] as string[],
      }))
    );

    // 2. Agent assignments for creator
    await tx.insert(userAgentAssignments).values(
      AGENTS.map((agentId) => ({
        id: `${workspaceId}_${agentId}`,
        workspaceId,
        userId,
        agentId,
      }))
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
    for (const agentId of AGENTS) {
      const content = DEFAULT_ROLE_CONTENT[agentId] ?? "";
      const versionId = `ver_${nanoid(16)}`;
      await tx.insert(roleMdVersions).values({
        id: versionId,
        workspaceId,
        agentId,
        content,
        createdByUserId: userId,
      });
      await tx.insert(roleMd).values({
        workspaceId,
        agentId,
        content,
        currentVersionId: versionId,
        updatedByUserId: userId,
      });
    }

    // 5. Default domains
    const customersId = `dom_${nanoid(16)}`;
    const dealsId = `dom_${nanoid(16)}`;
    const vendorsId = `dom_${nanoid(16)}`;
    const teamId = `dom_${nanoid(16)}`;
    const tasksId = `dom_${nanoid(16)}`;

    await tx.insert(domains).values([
      { id: customersId, workspaceId, name: "Customers", slug: "customers", icon: "users", createdByUserId: userId },
      { id: dealsId,     workspaceId, name: "Deals",     slug: "deals",     icon: "handshake", createdByUserId: userId },
      { id: vendorsId,   workspaceId, name: "Vendors",   slug: "vendors",   icon: "truck", createdByUserId: userId },
      { id: teamId,      workspaceId, name: "Team",      slug: "team",      icon: "user-check", createdByUserId: userId },
      { id: tasksId,     workspaceId, name: "Tasks",     slug: "tasks",     icon: "check-square", createdByUserId: userId },
    ]);

    // 6. Default domain fields
    await tx.insert(domainFields).values([
      // Customers
      { id: `dom_f_${nanoid(12)}`, domainId: customersId, workspaceId, name: "Name",    slug: "name",    type: "text",          position: 0, isRequired: true },
      { id: `dom_f_${nanoid(12)}`, domainId: customersId, workspaceId, name: "Email",   slug: "email",   type: "text",          position: 1 },
      { id: `dom_f_${nanoid(12)}`, domainId: customersId, workspaceId, name: "Phone",   slug: "phone",   type: "text",          position: 2 },
      { id: `dom_f_${nanoid(12)}`, domainId: customersId, workspaceId, name: "Company", slug: "company", type: "text",          position: 3 },
      { id: `dom_f_${nanoid(12)}`, domainId: customersId, workspaceId, name: "Status",  slug: "status",  type: "single_select", position: 4, options: { choices: [{ value: "active", label: "Active" }, { value: "churned", label: "Churned" }, { value: "prospect", label: "Prospect" }] } },
      { id: `dom_f_${nanoid(12)}`, domainId: customersId, workspaceId, name: "Owner",   slug: "owner",   type: "person_ref",    position: 5 },
      { id: `dom_f_${nanoid(12)}`, domainId: customersId, workspaceId, name: "Notes",   slug: "notes",   type: "long_text",     position: 6 },

      // Deals
      { id: `dom_f_${nanoid(12)}`, domainId: dealsId, workspaceId, name: "Name",                slug: "name",                type: "text",          position: 0, isRequired: true },
      { id: `dom_f_${nanoid(12)}`, domainId: dealsId, workspaceId, name: "Customer",            slug: "customer",            type: "domain_ref",    position: 1, options: { target_domain_id: customersId } },
      { id: `dom_f_${nanoid(12)}`, domainId: dealsId, workspaceId, name: "Value",               slug: "value",               type: "number",        position: 2, options: { format: "currency" } },
      { id: `dom_f_${nanoid(12)}`, domainId: dealsId, workspaceId, name: "Stage",               slug: "stage",               type: "single_select", position: 3, options: { choices: [{ value: "prospect", label: "Prospect" }, { value: "proposal", label: "Proposal" }, { value: "negotiation", label: "Negotiation" }, { value: "closed_won", label: "Closed Won" }, { value: "closed_lost", label: "Closed Lost" }] } },
      { id: `dom_f_${nanoid(12)}`, domainId: dealsId, workspaceId, name: "Owner",               slug: "owner",               type: "person_ref",    position: 4 },
      { id: `dom_f_${nanoid(12)}`, domainId: dealsId, workspaceId, name: "Expected Close Date", slug: "expected_close_date", type: "date",          position: 5 },
      { id: `dom_f_${nanoid(12)}`, domainId: dealsId, workspaceId, name: "Notes",               slug: "notes",               type: "long_text",     position: 6 },

      // Vendors
      { id: `dom_f_${nanoid(12)}`, domainId: vendorsId, workspaceId, name: "Name",              slug: "name",              type: "text",          position: 0, isRequired: true },
      { id: `dom_f_${nanoid(12)}`, domainId: vendorsId, workspaceId, name: "Category",          slug: "category",          type: "text",          position: 1 },
      { id: `dom_f_${nanoid(12)}`, domainId: vendorsId, workspaceId, name: "Contact",           slug: "contact",           type: "text",          position: 2 },
      { id: `dom_f_${nanoid(12)}`, domainId: vendorsId, workspaceId, name: "Status",            slug: "status",            type: "single_select", position: 3, options: { choices: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] } },
      { id: `dom_f_${nanoid(12)}`, domainId: vendorsId, workspaceId, name: "Contract End Date", slug: "contract_end_date", type: "date",          position: 4 },

      // Team
      { id: `dom_f_${nanoid(12)}`, domainId: teamId, workspaceId, name: "Name",       slug: "name",       type: "text",          position: 0, isRequired: true },
      { id: `dom_f_${nanoid(12)}`, domainId: teamId, workspaceId, name: "Role",       slug: "role",       type: "text",          position: 1 },
      { id: `dom_f_${nanoid(12)}`, domainId: teamId, workspaceId, name: "Manager",    slug: "manager",    type: "domain_ref",    position: 2, options: { target_domain_id: teamId } },
      { id: `dom_f_${nanoid(12)}`, domainId: teamId, workspaceId, name: "Start Date", slug: "start_date", type: "date",          position: 3 },
      { id: `dom_f_${nanoid(12)}`, domainId: teamId, workspaceId, name: "Status",     slug: "status",     type: "single_select", position: 4, options: { choices: [{ value: "active", label: "Active" }, { value: "on_leave", label: "On Leave" }, { value: "departed", label: "Departed" }] } },

      // Tasks
      { id: `dom_f_${nanoid(12)}`, domainId: tasksId, workspaceId, name: "Title",    slug: "title",    type: "text",          position: 0, isRequired: true },
      { id: `dom_f_${nanoid(12)}`, domainId: tasksId, workspaceId, name: "Status",   slug: "status",   type: "single_select", position: 1, options: { choices: [{ value: "todo", label: "To Do" }, { value: "in_progress", label: "In Progress" }, { value: "done", label: "Done" }] } },
      { id: `dom_f_${nanoid(12)}`, domainId: tasksId, workspaceId, name: "Assignee", slug: "assignee", type: "person_ref",    position: 2 },
      { id: `dom_f_${nanoid(12)}`, domainId: tasksId, workspaceId, name: "Due Date", slug: "due_date", type: "date",          position: 3 },
      { id: `dom_f_${nanoid(12)}`, domainId: tasksId, workspaceId, name: "Project",  slug: "project",  type: "text",          position: 4 },
      { id: `dom_f_${nanoid(12)}`, domainId: tasksId, workspaceId, name: "Notes",    slug: "notes",    type: "long_text",     position: 5 },
    ]);
}
