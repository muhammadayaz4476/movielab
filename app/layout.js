import { Poppins, Comfortaa } from "next/font/google";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { AuthProvider } from "../context/AuthContext";
import { AdminProvider } from "../context/AdminContext";
import LoginModal from "../components/LoginModal";
import SmoothScrollProvider from "./components/SmoothScrollProvider";
import CustomScrollbar from "./components/CustomScrollbar";
import PageTransition from "./components/PageTransition";
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
    "Stream over 20,000+ movies and TV shows for free in Full HD 1080p. No registration required. Watch latest releases with English subtitles, no ads, and fast streaming on MovieLab.",
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
  ],
  authors: [{ name: "Umair Lab" }],
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
  },
  twitter: {
    card: "summary_large_image",
    title: "MovieLab - Stream & Download Movies Free (1080p)",
    description:
      "Watch the latest movies and TV series tailored for you. Free streaming, no subscription, full HD quality.",
    images: ["/og-image.jpg"],
  },
  referrer: "origin",
  verification: {
    google: "VBh8Z5n2gYt-blPxDnyzDu5KU9JOBHYSdaEZmv-s3bk",
    yandex: "03632b5675884ef5",
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
        <AdminProvider>
          <AuthProvider>
            <SmoothScrollProvider>
              <CustomScrollbar />
              <PageTransition>{children}</PageTransition>
              <LoginModal />
            </SmoothScrollProvider>
          </AuthProvider>
        </AdminProvider>
      </body>
    </html>
  );
}
