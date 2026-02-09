import dbConnect from "../../../lib/db";
import Contact from "../../../models/Contact";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, message } = body || {};

    if (!name || !message) {
      return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
    }

    if (name.length < 2 || message.length < 5) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await dbConnect();

    const contact = await Contact.create({ name: name.trim(), message: message.trim() });

    return NextResponse.json({ success: true, id: contact._id }, { status: 201 });
  } catch (err) {
    console.error("Contact save error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
