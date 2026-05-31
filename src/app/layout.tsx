import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#030305",
};

export const metadata: Metadata = {
  title: "Aether Pro — Internet Radio",
  description:
    "A dark-themed internet radio streaming app with PeerJS remote control, RDS ticker, equalizer visualization, and beautiful glassmorphism design.",
  keywords: ["radio", "streaming", "internet radio", "peerjs", "aether", "pwa", "webapp"],
  manifest: "/zbai/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aether Pro",
  },
  icons: {
    icon: [
      { url: "/zbai/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/zbai/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/zbai/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/zbai/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Aether Pro — Internet Radio",
    description: "Dark-themed internet radio with remote control and beautiful glassmorphism design.",
    type: "website",
    siteName: "Aether Pro",
  },
  twitter: {
    card: "summary",
    title: "Aether Pro — Internet Radio",
    description: "Dark-themed internet radio with remote control and glassmorphism design.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js" defer />
        <script src="https://unpkg.com/mqtt/dist/mqtt.min.js" defer />
        {/* PWA: register service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/zbai/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased bg-aether-bg text-aether-text font-sans">
        {children}
      </body>
    </html>
  );
}
