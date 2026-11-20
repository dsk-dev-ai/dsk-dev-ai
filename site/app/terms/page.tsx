import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/components/LegalPage";
import { SITE } from "@/lib/data";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing purchases and use of ErasureProof Enterprise one-time source-code licenses.",
  alternates: { canonical: "/terms/" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of service"
      description="These terms govern purchases made through the ErasureProof Enterprise store and use of this website. By purchasing or using the site, you agree to them."
      updated="20 November 2026"
    >
      <LegalSection title="Seller and products">
        <p>
          The seller is {SITE.title}, based in {SITE.location}. Contact:{" "}
          <a href={`mailto:${SITE.email}`} className="text-accent transition hover:text-ink">
            {SITE.email}
          </a>
          .
        </p>
        <p>
          The products are one-time source-code licenses for ErasureProof Enterprise v1.2: the
          Single Company License and the Agency / White-Label License. These are digital products;
          there is no subscription or recurring charge. Prices are shown in USD and taxes, if any,
          are calculated by Paddle at checkout.
        </p>
      </LegalSection>

      <LegalSection title="License grant">
        <p>
          Each license is perpetual, worldwide, and non-exclusive. The Single Company License
          permits deployment and modification for the internal compliance operations of one legal
          entity. The Agency / White-Label License permits rebranding, hosting, and operation of the
          software as a commercial service for unlimited external clients.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>You may modify the code and deploy it within the scope of your purchased tier.</li>
          <li>
            You may not redistribute, publish, sublicense, or resell the raw or modified source code
            as a standalone codebase, template, or open-source repository.
          </li>
          <li>
            The full license terms delivered with the source package control if there is a conflict
            with a summary on this page.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Delivery and support">
        <p>
          After Paddle confirms payment, delivery details are sent to the email address used at
          checkout. You are responsible for providing a valid email address, retaining access to it,
          and maintaining any infrastructure needed to run the software.
        </p>
        <p>
          The software is provided “as is”. You are responsible for your own legal and regulatory
          conclusions, including GDPR, CCPA, and DPDP compliance in your jurisdiction. Nothing on
          this site is legal advice.
        </p>
      </LegalSection>

      <LegalSection title="Payments and third parties">
        <p>
          Payments are processed by Paddle. Paddle handles checkout, payment data, tax calculation,
          and transaction receipts. This site does not collect or store full card details. The site
          is hosted on Render, and public GitHub profile data is used to build the portfolio content.
        </p>
      </LegalSection>

      <LegalSection title="Refunds and changes">
        <p>
          Refund requests are handled under the{" "}
          <a href="/refunds/" className="text-accent transition hover:text-ink">
            refund policy
          </a>
          . These terms may be updated; the “Last updated” date above shows the current version.
          Continued use of the site after an update means you accept the revised terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms or a purchase can be sent to{" "}
          <a href={`mailto:${SITE.email}`} className="text-accent transition hover:text-ink">
            {SITE.email}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
