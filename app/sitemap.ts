import type { MetadataRoute } from "next";

const origin = "https://rolichat.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/privacy", "/terms"].map((path) => ({
    url: `${origin}${path}`,
  }));
}
