#!/usr/bin/env node
/**
 * Setup script to create first admin user
 * Run: npm run create-admin
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const readline = require("readline");

// Load .env.local manually
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
}

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

const Admin = mongoose.model("Admin", AdminSchema);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

async function createAdmin() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error("ERROR: MONGODB_URI environment variable is not set");
      console.error("Please add it to your .env.local file");
      process.exit(1);
    }

    console.log("\n=== Admin Account Setup ===\n");

    // Get input
    const username = await question("Enter admin username (3+ chars): ");
    const email = await question("Enter admin email: ");
    const password = await question("Enter admin password (6+ chars): ");

    // Validate
    if (username.length < 3) {
      console.error("Username must be at least 3 characters");
      process.exit(1);
    }
    if (password.length < 6) {
      console.error("Password must be at least 6 characters");
      process.exit(1);
    }

    // Connect to DB
    console.log("\nConnecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected");

    // Check if admin exists
    const existing = await Admin.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      console.error(`ERROR: Admin with username "${username}" or email "${email}" already exists`);
      process.exit(1);
    }

    // Hash password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await Admin.create({
      username,
      email,
      password: hashedPassword,
    });

    console.log("\n✓ Admin account created successfully!");
    console.log(`\nLogin credentials:\nUsername: ${admin.username}\nEmail: ${admin.email}`);
    console.log("\nYou can now login at: /admin/login");

    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdmin();
