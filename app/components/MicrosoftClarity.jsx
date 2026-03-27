"use client";

import { useEffect } from "react";
import clarity from "@microsoft/clarity";

const CLARITY_PROJECT_ID = "w2312tqk1x";

export default function MicrosoftClarity() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__clarityInitialized) return;
    window.__clarityInitialized = true;

    clarity.init(CLARITY_PROJECT_ID);
  }, []);

  return null;
}

