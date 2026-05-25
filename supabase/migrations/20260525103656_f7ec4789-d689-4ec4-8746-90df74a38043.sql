
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  session_type text NOT NULL DEFAULT '',
  preferred_date text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT ''
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a booking"
ON public.bookings FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(name) BETWEEN 1 AND 120
  AND length(email) BETWEEN 3 AND 200
  AND length(phone) <= 50
  AND length(session_type) <= 80
  AND length(preferred_date) <= 80
  AND length(location) <= 200
  AND length(message) <= 2000
);

CREATE POLICY "Admins manage bookings"
ON public.bookings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
