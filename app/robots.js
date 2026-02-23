export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/movie/",

        "/discover/",
        "/about/",
        "/contact/",
        "/privacy/",
        "/sitemap.xml",
        "/static.xml",
        "/movies.xml",
        "/webseries.xml",
      ],
      disallow: ["/api/", "/admin/", "/watch/", "/watch-later/", "/_next/", "/search/",

      ],
      crawlDelay: 1,
    },
    sitemap: ["https://movies.umairlab.com/sitemap.xml"],
    host: "https://movies.umairlab.com",
  };
}
