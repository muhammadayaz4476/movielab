export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/"], // Add any other private paths
    },
    sitemap: "https://movies.umairlab.com/sitemap.xml",
  };
}
