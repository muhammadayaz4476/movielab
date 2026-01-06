"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import Script from "next/script";

const GA_TRACKING_ID = "G-FK3358HKK1";

const GAEvents = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && window.gtag) {
      const url = pathname + searchParams.toString();
      window.gtag("config", GA_TRACKING_ID, {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
};

const GoogleAnalytics = () => {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${GA_TRACKING_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <GAEvents />
      </Suspense>
    </>
  );
};

export default GoogleAnalytics;
