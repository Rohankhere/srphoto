import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  fetchSiteSettings,
  fetchGalleries,
  fetchGalleryPhotos,
  fetchSocialLinks,
  fetchIndexEntries,
  fetchExperiences,
  fetchReviews,
  type Gallery,
  type GalleryPhoto,
  type Review,
} from "@/lib/content-queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Photographer Portfolio" },
      { name: "description", content: "Editorial and architectural photography." },
    ],
  }),
  component: Index,
});

type GalleryWithPhotos = Gallery & { photos: GalleryPhoto[] };

function Index() {
  const settings = useQuery({ queryKey: ["site_settings"], queryFn: fetchSiteSettings });
  const galleriesQ = useQuery({ queryKey: ["galleries"], queryFn: fetchGalleries });
  const photosQ = useQuery({ queryKey: ["gallery_photos"], queryFn: fetchGalleryPhotos });
  const socialQ = useQuery({ queryKey: ["social_links"], queryFn: fetchSocialLinks });
  const indexQ = useQuery({ queryKey: ["index_entries"], queryFn: fetchIndexEntries });
  const experiencesQ = useQuery({ queryKey: ["experiences"], queryFn: fetchExperiences });
  const reviewsQ = useQuery({ queryKey: ["reviews"], queryFn: fetchReviews });

  const s = settings.data ?? {};
  const galleries: GalleryWithPhotos[] = (galleriesQ.data ?? []).map((g) => ({
    ...g,
    photos: (photosQ.data ?? []).filter((p) => p.gallery_id === g.id),
  }));

  const navigate = useNavigate();
  const [ctaActive, setCtaActive] = useState(false);
  const handleCta = () => {
    if (ctaActive) return;
    setCtaActive(true);
    window.setTimeout(() => navigate({ to: "/contact" }), 650);
  };

  // Parse *word* markers in headline → italic accent words (editable from admin)
  const renderHeadline = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((p, i) =>
      p.startsWith("*") && p.endsWith("*") ? (
        <em key={i} className="italic font-normal text-accent">{p.slice(1, -1)}</em>
      ) : (
        <span key={i}>{p}</span>
      ),
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
        rel="stylesheet"
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 px-6 md:px-10 py-5 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3">
          {s.nav_logo ? (
            <img src={s.nav_logo} alt={s.nav_brand ?? "Logo"} className="size-9 object-contain" />
          ) : (
            <span className="inline-flex items-center justify-center size-9 border border-accent/60 text-accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
                <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </span>
          )}
          <div className="leading-tight">
            <div className="font-serif text-lg tracking-[0.18em] uppercase">{s.nav_brand ?? "Studio"}</div>
            <div className="text-[9px] tracking-[0.28em] uppercase text-muted-foreground">{s.hero_eyebrow ?? "Fine Art Editorial"}</div>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-8 text-[11px] uppercase tracking-[0.22em] font-medium">
          <a href="#works" className="text-accent border-b border-accent pb-1">Showcase</a>
          <a href="#works" className="hover:text-accent transition-colors">Portfolio</a>
          <a href="#about" className="hover:text-accent transition-colors">Story</a>
          <a href="#archive" className="hover:text-accent transition-colors">Archive</a>
          <Link to="/contact" className="hover:text-accent transition-colors">Contact</Link>
        </div>
        <Link
          to="/contact"
          className="hidden md:inline-flex items-center gap-2 bg-accent text-background px-5 py-3 text-[11px] uppercase tracking-[0.22em] font-semibold hover:brightness-110 transition"
        >
          Book Session
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 md:px-10 pt-32 pb-20">
        <div className="absolute inset-0 -z-10">
          {s.hero_image && (
            <img
              src={s.hero_image}
              alt="Hero"
              width={1920}
              height={1280}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/10 to-background" />
        </div>

        {s.hero_portrait && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-full md:w-[55%] lg:w-[48%] -z-[5] overflow-hidden">
            <img
              src={s.hero_portrait}
              alt=""
              className="w-full h-full object-cover object-center opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        )}

        <div className="max-w-4xl animate-fade-up">
          <div className="inline-flex items-center gap-2 border border-accent/40 bg-accent/5 px-4 py-2 mb-10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5 text-accent">
              <circle cx="12" cy="9" r="5" />
              <path d="M9 14l-2 7 5-3 5 3-2-7" />
            </svg>
            <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-semibold">
              {s.hero_eyebrow ?? "Est. Studio"}
            </span>
          </div>

          <h1 className="font-serif text-[clamp(2.75rem,7.5vw,6rem)] leading-[1.02] tracking-tight text-balance mb-10 font-normal">
            {renderHeadline(s.hero_headline ?? "Capturing the *Infinite Beauty* of Your Most Precious Moments.")}
          </h1>

          {s.about_bio && (
            <p className="max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed mb-12">
              {s.about_bio}
            </p>
          )}

          <div className="flex flex-wrap gap-4 items-center">
            <Link
              to="/contact"
              className="group inline-flex items-center gap-3 bg-accent text-background px-7 py-4 text-[11px] uppercase tracking-[0.25em] font-semibold hover:brightness-110 transition"
            >
              Book Your Session
              <span className="transition-transform group-hover:translate-x-1">↳</span>
            </Link>
            <a
              href="#works"
              className="inline-flex items-center gap-3 border border-foreground/30 text-foreground px-7 py-4 text-[11px] uppercase tracking-[0.25em] font-semibold hover:border-accent hover:text-accent transition"
            >
              Explore Portfolio
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 right-6 md:right-10 text-[10px] uppercase tracking-[0.25em] text-muted-foreground hidden md:block">
          Global Coverage
        </div>
      </section>


      {/* Works — gallery grid */}
      <WorksSection
        galleries={galleries}
        eyebrow={s.works_eyebrow}
        title={s.works_title}
      />


      {/* Full Index */}
      <section id="archive" className="px-8 py-24 bg-foreground text-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <h3 className="text-3xl md:text-4xl font-light">{s.archive_title ?? ""}</h3>
            <span className="text-[10px] tracking-widest opacity-50 uppercase">
              {s.archive_caption ?? ""}
            </span>
          </div>
          <div className="border-t border-background/10">
            {(indexQ.data ?? []).map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-12 py-6 border-b border-background/10 group cursor-pointer hover:bg-background/5 transition-colors"
              >
                <span className="col-span-2 md:col-span-1 text-[10px] self-center opacity-40">
                  {e.number}
                </span>
                <span className="col-span-10 md:col-span-5 text-xl md:text-2xl font-light">
                  {e.title}
                </span>
                <span className="hidden md:flex col-span-3 text-[10px] self-center opacity-40 uppercase tracking-widest">
                  {e.place}
                </span>
                <span className="hidden md:flex col-span-3 justify-end text-[10px] self-center opacity-40 uppercase tracking-widest">
                  {e.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience / Projects */}
      <section id="experience" className="px-6 md:px-10 py-32 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-[10px] uppercase tracking-[0.25em] text-accent">
              {s.experience_eyebrow ?? "Chronicle"}
            </span>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl font-normal tracking-tight">
              {s.experience_title ?? "Projects & Experience"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(experiencesQ.data ?? []).map((x) => (
              <div
                key={x.id}
                className="border border-border p-8 hover:border-accent/60 transition-colors group"
              >
                <div className="flex justify-between items-baseline mb-3">
                  <h3 className="font-serif text-2xl">{x.title}</h3>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-accent">
                    {x.year}
                  </span>
                </div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
                  {x.role}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {x.description}
                </p>
              </div>
            ))}
            {(experiencesQ.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full">
                No experience entries yet — add some from the admin panel.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Reviews — flowing marquee */}
      <ReviewsSection reviews={reviewsQ.data ?? []} eyebrow={s.reviews_eyebrow} title={s.reviews_title} />

      {/* Contact CTA */}
      <section className="px-6 md:px-8 py-32 bg-background border-t border-border">

        <div className="max-w-5xl mx-auto text-center">
          <span className="text-[10px] uppercase tracking-[0.25em] text-accent">
            Ready to create
          </span>
          <h3 className="mt-4 text-3xl md:text-5xl font-light tracking-tight">
            Have a project in mind?
          </h3>
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleCta}
              aria-label="Contact us"
              className={`group relative overflow-hidden rounded-full px-12 md:px-20 py-6 md:py-8 bg-foreground text-background text-lg md:text-2xl font-light tracking-wide uppercase transition-all duration-300 hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                ctaActive ? "scale-95" : ""
              }`}
            >
              <span
                className={`absolute inset-0 rounded-full bg-accent transition-transform duration-700 ease-out origin-center ${
                  ctaActive ? "scale-[20]" : "scale-0"
                }`}
                aria-hidden
              />
              <span
                className={`absolute inset-0 rounded-full border border-background/20 ${
                  ctaActive ? "animate-ping" : ""
                }`}
                aria-hidden
              />
              <span className="relative z-10 flex items-center gap-3">
                Contact Us
                <span
                  className={`inline-block transition-transform duration-500 ${
                    ctaActive ? "translate-x-3" : "group-hover:translate-x-2"
                  }`}
                >
                  →
                </span>
              </span>
            </button>
          </div>
          <p className="mt-8 text-xs text-muted-foreground uppercase tracking-widest">
            WhatsApp · Instagram · Email
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-24 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
            {/* Brand column */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                {s.nav_logo ? (
                  <img src={s.nav_logo} alt={s.nav_brand ?? "Logo"} className="size-9 object-contain" />
                ) : (
                  <span className="inline-flex items-center justify-center size-9 border border-accent/60 text-accent">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
                      <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                  </span>
                )}
                <span className="font-serif text-lg tracking-[0.22em] uppercase">
                  {s.nav_brand ?? "Studio"}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-sm whitespace-pre-line">
                {s.about_bio ?? ""}
              </p>
              <div className="flex gap-3 mt-8">
                {(socialQ.data ?? []).map((l) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={l.label}
                    title={l.label}
                    className="inline-flex items-center justify-center size-10 border border-border text-muted-foreground hover:text-accent hover:border-accent transition-colors overflow-hidden"
                  >
                    {l.icon_url ? (
                      <img src={l.icon_url} alt={l.label} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest">{l.label.slice(0, 2)}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>

            {/* Studio Destinations */}
            <div>
              <h4 className="font-serif text-lg tracking-[0.22em] uppercase mb-8">
                {s.represented_by_label ?? "Studio Destinations"}
              </h4>
              <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {s.represented_by ?? ""}
              </div>
            </div>

            {/* Concierge Desk */}
            <div>
              <h4 className="gap-3 mt-8 flex items-start justify-start">
                {s.clients_label ?? "​IN"}
              </h4>
              {s.contact_email && (
                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                    Enquiry Channels
                  </p>
                  <a
                    href={`mailto:${s.contact_email}`}
                    className="inline-flex items-center gap-2 text-sm text-accent hover:brightness-110 transition"
                  >
                    <span>✉</span> {s.contact_email}
                  </a>
                </div>
              )}
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                {s.clients ?? ""}
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {s.copyright ?? ""}
            </span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-foreground hover:text-accent transition-colors"
            >
              Re-ascend to Sky <span>↑</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="text-accent text-sm tracking-widest">
      {"★".repeat(Math.max(0, Math.min(5, n)))}
      <span className="text-muted-foreground/40">{"★".repeat(5 - Math.max(0, Math.min(5, n)))}</span>
    </span>
  );
}

function ReviewsSection({
  reviews,
  eyebrow,
  title,
}: {
  reviews: Review[];
  eyebrow?: string;
  title?: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState<Review | null>(null);
  const [form, setForm] = useState({ name: "", message: "", rating: 5 });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Please fill in your name and review");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      name: form.name.trim(),
      message: form.message.trim(),
      rating: form.rating,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Thank you for your review!");
    setForm({ name: "", message: "", rating: 5 });
    qc.invalidateQueries({ queryKey: ["reviews"] });
  };

  // Duplicate list for seamless marquee loop
  const loop = reviews.length > 0 ? [...reviews, ...reviews] : [];

  return (
    <section id="reviews" className="py-32 bg-foreground/[0.02] border-t border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10 mb-12">
        <span className="text-[10px] uppercase tracking-[0.25em] text-accent">
          {eyebrow ?? "Voices"}
        </span>
        <h2 className="mt-4 font-serif text-4xl md:text-5xl font-normal tracking-tight">
          {title ?? "What clients say"}
        </h2>
      </div>

      {reviews.length > 0 ? (
        <div className="marquee-pause relative">
          <div className="flex gap-6 w-max animate-marquee">
            {loop.map((r, i) => (
              <button
                key={`${r.id}-${i}`}
                onClick={() => setOpen(r)}
                className="text-left w-[320px] md:w-[380px] shrink-0 border border-border bg-background p-7 hover:border-accent/60 hover:-translate-y-1 transition-all"
              >
                <Stars n={r.rating} />
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground line-clamp-4">
                  “{r.message}”
                </p>
                <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                  <span className="font-serif text-base">{r.name}</span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-accent">
                    Read →
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Be the first to leave a review.
        </p>
      )}

      {/* Submit form */}
      <div className="max-w-2xl mx-auto px-6 md:px-10 mt-20">
        <h3 className="font-serif text-2xl mb-6 text-center">Leave a review</h3>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            maxLength={80}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
          />
          <textarea
            placeholder="Your experience…"
            rows={4}
            value={form.message}
            maxLength={2000}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Rating
              </span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rating: n }))}
                  className={`text-xl ${
                    n <= form.rating ? "text-accent" : "text-muted-foreground/40"
                  } hover:text-accent transition-colors`}
                  aria-label={`${n} stars`}
                >
                  ★
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={busy}
              className="bg-accent text-background px-6 py-3 text-[11px] uppercase tracking-[0.22em] font-semibold hover:brightness-110 transition disabled:opacity-50"
            >
              {busy ? "Sending…" : "Submit Review"}
            </button>
          </div>
        </form>
      </div>

      {/* Read-full modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-up"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-background border border-accent/40 max-w-xl w-full p-10 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-accent text-xl"
              aria-label="Close"
            >
              ✕
            </button>
            <Stars n={open.rating} />
            <p className="mt-6 font-serif text-xl md:text-2xl leading-relaxed whitespace-pre-line">
              “{open.message}”
            </p>
            <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
              <span className="font-serif text-lg">— {open.name}</span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {new Date(open.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
