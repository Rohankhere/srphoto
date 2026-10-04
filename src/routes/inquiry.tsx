import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/inquiry")({
  component: InquiryPage,
});

function InquiryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex h-16 items-center justify-between border-b border-border px-6 md:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm transition-colors hover:text-accent"><ArrowLeft className="size-4" /> Home</Link>
        <Link to="/contact" className="text-sm text-muted-foreground transition-colors hover:text-accent">Contact us</Link>
      </nav>
      <main className="mx-auto max-w-xl px-6 py-12 md:py-16">
        <p className="text-sm text-accent">SR Photo Studio</p>
        <h1 className="mt-3 text-4xl font-light md:text-5xl">Send an inquiry</h1>
        <EnquiryForm />
      </main>
    </div>
  );
}

function EnquiryForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const p = phone.trim();
    const m = message.trim();
    if (!n || !p || !m) return toast.error("Please fill in your name, phone and message");
    if (n.length > 100 || p.length > 30 || m.length > 1000)
      return toast.error("Please keep your message under 1000 characters");
    setSending(true);
    try {
      const { error } = await supabase.from("enquiries").insert({ name: n, phone: p, message: m });
      if (error) throw error;
      toast.success("Thank you! We received your enquiry and will get back to you soon.");
      setName("");
      setPhone("");
      setMessage("");
    } catch {
      toast.error("Could not send your enquiry. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full bg-transparent border border-border rounded-md px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none transition-colors";

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        id="inquiry-name"
        aria-label="Your name"
        autoComplete="name"
        required
        placeholder="Your name"
        maxLength={100}
        className={inputCls}
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        id="inquiry-phone"
        aria-label="Phone number"
        autoComplete="tel"
        required
        placeholder="Phone number"
        type="tel"
        maxLength={30}
        className={inputCls}
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        id="inquiry-message"
        aria-label="Message"
        required
        placeholder="Tell us about your shoot…"
        rows={5}
        maxLength={1000}
        className={`${inputCls} resize-none`}
      />
      <Button
        type="submit"
        disabled={sending}
        className="btn-press w-full border border-accent text-accent text-[11px] uppercase tracking-[0.25em] py-2.5 hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send Enquiry"}
      </Button>
    </form>
  );
}

