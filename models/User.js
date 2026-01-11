import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
    unique: true,
    trim: true,
    maxlength: [20, "Username cannot be more than 20 characters"],
  },
  watchLater: [
    {
      id: { type: String, required: true }, // TMDB ID (kept as String for consistency)
      title: String,
      poster_path: String,
      media_type: String,
      vote_average: Number,
      release_date: String,
      addedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
