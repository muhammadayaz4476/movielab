"use client";

import { trackEvent } from "./analytics";

const SMARTLINK_URL = "https://doubtfulimpatient.com/mr2ybtg778?key=9226cef44dcb9cc9cb86abcf1b81715f";
const REDIRECT_LIMIT = 3; // Maximum redirects per hour
const ONE_HOUR = 3600000; // 1 hour in milliseconds

/**
 * Checks if a redirect is allowed based on frequency limits.
 * @returns {boolean}
 */
const shouldRedirect = () => {
  if (typeof window === "undefined") return false;

  const now = Date.now();
  const lastTime = parseInt(localStorage.getItem("monetization_last_time") || "0");
  let count = parseInt(localStorage.getItem("monetization_count") || "0");

  // Reset count if an hour has passed
  if (now - lastTime > ONE_HOUR) {
    count = 0;
    localStorage.setItem("monetization_count", "0");
  }

  return count < REDIRECT_LIMIT;
};

/**
 * Updates the redirect tracking in localStorage.
 */
const markRedirect = () => {
  if (typeof window === "undefined") return;

  const now = Date.now();
  let count = parseInt(localStorage.getItem("monetization_count") || "0");
  
  localStorage.setItem("monetization_last_time", now.toString());
  localStorage.setItem("monetization_count", (count + 1).toString());
};

/**
 * Handles a monetized action (Watch, Download, or Server 5).
 * Triggers a Smartlink redirect if within limits, then executes the original action.
 * @param {string} type - 'watch', 'download', or 'server5'
 * @param {function} originalAction - The function to execute after (or instead of) the redirect
 * @param {boolean} ignoreLimit - If true, the redirect happens every time
 */
export const handleMonetizedAction = (
  type,
  originalAction,
  ignoreLimit = false,
) => {
  if (ignoreLimit || shouldRedirect()) {
    // Analytics for the redirect
    trackEvent("monetization_redirect_triggered", { type, ignoreLimit });

    // Only mark/count if we are respecting the limit
    if (!ignoreLimit) {
      markRedirect();
    }

    // Trigger the Smartlink in a new tab
    window.open(`/go/${type}`, "_blank");
  } else {
    // Under limit - just track the normal interaction
    trackEvent("monetization_limit_reached", { type });
  }

  // Always proceed with the original user action in the main tab (if provided)
  // For Server 5, we usually pass null for originalAction to avoid server switching
  if (typeof originalAction === "function") {
    originalAction();
  }
};
