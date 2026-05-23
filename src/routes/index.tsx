import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchSiteSettings,
  fetchGalleries,
  fetchGalleryPhotos,
  fetchSocialLinks,
  fetchIndexEntries,
  type Gallery,
  type GalleryPhoto,
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
      <section id="works" className="px-8 py-32">
        <div className="flex justify-between items-end mb-16 max-w-7xl mx-auto">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-accent">{s.works_eyebrow ?? ""}</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-light tracking-tight">
              {s.works_title ?? ""}
            </h2>
          </div>
          <span className="hidden md:block text-[10px] uppercase tracking-widest text-muted-foreground">
            Click a cover to open
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {galleries.map((g) => (
            <Link
              key={g.id}
              to="/gallery/$slug"
              params={{ slug: g.slug }}
              className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="relative overflow-hidden aspect-[4/5] bg-muted">
                {g.cover_url && (
                  <img
                    src={g.cover_url}
                    alt={g.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                  />
                )}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
                <span className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-background bg-foreground/40 backdrop-blur-sm px-2 py-1">
                  {g.photos.length} images
                </span>
              </div>
              <div className="mt-5 flex justify-between items-baseline">
                <div>
                  <h3 className="text-lg font-medium">{g.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{g.place}</p>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {g.year}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

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
                    className="inline-flex items-center justify-center size-10 border border-border text-muted-foreground hover:text-accent hover:border-accent transition-colors"
                  >
                    <span className="text-[10px] uppercase tracking-widest">{l.label.slice(0, 2)}</span>
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
