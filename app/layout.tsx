import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { OfflineIndicator } from "@/components/ui/offline-indicator";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap', // Optimize font loading
});

export const metadata: Metadata = {
  title: "RedAid - Blood Donation Platform",
  description: "Connecting blood donors with patients in need. Save lives through secure and efficient blood donation coordination.",
  keywords: ["blood donation", "blood bank", "emergency blood", "donors", "medical help"],
  authors: [{ name: "RedAid Team" }],
  creator: "RedAid",
  publisher: "RedAid",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // PWA metadata
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RedAid",
  },
  // Open Graph for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://redaid.com",
    title: "RedAid - Blood Donation Platform",
    description: "Connecting blood donors with patients in need. Save lives through secure and efficient blood donation coordination.",
    siteName: "RedAid",
  },
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "RedAid - Blood Donation Platform",
    description: "Connecting blood donors with patients in need. Save lives through secure and efficient blood donation coordination.",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#dc2626' },
    { media: '(prefers-color-scheme: dark)', color: '#dc2626' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Mobile-specific meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RedAid" />
        
        {/* Prevent automatic phone number detection */}
        <meta name="format-detection" content="telephone=no" />
        
        {/* Touch icons for mobile */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        {/* Splash screens for iOS */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        <OfflineIndicator />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
