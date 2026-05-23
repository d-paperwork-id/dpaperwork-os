## ADDED Requirements

### Requirement: usage_daily table aggregates daily token and cost usage per workspace
The system SHALL have a `usage_daily` table with `id` (text PK), `workspace_id` (text, not null), `day` (date type, YYYY-MM-DD in workspace-local timezone), `tokens_used` (integer, default 0), `llm_calls` (integer, default 0), `tool_calls` (integer, default 0), `runs` (integer, default 0), `inference_cost_inr_paise` (integer, default 0 — stored in paise, ₹1 = 100 paise), `created_at`, `updated_at`. A unique index on `(workspace_id, day)` ensures one row per workspace per calendar day.

#### Scenario: One row exists per workspace per day
- **WHEN** usage is recorded for workspace A on 2026-05-23
- **THEN** exactly one row with `workspace_id = A` and `day = '2026-05-23'` exists; subsequent writes use `UPDATE` (upsert)

#### Scenario: Cost is stored in integer paise to avoid floating-point errors
- **WHEN** inference cost is ₹40.00
- **THEN** `inference_cost_inr_paise = 4000` is stored

#### Scenario: Day reflects workspace-local calendar date, not UTC
- **WHEN** a workspace is in Asia/Kolkata (UTC+5:30) and a run completes at 23:45 UTC
- **THEN** `day` is set to the next calendar day in IST (since 23:45 UTC = 05:15 IST next day)
