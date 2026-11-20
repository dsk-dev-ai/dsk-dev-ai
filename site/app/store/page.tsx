import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ButtonLink } from "@/components/ui";
import { SITE } from "@/lib/data";

export const metadata: Metadata = {
  title: "Store - ErasureProof Enterprise",
  description:
    "One-time source-code licenses for ErasureProof Enterprise v1.2: $299 single-company and $699 agency/white-label.",
  alternates: { canonical: "/store/" },
};

const TIERS = [
  {
    name: "Single Company License",
    price: "$299",
    label: "for one legal entity",
    summary:
      "Deploy ErasureProof Enterprise for your own internal GDPR, CCPA, and DPDP proof-of-erasure workflow.",
    license:
      "Perpetual, worldwide, non-exclusive license for one legal entity. Internal use and modifications are allowed.",
    features: [
      "Self-hosted FastAPI + React application",
      "Identity graph and evidence extraction",
      "Signed PDF attestations and hash-chained ledger",
      "Python SDK, Docker, Compose, and Kubernetes manifests",
    ],
    checkoutUrl: "",
  },
  {
    name: "Agency / White-Label License",
    price: "$699",
    label: "for client work",
    summary:
      "Rebrand, host, and operate ErasureProof Enterprise as a commercial compliance service for unlimited clients.",
    license:
      "Perpetual, worldwide, non-exclusive license to rebrand, host, and operate the software for unlimited external clients.",
    features: [
      "Everything in the Single Company License",
      "White-label branding for client-facing deployments",
      "Unlimited external clients under one license",
      "Suitable for agencies, consultants, and fractional DPOs",
    ],
    checkoutUrl: "",
  },
] as const;

const INCLUDED = [
  "One-time payment - no subscription",
  "Version 1.2 source code and deployment files",
  "Commercial license for the tier you purchase",
  "Delivery details by email after Paddle confirms payment",
];

export default function StorePage() {
  return (
    <div className="container-page py-16 sm:py-20">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Store</p>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          ErasureProof Enterprise v1.2
        </h1>
        <Badge tone="emerald">one-time license</Badge>
      </div>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        Self-hosted GDPR, CCPA &amp; DPDP proof-of-erasure compliance engine with signed PDF
        certificates and white-label branding. Choose the license that matches how you will deploy
        it.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {TIERS.map((tier) => (
          <article key={tier.name} className="card card-spotlight flex flex-col p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-ink">{tier.name}</h2>
                <p className="mt-1 text-sm text-faint">{tier.label}</p>
              </div>
              <div className="text-right">
                <div className="font-mono text-3xl font-bold tracking-tight text-ink">
                  {tier.price}
                </div>
                <div className="text-xs text-faint">USD</div>
              </div>
            </div>

            <p className="mt-5 leading-relaxed text-muted">{tier.summary}</p>

            <ul className="mt-6 space-y-3 text-sm text-muted">
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-2.5">
                  <span className="mt-0.5 font-mono text-emerald" aria-hidden>
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 border-t border-line pt-5 text-sm leading-relaxed text-muted">
              {tier.license}
            </p>

            <div className="mt-6">
              {tier.checkoutUrl ? (
                <a
                  href={tier.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-[var(--color-on-accent)] transition hover:brightness-110"
                >
                  Buy with Paddle →
                </a>
              ) : (
                <ButtonLink href="/contact/">Request purchase link</ButtonLink>
              )}
            </div>
          </article>
        ))}
      </div>

      <section className="mt-12" aria-label="What is included">
        <div className="card p-6 sm:p-7">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-faint">
            Included with every license
          </h2>
          <ul className="mt-5 grid gap-3 text-sm text-muted sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-0.5 font-mono text-accent" aria-hidden>
                  +
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-faint">
        <span>
          By purchasing you agree to the{" "}
          <Link href="/terms/" className="text-accent transition hover:text-ink">
            terms of service
          </Link>
          ,{" "}
          <Link href="/privacy/" className="text-accent transition hover:text-ink">
            privacy policy
          </Link>
          , and{" "}
          <Link href="/refunds/" className="text-accent transition hover:text-ink">
            refund policy
          </Link>
          .
        </span>
        <span>
          Questions?{" "}
          <a
            href={`mailto:${SITE.email}`}
            className="text-accent transition hover:text-ink"
          >
            {SITE.email}
          </a>
        </span>
      </div>
    </div>
  );
}
