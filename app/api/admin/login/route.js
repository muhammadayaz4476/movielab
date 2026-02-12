import dbConnect from "@/lib/db";
import Admin from "@/models/Admin";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Compare password with bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json(
      { success: true, admin: { id: admin._id, username: admin.username, email: admin.email } },
      { status: 200 }
    );
  } catch (err) {
    console.error("Admin login error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
