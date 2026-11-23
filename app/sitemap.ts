import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getAllDemos } from "@/lib/demos";
import { isFullDemo } from "@/lib/schema";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url },
    ...getAllDemos()
      .filter(isFullDemo)
      .map((d) => ({ url: `${site.url}/demos/${d.slug}` })),
  ];
}
