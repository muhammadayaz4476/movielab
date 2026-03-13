"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const CustomScrollbar = dynamic(() => import("./CustomScrollbar"), {
  ssr: false,
});
const LoginModal = dynamic(() => import("@/components/LoginModal"), {
  ssr: false,
});

const SmoothScrollProvider = ({ children }) => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const lenisRef = useRef(null);
  const rafRef = useRef(null);

  // Scroll to top on navigation
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  useEffect(() => {
    const checkMobile = () => {
      return (
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        )
      );
    };

    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    setIsMobile(checkMobile());
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Always clean up previous instances first
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (lenisRef.current) {
      lenisRef.current.destroy();
      lenisRef.current = null;
    }

    // Always reset CSS properties first
    document.documentElement.style.scrollBehavior = "";
    document.body.style.scrollBehavior = "";
    document.body.style.webkitOverflowScrolling = "";
    document.documentElement.style.webkitOverflowScrolling = "";

    if (isMobile) {
      // Mobile: Use CSS smooth scrolling
      document.documentElement.style.scrollBehavior = "smooth";
      document.body.style.scrollBehavior = "smooth";
      document.body.style.webkitOverflowScrolling = "touch";
      document.documentElement.style.webkitOverflowScrolling = "touch";

      return;
    }

    // Local variable to store the update function for ticker removal
    let updateFn = null;
    let gsapInstance = null;

    // Desktop: Use Lenis
    const initSmoothScroll = async () => {
      try {
        const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] =
          await Promise.all([
            import("lenis"),
            import("gsap"),
            import("gsap/ScrollTrigger"),
          ]);

        gsap.registerPlugin(ScrollTrigger);
        gsapInstance = gsap;

        const lenis = new Lenis({
          lerp: 0.1,
          duration: 1.2,
          smoothWheel: true,
          smoothTouch: false,
          wheelMultiplier: 1.1,
          touchMultiplier: 0,
          syncTouch: false,
        });

        lenisRef.current = lenis;

        // Define update function
        updateFn = (time) => {
          lenis.raf(time * 1000);
        };

        // Sync with GSAP ScrollTrigger
        lenis.on("scroll", ScrollTrigger.update);

        // Add to GSAP Ticker
        gsap.ticker.add(updateFn);

        // Disable lag smoothing for instant updates
        gsap.ticker.lagSmoothing(0);
      } catch (error) {
        console.error("Error initializing smooth scroll:", error);
      }
    };

    const timeoutId = setTimeout(initSmoothScroll, 10);

    return () => {
      clearTimeout(timeoutId);
      if (gsapInstance && updateFn) {
        gsapInstance.ticker.remove(updateFn);
      }

      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    };
  }, [isMobile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      // Reset CSS on unmount
      document.documentElement.style.scrollBehavior = "";
      document.body.style.scrollBehavior = "";
      document.body.style.webkitOverflowScrolling = "";
      document.documentElement.style.webkitOverflowScrolling = "";
    };
  }, []);

  return (
    <>
      <CustomScrollbar />
      {children}
      <LoginModal />
    </>
  );
};

export default SmoothScrollProvider;
