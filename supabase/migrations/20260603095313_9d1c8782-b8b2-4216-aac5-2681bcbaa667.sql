DROP POLICY IF EXISTS "Anyone can post chat message" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can create chat session" ON public.chat_sessions;
REVOKE INSERT ON public.chat_messages FROM anon;
REVOKE INSERT ON public.chat_sessions FROM anon;