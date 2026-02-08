"use client";
import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SmoothScrollProvider = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const lenisRef = useRef(null);
  const rafRef = useRef(null);

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

    // Define update function in effect scope for cleanup access
    const update = (time) => {
      lenisRef.current?.raf(time * 1000);
    };

    // Desktop: Use Lenis
    const timeoutId = setTimeout(() => {
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

      // Sync with GSAP ScrollTrigger
      lenis.on("scroll", ScrollTrigger.update);

      // Add to GSAP Ticker
      gsap.ticker.add(update);

      // Disable lag smoothing for instant updates
      gsap.ticker.lagSmoothing(0);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      // Cleanup GSAP Ticker
      gsap.ticker.remove(update);

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

  return <>{children}</>;
};

export default SmoothScrollProvider;
