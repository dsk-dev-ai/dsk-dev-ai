import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import BackToTop from "@/components/BackToTop";
import ScrollProgress from "@/components/ScrollProgress";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { SITE, data } from "@/lib/data";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: light)').matches;var t=s==='light'||s==='dark'?s:(m?'light':'dark');document.documentElement.dataset.theme=t;}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.title} - ${SITE.role}`,
    template: `%s · ${SITE.title}`,
  },
  description: SITE.tagline,
  applicationName: SITE.title,
  authors: [{ name: SITE.title, url: SITE.url }],
  creator: SITE.title,
  category: "technology",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  keywords: [
    "Darshan Kachare",
    "AI engineer",
    "AI infrastructure",
    "LLM",
    "RAG",
    "AI agents",
    "MCP",
    "systems design",
    "TypeScript",
    "Python",
    "Rust",
    "open source",
  ],
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.title,
    title: `${SITE.title} - ${SITE.role}`,
    description: SITE.tagline,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.title} - ${SITE.role}`,
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
      jobTitle: SITE.role,
      description: SITE.bio,
      address: { "@type": "PostalAddress", addressCountry: "IN" },
      sameAs: [SITE.github, SITE.linkedin, SITE.devto, SITE.medium],
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "KIT's College of Engineering, Kolhapur",
      },
      knowsAbout: [
        "AI infrastructure",
        "LLM applications",
        "retrieval-augmented generation",
        "AI agents",
        "Model Context Protocol",
        "developer platforms",
        "systems design",
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
      inLanguage: "en",
    },
    {
      "@type": "ProfilePage",
      "@id": `${SITE.url}/#profile`,
      url: SITE.url,
      name: `${SITE.title} - ${SITE.role}`,
      isPartOf: { "@id": `${SITE.url}/#website` },
      mainEntity: { "@id": `${SITE.url}/#person` },
    },
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#070b14" },
  ],
  width: "device-width",
  initialScale: 1,
};

const paletteProjects = data.projects.map((project) => ({
  slug: project.slug,
  name: project.name,
  description: project.description ?? project.language ?? "Project",
  language: project.language,
}));

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrains.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://avatars.githubusercontent.com" />
        <link rel="preconnect" href="https://raw.githubusercontent.com" />
        <link rel="alternate" type="application/rss+xml" title={`${SITE.title} - project updates`} href="/feed.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--color-on-accent)]"
        >
          Skip to content
        </a>
        <ScrollProgress />
        <SiteHeader projects={paletteProjects} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <BackToTop />
      </body>
    </html>
  );
}
