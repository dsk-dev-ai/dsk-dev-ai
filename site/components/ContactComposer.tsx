"use client";

import { useState } from "react";
import { SITE } from "@/lib/data";

export default function ContactComposer() {
  const [name, setName] = useState("");
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const subject = encodeURIComponent(
    `Hello Darshan${name ? ` — from ${name}` : ""} [via ${SITE.domain}]`,
  );
  const body = encodeURIComponent(
    `${message}${sender ? `\n\n— ${name || "Someone"} (${sender})` : ""}`,
  );
  const canSend = message.trim().length > 0;

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Write a message</h2>
        <p className="mt-1 text-sm text-muted">
          This opens your mail app with everything prefilled — nothing is stored
          or sent through a server.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSend) window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-[#08101f] transition hover:bg-[#8aa4ff] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            Open in mail app →
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-5">
        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Direct</h2>
          <p className="mt-1 text-sm text-muted">
            Prefer your own mail client? Copy the address or write straight away.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <a
              href={`mailto:${SITE.email}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3.5 font-mono text-sm transition hover:border-accent/60 hover:bg-accent-soft"
            >
              <span className="truncate">{SITE.email}</span>
              <span aria-hidden className="shrink-0 text-accent">↗</span>
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="rounded-xl border border-line px-4 py-3.5 text-sm font-medium text-muted transition hover:border-accent/60 hover:text-ink"
            >
              {copied ? "Copied ✓" : "Copy email address"}
            </button>
            <a
              href={SITE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3.5 text-sm transition hover:border-accent/60 hover:bg-accent-soft"
            >
              <span>
                GitHub · <span className="font-mono">@{SITE.githubHandle}</span>
              </span>
              <span aria-hidden className="text-accent">↗</span>
            </a>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Good fits</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            {[
              "AI infrastructure, agent tooling, and developer platforms",
              "Systems work — APIs, pipelines, observability, performance",
              "Open-source collaboration and reviewed contributions",
              "Short consulting engagements on TypeScript / Python / Rust stacks",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
