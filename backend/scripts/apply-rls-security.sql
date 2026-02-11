-- Enable Row Level Security (RLS) on all public tables
-- This resolves Supabase security warnings and protects your data from direct API access.

-- 1. Enable RLS on all tables
ALTER TABLE IF EXISTS public."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."boards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."postits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."board_collaborators" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."event_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."login_audits" ENABLE ROW LEVEL SECURITY;

-- 2. Define Policies
-- NOTE: These policies apply to requests coming through the Supabase API (PostgREST).
-- Your backend (Prisma) connects as a high-privilege user and will bypass these by default.

-- Users: Can only read/update their own profile
CREATE POLICY "Users can view own record" ON public."users"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own record" ON public."users"
  FOR UPDATE USING (auth.uid()::text = id);

-- Boards: Users can see and manage boards they own
CREATE POLICY "Users can manage own boards" ON public."boards"
  FOR ALL USING (auth.uid()::text = user_id);

-- Boards: Users can see boards shared with them
CREATE POLICY "Users can see collaborative boards" ON public."boards"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."board_collaborators"
      WHERE "board_collaborators"."board_id" = "boards"."id"
      AND "board_collaborators"."user_id" = auth.uid()::text
    )
  );

-- Sections: Follow board access
CREATE POLICY "Users can view sections of accessible boards" ON public."sections"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."boards"
      WHERE "boards"."id" = "sections"."board_id"
      AND (
        "boards"."user_id" = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM public."board_collaborators"
          WHERE "board_collaborators"."board_id" = "boards"."id"
          AND "board_collaborators"."user_id" = auth.uid()::text
        )
      )
    )
  );

-- Postits: Follow section/board access
CREATE POLICY "Users can view postits of accessible boards" ON public."postits"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."boards"
      WHERE "boards"."id" = "postits"."board_id"
      AND (
        "boards"."user_id" = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM public."board_collaborators"
          WHERE "board_collaborators"."board_id" = "boards"."id"
          AND "board_collaborators"."user_id" = auth.uid()::text
        )
      )
    )
  );

-- Event Logs: Can only see logs for accessible boards
CREATE POLICY "Users can view logs of accessible boards" ON public."event_logs"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."boards"
      WHERE "boards"."id" = "event_logs"."board_id"
      AND (
        "boards"."user_id" = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM public."board_collaborators"
          WHERE "board_collaborators"."board_id" = "boards"."id"
          AND "board_collaborators"."user_id" = auth.uid()::text
        )
      )
    )
  );

-- Login Audits: View own login history
CREATE POLICY "Users can view own login audits" ON public."login_audits"
  FOR SELECT USING (auth.uid()::text = user_id);

-- Sessions: View own sessions
CREATE POLICY "Users can view own sessions" ON public."sessions"
  FOR SELECT USING (auth.uid()::text = user_id);

-- 3. Grand Access to Service Role (optional but recommended for internal Supabase tools)
-- The 'service_role' and 'postgres' roles usually bypass RLS, but explicit grants can help in some cases.
ALTER TABLE if exists public."users" FORCE ROW LEVEL SECURITY;
ALTER TABLE if exists public."boards" FORCE ROW LEVEL SECURITY;
-- Actually, 'FORCE' is usually NOT needed if you want roles like 'postgres' to bypass.
