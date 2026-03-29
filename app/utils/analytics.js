"use client";
export const trackEvent = (action, category, label, value) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

export const G_EVENTS = {
  WATCH_NOW: "watch_now_click",
  DOWNLOAD_NOW: "download_now_click",
  TRAILER: "trailer_click",
};
