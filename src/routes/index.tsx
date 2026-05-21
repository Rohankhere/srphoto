import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import plate042 from "@/assets/plate-042.jpg";
import plate089 from "@/assets/plate-089.jpg";
import monoliths1 from "@/assets/monoliths-1.jpg";
import monoliths2 from "@/assets/monoliths-2.jpg";
import monoliths3 from "@/assets/monoliths-3.jpg";
import glass1 from "@/assets/glass-1.jpg";
import glass2 from "@/assets/glass-2.jpg";
import glass3 from "@/assets/glass-3.jpg";
import rooms1 from "@/assets/rooms-1.jpg";
import rooms2 from "@/assets/rooms-2.jpg";
import rooms3 from "@/assets/rooms-3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elias Thorne — Photographer, Copenhagen" },
      {
        name: "description",
        content:
          "Visual artist Elias Thorne. Editorial and architectural photography exploring the quiet tension of space.",
      },
      { property: "og:title", content: "Elias Thorne — Photographer" },
      { property: "og:description", content: "Editorial and architectural photography." },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: Index,
});

type Gallery = {
  slug: string;
  title: string;
  place: string;
  year: string;
  description: string;
  cover: string;
  images: { src: string; caption: string }[];
};

const galleries: Gallery[] = [
  {
    slug: "monoliths",
    title: "Monoliths of the North",
    place: "Copenhagen, DK",
    year: "2024",
    description:
      "An ongoing study of Brutalist architecture across Scandinavia — raw concrete in dialogue with the changing Baltic light.",
    cover: plate042,
    images: [
      { src: plate042, caption: "Plate 042 — South Facade, morning" },
      { src: monoliths1, caption: "Plate 043 — Cantilever, dusk" },
      { src: monoliths2, caption: "Plate 044 — Stair void, midday" },
      { src: monoliths3, caption: "Plate 045 — Aperture study" },
    ],
  },
  {
    slug: "glass-hour",
    title: "The Glass Hour",
    place: "Studio Series",
    year: "2023",
    description:
      "Refractions, surface tension, and the distortion of time through liquid interfaces. A macro-study on temporary states.",
    cover: plate089,
    images: [
      { src: plate089, caption: "Plate 089 — Ripple" },
      { src: glass1, caption: "Plate 091 — Amber suspension" },
      { src: glass2, caption: "Plate 093 — Vessel, caustics" },
      { src: glass3, caption: "Plate 095 — Bottle, still" },
    ],
  },
  {
    slug: "quiet-rooms",
    title: "Quiet Rooms",
    place: "Kyoto, JP",
    year: "2022",
    description:
      "Empty interiors held by paper and timber. A meditation on the architecture of pause.",
    cover: rooms1,
    images: [
      { src: rooms1, caption: "Room 01 — Tatami, afternoon" },
      { src: rooms2, caption: "Room 02 — Corridor light" },
      { src: rooms3, caption: "Room 03 — Cup by window" },
    ],
  },
];

const indexEntries = [
  { n: "01", title: "Faded Interiors", place: "Paris, FR", note: "Published Cereal Vol. 22" },
  { n: "02", title: "Dust & Bone", place: "Marfa, US", note: "Exhibited at Tate" },
  { n: "03", title: "Submerged", place: "Iceland", note: "Private Collection" },
  { n: "04", title: "The Long Hour", place: "Faroe Islands", note: "Personal Series" },
  { n: "05", title: "Quiet Rooms", place: "Kyoto, JP", note: "Phaidon Monograph" },
];

function Index() {
  const [openGallery, setOpenGallery] = useState<Gallery | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const open = (g: Gallery) => {
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
        setActiveIndex((i) => (i + 1) % openGallery.images.length);
      if (e.key === "ArrowLeft")
        setActiveIndex(
          (i) => (i - 1 + openGallery.images.length) % openGallery.images.length,
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
        <span className="text-lg font-medium tracking-tight">Elias Thorne</span>
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
          <img
            src={heroImg}
            alt="Misty Nordic coastline at dawn"
            width={1920}
            height={1280}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
        </div>
        <div className="max-w-4xl animate-fade-up">
          <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] leading-[1] tracking-tight text-balance mb-8 font-light">
            Capturing the quiet tension of space.
          </h1>
          <div className="flex gap-4 items-center">
            <div className="w-12 h-px bg-foreground/30" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Series 01 — Nordic Silence
            </p>
          </div>
        </div>
      </section>

      {/* Works — gallery grid */}
      <section id="works" className="px-8 py-32">
        <div className="flex justify-between items-end mb-16 max-w-7xl mx-auto">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-accent">Selected Works</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-light tracking-tight">
              Galleries
            </h2>
          </div>
          <span className="hidden md:block text-[10px] uppercase tracking-widest text-muted-foreground">
            Click a cover to open
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {galleries.map((g) => (
            <button
              key={g.slug}
              onClick={() => open(g)}
              className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="relative overflow-hidden aspect-[4/5] bg-muted">
                <img
                  src={g.cover}
                  alt={g.title}
                  loading="lazy"
                  width={1200}
                  height={1500}
                  className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
                <span className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-background bg-foreground/40 backdrop-blur-sm px-2 py-1">
                  {g.images.length} images
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
            <h3 className="text-3xl md:text-4xl font-light">Full Index</h3>
            <span className="text-[10px] tracking-widest opacity-50 uppercase">
              Records 2018—2024
            </span>
          </div>
          <div className="border-t border-background/10">
            {indexEntries.map((e) => (
              <div
                key={e.n}
                className="grid grid-cols-12 py-6 border-b border-background/10 group cursor-pointer hover:bg-background/5 transition-colors"
              >
                <span className="col-span-2 md:col-span-1 text-[10px] self-center opacity-40">
                  {e.n}
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
              Elias Thorne is a visual artist based in Copenhagen. His work explores the intersection of man-made structures and the relentless patience of nature.
            </p>
            <div className="pt-8">
              <a
                href="mailto:studio@eliasthorne.com"
                className="text-2xl md:text-3xl font-light underline decoration-foreground/10 underline-offset-8 hover:decoration-accent transition-all break-all"
              >
                studio@eliasthorne.com
              </a>
            </div>
          </div>
          <div className="col-span-12 md:col-start-9 md:col-span-4 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-12 text-[10px] uppercase tracking-widest leading-loose">
              <div className="space-y-3">
                <p className="text-accent">Represented by</p>
                <p className="text-muted-foreground">Galleri Lumina<br />Stockholm, SE</p>
              </div>
              <div className="space-y-3">
                <p className="text-accent">Clients</p>
                <p className="text-muted-foreground">Kinfolk<br />The Row<br />Arket<br />Phaidon</p>
              </div>
            </div>
            <div className="pt-16 flex justify-between items-end border-t border-border mt-12">
              <span className="text-[10px] opacity-40 uppercase tracking-widest">© 2024 Thorne Studio</span>
              <div className="flex gap-6">
                <a href="#" className="text-[10px] uppercase tracking-widest hover:text-accent transition-colors">Instagram</a>
                <a href="#" className="text-[10px] uppercase tracking-widest hover:text-accent transition-colors">Archive</a>
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
  gallery: Gallery;
  activeIndex: number;
  setActiveIndex: (n: number) => void;
  onClose: () => void;
}) {
  const total = gallery.images.length;
  const active = gallery.images[activeIndex];
  const prev = () => setActiveIndex((activeIndex - 1 + total) % total);
  const next = () => setActiveIndex((activeIndex + 1) % total);

  return (
    <div
      className="fixed inset-0 z-50 bg-background animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-label={gallery.title}
    >
      {/* Top bar */}
      <div className="flex justify-between items-center px-6 md:px-8 h-16 border-b border-border">
        <div className="min-w-0">
          <h3 className="text-sm md:text-base font-medium truncate">{gallery.title}</h3>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {gallery.place} · {gallery.year}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close gallery"
          className="p-2 -mr-2 hover:text-accent transition-colors"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Main image */}
      <div className="relative h-[calc(100vh-4rem-7rem)] md:h-[calc(100vh-4rem-8rem)] flex items-center justify-center px-4 md:px-16 bg-muted/40">
        <img
          key={active.src}
          src={active.src}
          alt={active.caption}
          className="max-h-full max-w-full object-contain animate-fade-up"
        />
        {total > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/70 backdrop-blur hover:bg-background transition-colors"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/70 backdrop-blur hover:bg-background transition-colors"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* Caption + thumbnails */}
      <div className="h-28 md:h-32 border-t border-border px-6 md:px-8 py-4 flex items-center gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
          <p className="mt-1 text-sm truncate">{active.caption}</p>
        </div>
        <div className="hidden sm:flex gap-2 overflow-x-auto">
          {gallery.images.map((img, i) => (
            <button
              key={img.src}
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1}`}
              className={`shrink-0 h-16 w-16 overflow-hidden border transition-all ${
                i === activeIndex
                  ? "border-accent opacity-100"
                  : "border-transparent opacity-50 hover:opacity-100"
              }`}
            >
              <img src={img.src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
