import { useState } from "react";
import { Link } from "@tanstack/react-router";

type SiteBrandProps = {
  logoUrl?: string;
  brand?: string;
  tagline?: string;
  className?: string;
  logoClassName?: string;
};

export function SiteBrand({
  logoUrl,
  brand = "SR Photo Studio",
  tagline,
  className = "",
  logoClassName = "size-10",
}: SiteBrandProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      to="/"
      aria-label={`${brand} — home`}
      className={`group inline-flex min-w-0 items-center gap-3 text-foreground transition-colors hover:text-accent ${className}`}
    >
      <span className={`relative inline-flex shrink-0 items-center justify-center ${logoClassName}`}>
        {logoUrl && !imageFailed ? (
          <img
            src={logoUrl}
            alt=""
            className="size-full object-contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="inline-flex size-full items-center justify-center border border-accent/60 text-accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-1/2">
              <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </span>
        )}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-serif text-base uppercase tracking-[0.14em] sm:text-lg">
          {brand}
        </span>
        {tagline && (
          <span className="mt-1 block truncate text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            {tagline}
          </span>
        )}
      </span>
    </Link>
  );
}