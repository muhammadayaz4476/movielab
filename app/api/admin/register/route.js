import dbConnect from "@/lib/db";
import Admin from "@/models/Admin";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

// Simple check - in production use proper API key or JWT
const ADMIN_REGISTRATION_SECRET = process.env.ADMIN_REGISTRATION_SECRET || "default_secret_change_this";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password, email, secret } = body || {};

    // Verify registration secret
    if (secret !== ADMIN_REGISTRATION_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!username || !password || !email) {
      return NextResponse.json(
        { error: "Username, password, and email are required" },
        { status: 400 }
      );
    }

    if (username.length < 3 || password.length < 6) {
      return NextResponse.json(
        { error: "Username must be 3+ chars and password 6+ chars" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }],
    });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const admin = await Admin.create({
      username,
      password: hashedPassword,
      email,
    });

    return NextResponse.json(
      { success: true, admin: { id: admin._id, username: admin.username, email: admin.email } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Admin registration error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}