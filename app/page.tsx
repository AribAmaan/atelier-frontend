import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

const title = "RoliChat — AI Character Chat & Roleplay";
const description =
  "Meet AI characters, create your own, and build interactive stories shaped by your choices. Explore roleplay, memorable conversations, and new adventures on RoliChat.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "RoliChat",
    title,
    description,
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "RoliChat" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/icons/icon-512.png"],
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RoliChat",
  url: "https://rolichat.com/",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <LandingPage />
    </>
  );
}
