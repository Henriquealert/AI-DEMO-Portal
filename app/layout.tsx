import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/lib/site";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.portalName} | ${site.name}`,
    template: `%s | ${site.name} ${site.portalName}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: `${site.name} ${site.portalName}`,
    title: `${site.portalName} | ${site.name}`,
    description: site.description,
    locale: "en_US",
    // TODO(brand): add a 1200x630 share image at public/og.png and list it here.
  },
  twitter: { card: "summary", title: `${site.portalName} | ${site.name}`, description: site.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#101b32" }, // Deep Ink (sampled from logo)
    { media: "(prefers-color-scheme: light)", color: "#f5f4ef" }, // Soft Ivory (sampled from logo)
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <TopBar />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
