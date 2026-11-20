import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/components/LegalPage";
import { SITE } from "@/lib/data";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How information is handled on the Darshan Kachare portfolio and ErasureProof Enterprise store.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      description="This policy explains what information is handled when you visit this site, contact me, or purchase an ErasureProof Enterprise license."
      updated="20 November 2026"
    >
      <LegalSection title="Information we receive">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Information you send by email, such as your name, email address, and the contents of a
            question or license request.
          </li>
          <li>
            Purchase details processed by Paddle, such as the product, amount, order ID, billing
            country, and the email address used at checkout. Full card details are handled by Paddle
            and are not stored by this site.
          </li>
          <li>
            Basic technical logs from Render, such as IP address, user agent, requested path, and
            timestamp, used to serve the site and investigate abuse or errors.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How information is used">
        <p>
          Information is used to fulfill license deliveries, answer support and refund requests,
          keep transaction records, prevent abuse, and improve the reliability of the site. The site
          does not sell personal information.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and local storage">
        <p>
          The site does not use advertising or analytics cookies. Your theme preference is stored in
          your browser&apos;s local storage so the site can remember light or dark mode. Paddle may
          set cookies or similar identifiers on its checkout pages under its own privacy terms.
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <ul className="list-disc space-y-2 pl-5">
          <li>Paddle processes payments, taxes, receipts, and refunds.</li>
          <li>Render hosts the static site and may generate standard access logs.</li>
          <li>
            Public GitHub profile and repository data is fetched during site generation to populate
            the portfolio pages.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Retention and your choices">
        <p>
          Purchase and support records are kept as long as needed for license fulfillment, support,
          refunds, and legal or tax obligations. Paddle retains payment records under its own policy.
        </p>
        <p>
          You may request access, correction, or deletion of information you sent by email by
          contacting{" "}
          <a href={`mailto:${SITE.email}`} className="text-accent transition hover:text-ink">
            {SITE.email}
          </a>
          . Some transaction records may need to be retained for legal or tax reasons.
        </p>
      </LegalSection>

      <LegalSection title="Security and children">
        <p>
          The site is served over HTTPS and access to email and purchase records is limited to what
          is needed to fulfill orders and answer support requests. The site is not directed at
          children, and no information is knowingly collected from children.
        </p>
      </LegalSection>

      <LegalSection title="Changes and contact">
        <p>
          Changes to this policy will be posted on this page with an updated date. Questions can be
          sent to{" "}
          <a href={`mailto:${SITE.email}`} className="text-accent transition hover:text-ink">
            {SITE.email}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
