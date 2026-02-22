export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/movie/",

        "/search/",
        "/discover/",
        "/about/",
        "/contact/",
        "/privacy/",
        "/sitemap.xml",
        "/static.xml",
        "/movies.xml",
        "/webseries.xml",
      ],
      disallow: ["/api/", "/admin/", "/watch/", "/watch-later/", "/_next/"],
      crawlDelay: 1,
    },
    sitemap: ["https://movies.umairlab.com/sitemap.xml"],
    host: "https://movies.umairlab.com",
  };
}
