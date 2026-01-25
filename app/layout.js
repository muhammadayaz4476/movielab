import { Poppins, Roboto, Comfortaa } from "next/font/google";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { AuthProvider } from "../context/AuthContext";
import LoginModal from "../components/LoginModal";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Specify the weights you need
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"], // Specify the weights you need
});

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
  weight: ["400", "500", "700"], // Specify the weights you need
});

export const metadata = {
  metadataBase: new URL("https://movies.umairlab.com"),
  title: {
    default: "MovieLab - Stream & Download Movies Online for Free",
    template: "%s | MovieLab",
  },
  description:
    "Watch & Download movies and TV series online for free in HD. MovieLab offers a vast collection of trending movies, new releases, and classic films without any subscription.",
  keywords: [
    "free movie streaming",
    "watch movies online free",
    "free movies online",
    "streaming movies free",
    "online movies free",
    "free movie websites",
    "watch free movies",
    "stream movies free",
    "movies without subscription",
    "free movies no sign up",
    "watch movies free no download",
    "HD movies",
    "4k movies",
    "MovieLab",
    "umairlab movies",
  ],
  authors: [{ name: "Umair Lab" }],
  openGraph: {
    title: "MovieLab - Watch Movies & TV Series Online for Free",
    description:
      "Stream thousands of movies and TV shows for free in HD on MovieLab. No subscription required.",
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
    title: "MovieLab - Stream & Download Movies Free",
    description:
      "Watch the latest movies and TV series tailored for you. Free streaming, no subscription.",
    images: ["/og-image.jpg"],
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
      <meta name="referrer" content="origin" />
      <meta
        name="google-site-verification"
        content="VBh8Z5n2gYt-blPxDnyzDu5KU9JOBHYSdaEZmv-s3bk"
      />
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

      <body
        className={`${poppins.variable} ${roboto.variable} ${comfortaa.variable} antialiased`}
      >
        <GoogleAnalytics />
        <AuthProvider>
          {children}
          <LoginModal />
        </AuthProvider>
      </body>
    </html>
  );
}
