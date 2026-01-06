import { Poppins, Roboto, Comfortaa } from "next/font/google";
import GoogleAnalytics from "./components/GoogleAnalytics";
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
  title: "MovieLab - Stream & Download Movies",
  description:
    "Experience high-quality movie streaming and downloads on MovieLab. Explore thousands of movies, dedicated hubs, and trending content daily.",
  keywords: [
    "movies",
    "streaming",
    "download movies",
    "4k movies",
    "watch online",
    "movielab",
  ],
  authors: [{ name: "Umair Lab" }],
  openGraph: {
    title: "MovieLab - Stream & Download Movies",
    description:
      "Explore thousands of movies and trending content on MovieLab.",
    url: "https://movielab.com",
    siteName: "MovieLab",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MovieLab Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MovieLab - Stream & Download Movies",
    description:
      "Explore thousands of movies and trending content on MovieLab.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${roboto.variable} ${comfortaa.variable} antialiased`}
      >
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
