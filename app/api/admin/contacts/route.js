import dbConnect from "@/lib/db";
import Contact from "@/models/Contact";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Simple check: only allow if admin query param is passed (in production, use proper JWT/session)
    const { searchParams } = new URL(req.url);
    const adminToken = searchParams.get("admin");

    if (!adminToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch all contacts, sorted by newest first
    const contacts = await Contact.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, contacts }, { status: 200 });
  } catch (err) {
    console.error("Fetch contacts error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
