import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import Script from "next/script";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";
import "./mobile.css";

const GA_MEASUREMENT_ID = "G-CZH3JSJ6Y0";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Rolichat — your next story starts here",
  description: "Meet memorable AI characters, direct your own scenes, and build stories shaped by your choices.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/brand/rolichat-mark.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rolichat",
  },
};

// Without this, mobile browsers (Chrome on Android in particular) overlay
// the on-screen keyboard on top of the page instead of resizing it — the
// browser just auto-scrolls the focused input into view while the layout
// viewport (and therefore `h-dvh`) stays the same full-screen height.
// That's what produces the empty gap between the message box and the
// keyboard in the chat composer. `resizes-content` makes the browser
// actually shrink the viewport when the keyboard opens, so `h-dvh`
// recalculates and the composer sits flush above the keyboard.
//
// themeColor here drives the installed-app title bar / status bar tint
// (and the browser UI color pre-install on mobile Chrome).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#0a0a0c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          Captures `beforeinstallprompt` the instant it fires, before React
          has hydrated. On fast mobile loads Chrome can fire this event
          within the first few dozen milliseconds — earlier than
          useInstallPrompt's useEffect gets a chance to attach its own
          listener. Since the browser only fires this event once per page
          load, missing it here means the custom "Install app" button would
          stay hidden forever even though Chrome considers the site
          installable (which is exactly what we saw: the native "Install
          and create shortcut" option showed up in Chrome's menu, but our
          button never did). Stashing it on window lets the hook pick it up
          on mount regardless of timing.
        */}
        <Script id="capture-install-prompt" strategy="beforeInteractive">
          {`
            window.__deferredInstallPrompt = null;
            window.addEventListener("beforeinstallprompt", function (e) {
              e.preventDefault();
              window.__deferredInstallPrompt = e;
              window.dispatchEvent(new Event("deferredInstallPromptReady"));
            });
          `}
        </Script>

        {/* Google tag (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body className={`${fraunces.variable} ${inter.variable} font-body bg-void text-parchment antialiased`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
