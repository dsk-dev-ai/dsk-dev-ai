import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SITE } from "@/lib/data";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.title} — Software Engineer`,
    template: `%s · ${SITE.title}`,
  },
  description: SITE.tagline,
  applicationName: SITE.title,
  keywords: [
    "Darshan Kachare",
    "software engineer",
    "AI infrastructure",
    "systems design",
    "TypeScript",
    "Python",
    "open source",
  ],
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.title,
    title: `${SITE.title} — Software Engineer`,
    description: SITE.tagline,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.title} — Software Engineer`,
    description: SITE.tagline,
  },
  robots: { index: true, follow: true },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE.url}/#person`,
      name: SITE.title,
      url: SITE.url,
      email: `mailto:${SITE.email}`,
      jobTitle: "Software Engineer",
      description: SITE.tagline,
      sameAs: [SITE.github],
      knowsAbout: [
        "AI infrastructure",
        "systems design",
        "developer platforms",
        "TypeScript",
        "Python",
        "Rust",
        "open source",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.title,
      description: SITE.tagline,
      publisher: { "@id": `${SITE.url}/#person` },
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#070b14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-[#08101f]"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
