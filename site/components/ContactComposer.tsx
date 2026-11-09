"use client";

import { useState } from "react";
import { SITE } from "@/lib/data";

export default function ContactComposer() {
  const [name, setName] = useState("");
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const subject = encodeURIComponent(
    `Hello Darshan${name ? ` - from ${name}` : ""} [via ${SITE.domain}]`,
  );
  const body = encodeURIComponent(
    `${message}${sender ? `\n\n- ${name || "Someone"} (${sender})` : ""}`,
  );
  const canSend = message.trim().length > 0;

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(email);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Write a message</h2>
        <p className="mt-1 text-sm text-muted">
          This opens your mail app with everything prefilled - nothing is stored or sent through a
          server.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSend) {
              window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-muted">
                Your name
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-accent/60 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="sender" className="mb-1.5 block text-xs font-medium text-muted">
                Email or company
              </label>
              <input
                id="sender"
                value={sender}
                onChange={(event) => setSender(event.target.value)}
                placeholder="jane@company.com"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-accent/60 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-muted">
              Message <span className="text-rose">*</span>
            </label>
            <textarea
              id="message"
              required
              rows={6}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="What are you building, and how can I help?"
              className="w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-accent/60 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-[var(--color-on-accent)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            Open in mail app →
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-5">
        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Direct</h2>
          <p className="mt-1 text-sm text-muted">
            Two addresses reach the same inbox. Copy one, or write straight away.
          </p>

          <div className="mt-5 space-y-3">
            {SITE.emails.map((email) => (
              <div
                key={email}
                className="flex items-center gap-2 rounded-xl border border-line p-1.5 pl-4 transition hover:border-accent/60"
              >
                <a
                  href={`mailto:${email}`}
                  className="min-w-0 flex-1 truncate font-mono text-sm transition hover:text-accent"
                >
                  {email}
                </a>
                <button
                  type="button"
                  onClick={() => copyEmail(email)}
                  className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-muted transition hover:bg-accent-soft hover:text-ink"
                  aria-label={`Copy ${email}`}
                >
                  {copied === email ? "Copied ✓" : "Copy"}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { href: SITE.github, label: "GitHub" },
              { href: SITE.linkedin, label: "LinkedIn" },
              { href: SITE.devto, label: "Dev.to" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-line px-3 py-2 text-center text-xs text-muted transition hover:border-accent/60 hover:text-ink"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Good fits</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            {[
              "AI infrastructure, agent tooling, and developer platforms",
              "Systems work - APIs, pipelines, observability, performance",
              "Open-source collaboration and reviewed contributions",
              "Short consulting engagements on TypeScript / Python / Rust stacks",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-xs text-faint">
            {SITE.location} · usually replies within 48 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
