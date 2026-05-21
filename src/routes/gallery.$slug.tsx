import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import {
  fetchGalleries,
  fetchGalleryPhotos,
  type Gallery,
  type GalleryPhoto,
} from "@/lib/content-queries";

export const Route = createFileRoute("/gallery/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Gallery — ${params.slug}` },
      { name: "description", content: "Photo gallery" },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { slug } = Route.useParams();
  const galleriesQ = useQuery({ queryKey: ["galleries"], queryFn: fetchGalleries });
  const photosQ = useQuery({ queryKey: ["gallery_photos"], queryFn: fetchGalleryPhotos });

  const gallery: Gallery | undefined = (galleriesQ.data ?? []).find((g) => g.slug === slug);
  const photos: GalleryPhoto[] = (photosQ.data ?? []).filter(
    (p) => gallery && p.gallery_id === gallery.id,
  );

  if (galleriesQ.isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading…</div>;
  }
  if (!gallery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Gallery not found.</p>
        <Link to="/" className="text-[10px] uppercase tracking-widest underline">Back home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border px-6 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] hover:text-accent transition-colors">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {photos.length} images
        </div>
      </nav>

      <header className="px-6 md:px-8 pt-20 pb-16 max-w-5xl mx-auto">
        <span className="text-[10px] uppercase tracking-[0.25em] text-accent">
          {gallery.place} {gallery.year && `· ${gallery.year}`}
        </span>
        <h1 className="mt-4 text-4xl md:text-6xl font-light tracking-tight">{gallery.title}</h1>
        {gallery.description && (
          <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
            {gallery.description}
          </p>
        )}
      </header>

      <section className="px-6 md:px-8 pb-32 max-w-7xl mx-auto">
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-24">No photos in this gallery yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {photos.map((p, i) => (
              <figure key={p.id} className="group">
                <div className="relative overflow-hidden aspect-[4/5] bg-muted">
                  <img
                    src={p.url}
                    alt={p.caption || `${gallery.title} ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <figcaption className="mt-3 flex gap-4">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0 pt-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {p.caption || <span className="text-muted-foreground italic">No description</span>}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
