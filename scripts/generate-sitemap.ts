// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://usta-zone-uz.lovable.app";

const categories = [
  "uy-tamir", "qurilish", "transport", "tozalash", "elektronika", "gozallik", "boshqa",
];
const cities = [
  "toshkent", "samarqand", "buxoro", "namangan", "andijon", "farg'ona", "qo'qon",
  "nukus", "qarshi", "termiz", "jizzax", "guliston", "navoiy", "urganch", "chirchiq",
];

interface SitemapEntry { path: string; changefreq?: string; priority?: string }

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/find-master", changefreq: "daily", priority: "0.9" },
  { path: "/categories", changefreq: "weekly", priority: "0.8" },
  { path: "/masters", changefreq: "daily", priority: "0.8" },
  { path: "/subscription", changefreq: "monthly", priority: "0.6" },
  { path: "/login", changefreq: "monthly", priority: "0.4" },
  { path: "/register/master", changefreq: "monthly", priority: "0.6" },
  ...categories.map((c) => ({ path: `/xizmatlar/${c}`, changefreq: "weekly", priority: "0.8" })),
  ...cities.map((c) => ({ path: `/shahar/${encodeURIComponent(c)}`, changefreq: "weekly", priority: "0.7" })),
];

const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean).join("\n")
  ),
  `</urlset>`,
].join("\n");

writeFileSync(resolve("public/sitemap.xml"), xml);
console.log(`sitemap.xml written (${entries.length} entries)`);
