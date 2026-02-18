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
        "/sitemap-main.xml",
        "/sitemap-part/"
      ],
      disallow: [
        "/api/",
        "/admin/",
        "/watch/",
        "/watch-later/",
        "/_next/",
        "/static/"
      ],
      crawlDelay: 1,
    },
    sitemap: [
      "https://movies.umairlab.com/sitemap-main.xml",
      "https://movies.umairlab.com/sitemap-part/"
    ],
    host: "https://movies.umairlab.com",
  };
}
