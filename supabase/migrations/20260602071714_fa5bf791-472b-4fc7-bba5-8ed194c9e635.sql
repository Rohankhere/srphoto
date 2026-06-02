
-- 1. Explicit admin-only SELECT policy on bookings for defence-in-depth
CREATE POLICY "Admins can read bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Restrict chat_messages inserts to sessions that exist in chat_sessions.
--    This prevents enumeration-only injection: a session row must be created
--    first (which the legitimate widget always does via upsert from the API).
DROP POLICY IF EXISTS "Anyone can post chat message" ON public.chat_messages;
CREATE POLICY "Anyone can post chat message"
ON public.chat_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(content) >= 1
  AND length(content) <= 8000
  AND length(session_id) >= 8
  AND length(session_id) <= 80
  AND EXISTS (SELECT 1 FROM public.chat_sessions s WHERE s.session_id = chat_messages.session_id)
);

-- 3. Lock down has_role SECURITY DEFINER function from direct API execution.
--    It is still callable from RLS policies (which run as the policy owner).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- 4. Restrict gallery bucket listing to admins only.
--    Public file URLs continue to work (public bucket), but the API can no
--    longer enumerate all object keys.
DROP POLICY IF EXISTS "Public can read gallery bucket" ON storage.objects;
CREATE POLICY "Admins can list gallery bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::app_role));
