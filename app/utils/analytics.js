"use client";
export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, {
      ...params,
      transport_type: "beacon",
    });
  }
};

export const G_EVENTS = {
  WATCH_NOW: "watch_now_click",
  DOWNLOAD_NOW: "download_now_click",
  TRAILER: "trailer_click",
};
