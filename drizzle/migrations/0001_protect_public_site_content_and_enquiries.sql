DROP POLICY IF EXISTS "Public can read site_settings" ON public.site_settings;
CREATE POLICY "Public can read non-private site settings" ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key <> 'chat_transcript_email');
CREATE POLICY "Admins can read all site settings" ON public.site_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can submit an enquiry" ON public.enquiries;
GRANT INSERT ON public.enquiries TO anon, authenticated;
GRANT SELECT, DELETE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
CREATE POLICY "Anyone can submit a valid enquiry" ON public.enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(btrim(name)) BETWEEN 1 AND 100
    AND char_length(btrim(phone)) BETWEEN 1 AND 30
    AND phone ~ '^[+0-9() .-]+$'
    AND char_length(btrim(message)) BETWEEN 1 AND 1000
  );