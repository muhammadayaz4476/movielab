import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { working: false, error: "No URL provided" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Fast 3s timeout

    try {
      const response = await fetch(url, {
        method: "GET", // GET is more reliable than HEAD for status
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          // We intentionally don't set a specific Referer to avoid triggering strict anti-hotlink 403s if possible,
          // or we set a generic one. Real browser will send correct Referer.
        },
      });

      clearTimeout(timeoutId);

      const status = response.status;

      // Fail explicitly on dead links or server errors
      if (status === 404 || status >= 500) {
        return NextResponse.json({ working: false, status });
      }

      // Treat 200-299, 3xx, 401, 403, 405 as "Working" (or at least "Alive")
      // 403/401: likely anti-bot, but server exists.
      // 405: Method not allowed, but server exists.
      return NextResponse.json({ working: true, status });
    } catch (error) {
      clearTimeout(timeoutId);
      // Network errors (DNS, Connection Refused, Timeout) are failures
      return NextResponse.json({ working: false, error: error.message });
    }
  } catch (error) {
    return NextResponse.json(
      { working: false, error: error.message },
      { status: 500 }
    );
  }
}
