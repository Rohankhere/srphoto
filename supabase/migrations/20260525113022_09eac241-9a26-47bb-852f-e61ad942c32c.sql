
CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  visitor_name text NOT NULL DEFAULT '',
  visitor_email text NOT NULL DEFAULT '',
  last_emailed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id, created_at);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create chat session" ON public.chat_sessions
  FOR INSERT TO anon, authenticated WITH CHECK (length(session_id) BETWEEN 8 AND 80);

CREATE POLICY "Anyone can update own chat session" ON public.chat_sessions
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (length(coalesce(visitor_name,'')) <= 120 AND length(coalesce(visitor_email,'')) <= 200);

CREATE POLICY "Admins read chat sessions" ON public.chat_sessions
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Admins delete chat sessions" ON public.chat_sessions
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Anyone can post chat message" ON public.chat_messages
  FOR INSERT TO anon, authenticated WITH CHECK (length(content) BETWEEN 1 AND 8000 AND length(session_id) BETWEEN 8 AND 80);

CREATE POLICY "Admins read chat messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Admins delete chat messages" ON public.chat_messages
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- recipient setting
INSERT INTO public.site_settings(key,value) VALUES ('chat_transcript_email','srphotostudio@gmail.com')
ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now();
