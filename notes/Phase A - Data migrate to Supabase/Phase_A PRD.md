PRD – Phase A: Circle → n8n → Supabase → Dashboard (MVP data pipe)

Section	Details

• n8n Headless‑API workflow retrieves thread messages + single messages from Circle ChatSpaces.
• n8n “Triage Issue Assistant” (Claude 3.7) flags which messages are actionable issues.

Goal now → push those triaged issues into Supabase, keep them fresh on a schedule, then surface them in the existing dashboard UI.

In‑Scope for this phase	1. DB Schema – create/update Supabase tables to store incoming issues + minimal metadata.


2. n8n → Supabase Sync – schedule (cron) or event‑triggered upserts every X hours.


3. Backend → Front‑end Feed – expose a simple endpoint / RPC (or use Supabase client directly) so the React dashboard can list these issues.
Out‑of‑Scope	• UI refinements, status change flows, Circle reply links – will be Phase B.
• Email/Slack notifications (Phase C).
• Two‑way write‑back to Circle (blocked by API).

Milestones	M1. Confirm JSON payload shape from n8n (sample).
M2. Finalize Supabase schema + migration.
M3. n8n node to upsert issues (dedupe on message_id).
M4. Supabase Row‑Level Security review.
M5. Front‑end list shows imported issues.

Deliverables	• SQL migration file (issues_from_circle.sql).
• n8n workflow export with Upsert node.
• Documentation snippet: “How the cron schedule works”.
• React component/endpoint that fetches the new table.


Acceptance Tests	
1. Given a new Circle bug message → n8n marks as issue → row appears in Supabase within < 10 min.
2. Re‑running workflow with same message_id does not duplicate.
3. Dashboard UI lists the issue (title, body, author, link).
4. RLS: internal users can read; anon cannot.
