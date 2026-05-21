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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 px-8 py-8 flex justify-between items-baseline mix-blend-difference text-background">
        <span className="text-lg font-medium tracking-tight">{s.nav_brand ?? ""}</span>
        <div className="hidden md:flex gap-10 text-[11px] uppercase tracking-[0.2em] font-medium">
          <a href="#works" className="hover:opacity-60 transition-opacity">Works</a>
          <a href="#archive" className="hover:opacity-60 transition-opacity">Archive</a>
          <a href="#about" className="hover:opacity-60 transition-opacity">About</a>
          <Link to="/contact" className="hover:opacity-60 transition-opacity">Contact</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-screen flex flex-col justify-end p-8 pb-16">
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
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
        </div>
        <div className="max-w-4xl animate-fade-up">
          <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] leading-[1] tracking-tight text-balance mb-8 font-light">
            {s.hero_headline ?? ""}
          </h1>
          <div className="flex gap-4 items-center">
            <div className="w-12 h-px bg-foreground/30" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {s.hero_eyebrow ?? ""}
            </p>
          </div>
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

      {/* About & Contact */}
      <footer id="about" className="px-8 pt-32 pb-16">
        <div className="grid grid-cols-12 gap-8 max-w-7xl mx-auto">
          <div className="col-span-12 md:col-span-6 space-y-8">
            <p className="text-2xl md:text-3xl leading-snug font-light tracking-tight">
              {s.about_bio ?? ""}
            </p>
            {s.contact_email && (
              <div className="pt-8">
                <a
                  href={`mailto:${s.contact_email}`}
                  className="text-2xl md:text-3xl font-light underline decoration-foreground/10 underline-offset-8 hover:decoration-accent transition-all break-all"
                >
                  {s.contact_email}
                </a>
              </div>
            )}
          </div>
          <div className="col-span-12 md:col-start-9 md:col-span-4 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-12 text-[10px] uppercase tracking-widest leading-loose">
              <div className="space-y-3">
                <p className="text-accent">{s.represented_by_label ?? ""}</p>
                <p className="text-muted-foreground whitespace-pre-line">{s.represented_by ?? ""}</p>
              </div>
              <div className="space-y-3">
                <p className="text-accent">{s.clients_label ?? ""}</p>
                <p className="text-muted-foreground whitespace-pre-line">{s.clients ?? ""}</p>
              </div>
            </div>
            <div className="pt-16 flex justify-between items-end border-t border-border mt-12">
              <span className="text-[10px] opacity-40 uppercase tracking-widest">{s.copyright ?? ""}</span>
              <div className="flex gap-6">
                {(socialQ.data ?? []).map((l) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] uppercase tracking-widest hover:text-accent transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
