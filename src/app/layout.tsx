import type { Metadata } from "next";
import { Archivo, Bodoni_Moda, Space_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavBar } from "@/components/nav-bar";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Selvedge — Premium Deadstock Textile Marketplace",
    template: "%s | Selvedge",
  },
  description:
    "Rescue premium deadstock fabric from the world's best mills. Indie designers and sustainable brands find rare textiles at factory-direct prices.",
  keywords: [
    "deadstock fabric",
    "sustainable fashion",
    "textile marketplace",
    "designer fabric",
    "upcycling materials",
    "mill surplus",
  ],
  openGraph: {
    title: "Selvedge — Premium Deadstock Textile Marketplace",
    description:
      "Rescue premium deadstock fabric from the world's best mills. Indie designers and sustainable brands find rare textiles at factory-direct prices.",
    type: "website",
    locale: "en_US",
    siteName: "Selvedge",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Selvedge — Premium Deadstock Textile Marketplace",
    description:
      "Rescue premium deadstock fabric from the world's best mills.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script id="capture-paid-attribution" strategy="beforeInteractive">
          {`
            try {
              var p = new URLSearchParams(window.location.search);
              var g = p.get('gclid');
              if (g && g.length > 40 && /^(Cj|EAI|CIa)/.test(g)) {
                sessionStorage.setItem('__ph_gclid', g);
              }
              ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(function(k) {
                var v = p.get(k);
                if (v) sessionStorage.setItem('__ph_' + k, v);
              });
            } catch(e) {}
          `}
        </Script>
      </head>
      <body
        className={`${archivo.variable} ${bodoniModa.variable} ${spaceMono.variable} font-sans antialiased bg-bone text-ink`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <NavBar />
              <main id="main-content" tabIndex={-1}>
                {children}
              </main>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
