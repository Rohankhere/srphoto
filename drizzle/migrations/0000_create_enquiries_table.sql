CREATE TABLE public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.enquiries TO anon;
GRANT SELECT, DELETE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an enquiry"
ON public.enquiries FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Admins can read enquiries"
ON public.enquiries FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete enquiries"
ON public.enquiries FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));