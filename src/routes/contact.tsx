import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Instagram, Mail } from "lucide-react";
import { fetchSiteSettings } from "@/lib/content-queries";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact" },
      { name: "description", content: "Get in touch — WhatsApp, Instagram, or email." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data } = useQuery({ queryKey: ["site_settings"], queryFn: fetchSiteSettings });
  const s = data ?? {};

  const wppNumber = (s.whatsapp_number ?? "").replace(/\D/g, "");
  const wppMessage = s.whatsapp_message ?? "Hi! I'd love to discuss a project with you.";
  const wppHref = wppNumber
    ? `https://wa.me/${wppNumber}?text=${encodeURIComponent(wppMessage)}`
    : "";

  const igHref = s.instagram_url ?? "";

  const email = s.contact_email ?? "";
  const subject = s.chat_subject ?? "New inquiry";
  const chatMessage = s.chat_message ?? "Hello,\n\nI'd like to get in touch about…";
  const mailHref = email
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(chatMessage)}`
    : "";

  const options = [
    {
      key: "wa",
      label: "WhatsApp",
      sub: wppNumber ? `+${wppNumber}` : "Not configured",
      Icon: MessageCircle,
      href: wppHref,
      disabled: !wppHref,
      external: true,
    },
    {
      key: "ig",
      label: "Instagram",
      sub: s.instagram_handle || (igHref ? "Open profile" : "Not configured"),
      Icon: Instagram,
      href: igHref,
      disabled: !igHref,
      external: true,
    },
    {
      key: "mail",
      label: "Chat here",
      sub: email || "Not configured",
      Icon: Mail,
      href: mailHref,
      disabled: !mailHref,
      external: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border px-6 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] hover:text-accent transition-colors">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Contact
        </span>
      </nav>

      <header className="px-6 md:px-8 pt-20 pb-12 max-w-3xl mx-auto text-center">
        <span className="text-[10px] uppercase tracking-[0.25em] text-accent">Get in touch</span>
        <h1 className="mt-4 text-4xl md:text-6xl font-light tracking-tight">
          {s.contact_title ?? "Let's talk"}
        </h1>
        {s.contact_subtitle && (
          <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
            {s.contact_subtitle}
          </p>
        )}
      </header>

      <section className="px-6 md:px-8 pb-32 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {options.map(({ key, label, sub, Icon, href, disabled, external }) => {
            const className =
              "group flex flex-col items-start gap-6 p-8 border border-border bg-muted/20 hover:bg-muted/40 hover:border-accent transition-all aspect-square focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";
            const inner = (
              <>
                <Icon className="size-7 text-accent" strokeWidth={1.5} />
                <div className="mt-auto">
                  <p className="text-xl font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1 break-all">{sub}</p>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-accent transition-colors">
                  {disabled ? "Unavailable" : "Open →"}
                </span>
              </>
            );
            if (disabled) {
              return (
                <div key={key} className={`${className} opacity-50 cursor-not-allowed`}>
                  {inner}
                </div>
              );
            }
            return (
              <a
                key={key}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className={className}
              >
                {inner}
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
