import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/db";
import User from "../../../../models/User";

export async function POST(request) {
  try {
    await dbConnect();
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username is required" },
        { status: 400 }
      );
    }

    // Find existing user or create new one
    let user = await User.findOne({ username });

    if (!user) {
      user = await User.create({ username, watchLater: [] });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
