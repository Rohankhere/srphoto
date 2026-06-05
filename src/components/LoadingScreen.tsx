import { useEffect, useState } from "react";

interface Props {
  logoUrl?: string;
  brand?: string;
}

/**
 * Full-screen intro loader shown once per session.
 * Features: centered logo, "Loading your experience" tagline,
 * animated drones flying across, progress bar, and shimmering particles.
 */
export function LoadingScreen({ logoUrl, brand = "S. R. Photo Studio" }: Props) {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("intro_seen") === "1") {
      setDone(true);
      setHidden(true);
      return;
    }

    const start = performance.now();
    const duration = 2400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(100, ((t - start) / duration) * 100);
      setProgress(p);
      if (p < 100) raf = requestAnimationFrame(tick);
      else {
        setDone(true);
        sessionStorage.setItem("intro_seen", "1");
        window.setTimeout(() => setHidden(true), 650);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ${
        done ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden={done}
    >
      {/* Star/particle field */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="absolute size-[3px] rounded-full bg-accent/40 animate-pulse"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              animationDelay: `${(i % 10) * 0.2}s`,
              animationDuration: `${2 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      {/* Drones flying across */}
      <Drone className="top-[18%] animate-drone-1" />
      <Drone className="top-[68%] animate-drone-2" reverse />
      <Drone className="top-[42%] animate-drone-3" />

      {/* Center logo + text */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <div className="relative">
          <span className="absolute inset-0 -m-6 rounded-full bg-accent/20 blur-2xl animate-pulse" />
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={brand}
              className="relative size-24 md:size-32 object-contain animate-float"
            />
          ) : (
            <span className="relative inline-flex items-center justify-center size-24 md:size-32 border-2 border-accent text-accent rounded-full animate-float">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="size-10">
                <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </span>
          )}
        </div>

        <div>
          <div className="font-serif text-2xl md:text-3xl tracking-[0.22em] uppercase text-foreground">
            {brand}
          </div>
          <div className="mt-2 text-[10px] md:text-xs uppercase tracking-[0.4em] text-accent">
            Fine Art Editorial
          </div>
        </div>

        <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
          Loading your experience
        </p>

        <div className="w-56 md:w-72 h-px bg-border overflow-hidden">
          <div
            className="h-full bg-accent transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[10px] tracking-[0.3em] text-muted-foreground tabular-nums">
          {Math.floor(progress).toString().padStart(2, "0")}%
        </div>
      </div>
    </div>
  );
}

function Drone({ className = "", reverse = false }: { className?: string; reverse?: boolean }) {
  return (
    <div className={`absolute ${reverse ? "right-0" : "left-0"} ${className} pointer-events-none`}>
      <svg
        viewBox="0 0 64 32"
        className={`w-20 md:w-28 text-accent ${reverse ? "scale-x-[-1]" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        {/* propellers */}
        <ellipse cx="10" cy="10" rx="8" ry="1.5" className="animate-spin origin-[10px_10px]" style={{ animationDuration: "0.15s" }} />
        <ellipse cx="54" cy="10" rx="8" ry="1.5" className="animate-spin origin-[54px_10px]" style={{ animationDuration: "0.15s" }} />
        {/* arms */}
        <line x1="10" y1="10" x2="24" y2="18" />
        <line x1="54" y1="10" x2="40" y2="18" />
        {/* body */}
        <rect x="24" y="14" width="16" height="8" rx="2" fill="currentColor" fillOpacity="0.15" />
        {/* camera */}
        <circle cx="32" cy="26" r="2.5" fill="currentColor" fillOpacity="0.3" />
      </svg>
    </div>
  );
}
