// import { MetadataRoute } from "next";

// export default function sitemap(): MetadataRoute.Sitemap {
//   const baseUrl = "https://www.todaysattaresults.com";

//   return [
//     {
//       url: baseUrl,
//       lastModified: new Date(),
//       changeFrequency: "daily",
//       priority: 1,
//     },
//     {
//         url: `${baseUrl}/chart`,
//         lastModified: new Date(),
//         changeFrequency: "monthly",
//         priority: 0.8,
//       },
//     {
//       url: `${baseUrl}/about`,
//       lastModified: new Date(),
//       changeFrequency: "monthly",
//       priority: 0.8,
//     },
//     {
//       url: `${baseUrl}/contact`,
//       lastModified: new Date(),
//       changeFrequency: "monthly",
//       priority: 0.8,
//     },
//   ];
// }

import { MetadataRoute } from "next";
import { getHomepageData, getSK24Data } from "@/lib/api-helpers";
import { getAllPosts } from "@/lib/blog-data";
import { FEATURED_GAMES } from "@/lib/featured-games";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.todaysattaresults.com";

  const homepage = await getHomepageData();
  const sk24 = await getSK24Data();

  const games = [
    ...(homepage?.live || []),
    ...(homepage?.next || []),
    ...(homepage?.rest || []),
    ...(sk24?.games || []),
  ];

  // Remove duplicate slugs
  const uniqueSlugs = [
    ...new Set(
      games.map((g) =>
        g.name.toLowerCase().replace(/\s+/g, "-")
      )
    ),
  ];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/chart`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },

    ...FEATURED_GAMES.map((game) => ({
      url: `${baseUrl}/${game.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),

    ...getAllPosts().map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),

    ...uniqueSlugs.map((slug) => ({
      url: `${baseUrl}/chart/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}