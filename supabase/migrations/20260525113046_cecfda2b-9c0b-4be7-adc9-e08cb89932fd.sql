DROP POLICY IF EXISTS "Anyone can update own chat session" ON public.chat_sessions;
CREATE POLICY "Admins update chat sessions" ON public.chat_sessions
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));