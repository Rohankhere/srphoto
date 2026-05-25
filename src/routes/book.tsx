import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Session — Reserve Your Date" },
      { name: "description", content: "Reserve your photography session. Share your details and we'll be in touch within 24 hours." },
      { property: "og:title", content: "Book a Session" },
      { property: "og:description", content: "Reserve your photography session." },
    ],
  }),
  component: BookPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  email: z.string().trim().email("Invalid email").max(200),
  phone: z.string().trim().max(50),
  session_type: z.string().trim().max(80),
  preferred_date: z.string().trim().max(80),
  location: z.string().trim().max(200),
  message: z.string().trim().max(2000),
});

const SESSION_TYPES = [
  "Wedding",
  "Engagement",
  "Maternity",
  "Family",
  "Portrait",
  "Editorial",
  "Event",
  "Other",
];

function BookPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    session_type: "",
    preferred_date: "",
    location: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit. Please try again.");
      return;
    }
    setDone(true);
    toast.success("Booking request received");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-between px-6 md:px-10 py-6 border-b border-border/40">
        <Link to="/" className="font-serif text-xl tracking-tight">
          <span className="text-accent">●</span> Studio
        </Link>
        <Link to="/" className="text-[11px] uppercase tracking-[0.25em] hover:text-accent transition-colors">
          ← Back
        </Link>
      </nav>

      <section className="px-6 md:px-10 py-16 md:py-24 max-w-3xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 border border-accent/40 bg-accent/5 px-4 py-2 mb-6">
            <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-semibold">Reserve Your Date</span>
          </div>
          <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-tight mb-4">
            Book Your <span className="italic text-accent">Session</span>
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Share a few details and we'll get back to you within 24 hours to confirm availability and next steps.
          </p>
        </div>

        {done ? (
          <div className="border border-accent/40 bg-accent/5 p-10 text-center">
            <div className="font-serif text-2xl mb-3">Thank you — your request is in.</div>
            <p className="text-muted-foreground mb-6">We'll reach out shortly to confirm your booking.</p>
            <Link to="/" className="inline-flex items-center gap-2 bg-accent text-background px-6 py-3 text-[11px] uppercase tracking-[0.25em] font-semibold hover:brightness-110 transition">
              Return Home
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Field label="Full Name *">
                <input required value={form.name} onChange={update("name")} className={inputCls} placeholder="Jane Doe" />
              </Field>
              <Field label="Email *">
                <input required type="email" value={form.email} onChange={update("email")} className={inputCls} placeholder="you@email.com" />
              </Field>
              <Field label="Phone">
                <input value={form.phone} onChange={update("phone")} className={inputCls} placeholder="+1 555 000 0000" />
              </Field>
              <Field label="Session Type">
                <select value={form.session_type} onChange={update("session_type")} className={inputCls}>
                  <option value="">Select…</option>
                  {SESSION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Preferred Date">
                <input type="date" value={form.preferred_date} onChange={update("preferred_date")} className={inputCls} />
              </Field>
              <Field label="Location">
                <input value={form.location} onChange={update("location")} className={inputCls} placeholder="City / Venue" />
              </Field>
            </div>
            <Field label="Tell us about your vision">
              <textarea rows={5} value={form.message} onChange={update("message")} className={inputCls} placeholder="Anything we should know…" />
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex items-center justify-center gap-3 bg-accent text-background px-8 py-4 text-[11px] uppercase tracking-[0.25em] font-semibold hover:brightness-110 transition disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Booking Request"}
              <span className="transition-transform group-hover:translate-x-1">↳</span>
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

const inputCls =
  "w-full bg-transparent border border-border/60 px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2 font-semibold">{label}</span>
      {children}
    </label>
  );
}
