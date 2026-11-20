import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/components/LegalPage";
import { SITE } from "@/lib/data";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund terms for ErasureProof Enterprise one-time source-code licenses.",
  alternates: { canonical: "/refunds/" },
};

export default function RefundsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Refund policy"
      description="ErasureProof Enterprise licenses are digital products delivered after payment. This policy explains when refunds are available and how to request one."
      updated="20 November 2026"
    >
      <LegalSection title="Eligible refunds">
        <p>
          Contact me within 14 days of purchase if you were charged twice, if the delivery email
          was not sent, or if the source package cannot be accessed after reasonable troubleshooting.
          Eligible requests are refunded in full.
        </p>
        <p>
          If you change your mind, contact me within 14 days and before downloading, copying, or
          customizing the source package. These requests are reviewed case by case.
        </p>
      </LegalSection>

      <LegalSection title="When refunds are not available">
        <p>
          Because the license is delivered immediately and the source code cannot be returned,
          refunds are generally not available after the source package has been downloaded, copied,
          modified, or deployed. A refund revokes the license; you must stop using the software and
          delete any copies.
        </p>
      </LegalSection>

      <LegalSection title="How to request a refund">
        <p>
          Email{" "}
          <a href={`mailto:${SITE.email}`} className="text-accent transition hover:text-ink">
            {SITE.email}
          </a>{" "}
          with the order ID from your Paddle receipt and the email address used at checkout. Include
          a short description of the issue. I aim to reply within seven business days.
        </p>
        <p>
          Approved refunds are issued through Paddle to the original payment method. Paddle&apos;s
          buyer protection and chargeback processes also apply to transactions it processed.
        </p>
      </LegalSection>

      <LegalSection title="Questions">
        <p>
          If you are unsure whether a purchase is right for you, ask before buying at{" "}
          <a href={`mailto:${SITE.email}`} className="text-accent transition hover:text-ink">
            {SITE.email}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
