import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import Providers from "@/components/Providers";
import Footer from "@/components/Footer";
import { getLocale } from "@/lib/i18n/server";
import { THEME_COOKIE, isTheme } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "The Conqueror",
  description: "Wo die Familie schon überall war.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-light.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon",
  },
  appleWebApp: { capable: true, title: "The Conqueror", statusBarStyle: "default" },
  openGraph: {
    title: "The Conqueror",
    description: "Wo die Familie schon überall war.",
    siteName: "The Conqueror",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Conqueror",
    description: "Wo die Familie schon überall war.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f0e9" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1916" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const store = await cookies();
  const themeCookie = store.get(THEME_COOKIE)?.value;
  const hasThemeCookie = isTheme(themeCookie);
  const isDark = hasThemeCookie && themeCookie === "dark";

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${isDark ? " dark" : ""}`}
    >
      <body className="min-h-full flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* No explicit theme choice → follow the OS setting before first paint
            (so mobile / installed PWA auto-adapt). An explicit cookie wins.
            Runs parser-blocking as the first body node, before any content paints. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(dark|light)/);var d=m?m[1]==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
        <Providers locale={locale}>
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
