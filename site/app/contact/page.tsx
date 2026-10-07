import type { Metadata } from "next";
import ContactComposer from "@/components/ContactComposer";
import { Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Darshan Kachare — AI infrastructure, systems design, and open-source collaboration.",
};

export default function ContactPage() {
  return (
    <div className="container-page py-16 sm:py-20">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Contact
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Let&apos;s talk
        </h1>
        <Badge tone="emerald">
          <span className="pulse-dot size-2 rounded-full bg-emerald" aria-hidden />
          open to new conversations
        </Badge>
      </div>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        Whether it&apos;s AI infrastructure, a system that needs to scale, or an
        open-source idea worth building — send a message and it goes straight to
        my inbox.
      </p>

      <div className="mt-10">
        <ContactComposer />
      </div>
    </div>
  );
}
