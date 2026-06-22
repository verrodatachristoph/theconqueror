import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Conqueror",
    short_name: "The Conqueror",
    description: "Wo die Familie schon überall war.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f4f0e9",
    theme_color: "#f4f0e9",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
