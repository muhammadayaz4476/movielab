"use client";
import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CustomScrollbar = () => {
  const thumbRef = useRef(null);
  const containerRef = useRef(null);
  const maxThumbMoveRef = useRef(0);
  const maxScrollRef = useRef(0);
  const isDraggingRef = useRef(false);

  const updateScrollbar = useCallback(() => {
    const thumb = thumbRef.current;
    const container = containerRef.current;
    if (!thumb || !container) return;

    const scrollbarHeight = container.getBoundingClientRect().height;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    maxScrollRef.current = Math.max(scrollHeight - clientHeight, 1);
    const scrollRatio = clientHeight / scrollHeight;

    const thumbHeight = Math.max(scrollbarHeight * scrollRatio, 50);
    maxThumbMoveRef.current = scrollbarHeight - thumbHeight;

    gsap.set(thumb, { height: thumbHeight });
  }, []);

  const updateThumbPosition = useCallback(() => {
    if (!maxScrollRef.current || !thumbRef.current || isDraggingRef.current)
      return;
    const progress = window.scrollY / maxScrollRef.current;
    gsap.set(thumbRef.current, { y: progress * maxThumbMoveRef.current });
  }, []);

  const handleThumbMouseDown = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const container = containerRef.current;
    const thumb = thumbRef.current;
    if (!container || !thumb) return;

    const containerRect = container.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();

    // Calculate offset from mouse position to thumb top
    const mouseOffsetY = e.clientY - thumbRect.top;

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;

      // Get fresh container position for each move
      const currentContainerRect = container.getBoundingClientRect();

      // Calculate new thumb position relative to container
      const newThumbTop = e.clientY - currentContainerRect.top - mouseOffsetY;

      // Clamp thumb position within bounds
      const clampedThumbTop = Math.max(
        0,
        Math.min(newThumbTop, maxThumbMoveRef.current),
      );

      // Update thumb position immediately with no animation
      gsap.set(thumb, { y: clampedThumbTop, duration: 0 });

      // Calculate and update scroll position
      const scrollProgress =
        maxThumbMoveRef.current > 0
          ? clampedThumbTop / maxThumbMoveRef.current
          : 0;
      const newScrollY = scrollProgress * maxScrollRef.current;

      // Use requestAnimationFrame to ensure smooth scrolling
      requestAnimationFrame(() => {
        window.scrollTo(0, newScrollY);
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };

    // Prevent text selection during drag
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  useEffect(() => {
    const initScrollTrigger = () => {
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        onUpdate: updateThumbPosition,
        onRefresh: () => {
          updateScrollbar();
          // handleThumbMouseDown();
          updateThumbPosition();
        },
      });
    };

    // Initial update
    updateScrollbar();
    initScrollTrigger();
    updateThumbPosition();

    const onResize = () => {
      updateScrollbar();
      ScrollTrigger.refresh();
      updateThumbPosition();
    };

    window.addEventListener("resize", onResize);

    // Add ResizeObserver to detect content height changes (infinite scroll)
    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(document.body);

    return () => {
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [updateScrollbar, updateThumbPosition]);

  return (
    <div
      ref={containerRef}
      className="hidden lg:block fixed top-[8vh] md:top-[5vh] right-0 md:right-[0.4vw] w-[0.4vw] h-[90vh] bg-white/25 rounded-md z-[1000] overflow-hidden"
    >
      <div
        ref={thumbRef}
        className="w-full bg-white rounded-full absolute top-0 cursor-pointer"
        onMouseDown={handleThumbMouseDown}
      />
    </div>
  );
};

export default CustomScrollbar;
