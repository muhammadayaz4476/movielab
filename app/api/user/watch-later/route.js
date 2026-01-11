import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/db";
import User from "../../../../models/User";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Sort by most recently added
    const list = user.watchLater.sort(
      (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
    );

    return NextResponse.json({ success: true, list });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const { username, movie } = await request.json();

    if (!username || !movie) {
      return NextResponse.json(
        { success: false, message: "Missing data" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if checks already exists
    const exists = user.watchLater.find((m) => m.id === movie.id.toString());
    if (exists) {
      return NextResponse.json({
        success: true,
        message: "Already in list",
        list: user.watchLater,
      });
    }

    // Add to list
    user.watchLater.push({
      id: movie.id.toString(),
      title: movie.title || movie.name,
      poster_path: movie.poster_path,
      media_type: movie.media_type,
      vote_average: movie.vote_average,
      release_date: movie.release_date || movie.first_air_date,
    });

    await user.save();

    return NextResponse.json({ success: true, list: user.watchLater });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { username, movieId } = await request.json();

    if (!username || !movieId) {
      return NextResponse.json(
        { success: false, message: "Missing data" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Remove from list
    user.watchLater = user.watchLater.filter(
      (m) => m.id !== movieId.toString()
    );
    await user.save();

    return NextResponse.json({ success: true, list: user.watchLater });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
