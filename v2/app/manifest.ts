import type { MetadataRoute } from "next";

// PWA manifest — makes Tidy Tails installable to a phone home screen with an
// app-like standalone launch. Served by Next.js at /manifest.webmanifest.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tidy Tails — Grooming Cockpit",
    short_name: "Tidy Tails",
    description:
      "Mobile-first grooming cockpit: client search, pet safety cards, appointment history, reminders.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f3f7",
    theme_color: "#6d28d9",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
