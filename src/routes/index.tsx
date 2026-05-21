import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
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

  const [openGallery, setOpenGallery] = useState<GalleryWithPhotos | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const open = (g: GalleryWithPhotos) => {
    setOpenGallery(g);
    setActiveIndex(0);
  };
  const close = () => setOpenGallery(null);

  useEffect(() => {
    if (!openGallery) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight")
        setActiveIndex((i) => (i + 1) % openGallery.photos.length);
      if (e.key === "ArrowLeft")
        setActiveIndex(
          (i) => (i - 1 + openGallery.photos.length) % openGallery.photos.length,
        );
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [openGallery]);

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
          <a href="#about" className="hover:opacity-60 transition-opacity">Contact</a>
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
            <button
              key={g.id}
              onClick={() => open(g)}
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
            </button>
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

      {/* Gallery Lightbox */}
      {openGallery && (
        <GalleryLightbox
          gallery={openGallery}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          onClose={close}
        />
      )}
    </div>
  );
}

function GalleryLightbox({
  gallery,
  activeIndex,
  setActiveIndex,
  onClose,
}: {
  gallery: GalleryWithPhotos;
  activeIndex: number;
  setActiveIndex: (n: number) => void;
  onClose: () => void;
}) {
  const total = gallery.photos.length;
  const active = gallery.photos[activeIndex];
  if (!active) return null;
  const prev = () => setActiveIndex((activeIndex - 1 + total) % total);
  const next = () => setActiveIndex((activeIndex + 1) % total);

  return (
    <div
      className="fixed inset-0 z-50 bg-background animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-label={gallery.title}
    >
      <div className="flex justify-between items-center px-6 md:px-8 h-16 border-b border-border">
        <div className="min-w-0">
          <h3 className="text-sm md:text-base font-medium truncate">{gallery.title}</h3>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {gallery.place} · {gallery.year}
          </p>
        </div>
        <button onClick={onClose} aria-label="Close gallery" className="p-2 -mr-2 hover:text-accent transition-colors">
          <X className="size-5" />
        </button>
      </div>

      <div className="relative h-[calc(100vh-4rem-7rem)] md:h-[calc(100vh-4rem-8rem)] flex items-center justify-center px-4 md:px-16 bg-muted/40">
        <img
          key={active.id}
          src={active.url}
          alt={active.caption}
          className="max-h-full max-w-full object-contain animate-fade-up"
        />
        {total > 1 && (
          <>
            <button onClick={prev} aria-label="Previous image" className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/70 backdrop-blur hover:bg-background transition-colors">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={next} aria-label="Next image" className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/70 backdrop-blur hover:bg-background transition-colors">
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      <div className="h-28 md:h-32 border-t border-border px-6 md:px-8 py-4 flex items-center gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
          <p className="mt-1 text-sm truncate">{active.caption}</p>
        </div>
        <div className="hidden sm:flex gap-2 overflow-x-auto">
          {gallery.photos.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1}`}
              className={`shrink-0 h-16 w-16 overflow-hidden border transition-all ${
                i === activeIndex ? "border-accent opacity-100" : "border-transparent opacity-50 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
