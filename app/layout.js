import { Poppins, Comfortaa } from "next/font/google";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { AuthProvider } from "../context/AuthContext";
import { AdminProvider } from "../context/AdminContext";
import SmoothScrollProvider from "./components/SmoothScrollProvider";
import PageTransition from "./components/PageTransition";
import Script from "next/script";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata = {
  metadataBase: new URL("https://movies.umairlab.com"),
  title: {
    default: "MovieLab - Watch Free Movies & TV Series Online (1080p HD)",
    template: "%s | MovieLab - Free HD Streaming",
  },
  description:
    "Stream over 100,000+ movies and TV shows for free in Full HD 1080p. No registration required. Watch latest releases with English subtitles, no ads, and fast streaming on MovieLab.",
  keywords: [
    "watch movies free",
    "free movie streaming sites",
    "streaming movies super fast",
    "watch series online free",
    "full hd movies 1080p",
    "free movies no sign up",
    "english subtitles movies",
    "latest hd movies download",
    "watch tv shows free",
    "online cinema free",
    "movielab streaming",
    "no buffering movies",
    "4k movies free",
    "Movie Lab",
    "Movie Lab streaming",
    "action movies free",
    "horror movies online",
    "romantic comedies free",
    "sci-fi movies streaming",
  ],
  authors: [{ name: "Umair Lab" }],
  creator: "MovieLab",
  publisher: "MovieLab",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "MovieLab - Watch Movies & TV Series Online for Free (No Ads)",
    description:
      "Stream thousands of movies and TV shows for free in HD on MovieLab. No subscription required. Daily updates with latest releases.",
    url: "https://movies.umairlab.com",
    siteName: "MovieLab",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MovieLab - Free Movie Streaming",
      },
    ],
    locale: "en_US",
    type: "website",
    countryName: "United States",
  },
  twitter: {
    card: "summary_large_image",
    title: "MovieLab - Stream & Download Movies Free (1080p)",
    description:
      "Watch latest movies and TV series tailored for you. Free streaming, no subscription, full HD quality.",
    images: ["/og-image.jpg"],
    creator: "@MovieLab",
    site: "@MovieLab",
  },
  alternates: {
    canonical: "https://movies.umairlab.com",
  },
  referrer: "origin",
  verification: {
    google: "VBh8Z5n2gYt-blPxDnyzDu5KU9JOBHYSdaEZmv-s3bk",
    yandex: "03632b5675884ef5",
  },
  other: {
    "viewport-fit": "cover",
    "theme-color": "#000000",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "MovieLab",
    "application-name": "MovieLab",
    "msapplication-TileColor": "#000000",
    "msapplication-config": "/browserconfig.xml",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://image.tmdb.org"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${poppins.variable} ${comfortaa.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MovieLab",
              url: "https://movies.umairlab.com",
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://movies.umairlab.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <GoogleAnalytics />
        <Script src="https://pl28735289.effectivegatecpm.com/19/39/9b/19399ba474c25737727a403288572c40.js" />
        <Script src="https://pl28735344.effectivegatecpm.com/59/57/4a/59574a153ab37dd51e9c1fc6d4347223.js" />
        <AdminProvider>
          <AuthProvider>
            <SmoothScrollProvider>
              <PageTransition>{children}</PageTransition>
            </SmoothScrollProvider>
          </AuthProvider>
        </AdminProvider>
      </body>
    </html>
  );
}
