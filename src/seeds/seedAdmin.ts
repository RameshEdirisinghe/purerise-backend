import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import User from "../models/user.model";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const ADMIN_CREDENTIALS = {
  name: "Super Admin",
  email: "admin@purerise.com",
  password: "Admin@PureRise2024!",
  role: "admin" as const,
  accountStatus: "active" as const,
  isEmailVerified: true,
};

async function seedAdmin() {
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME || "purerise";

  if (!mongoUri) {
    console.error("MONGO_URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { dbName });
    console.log(`Connected to MongoDB — database: "${dbName}"`);

    const existing = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    if (existing) {
      console.log(`Admin already exists: ${existing.email}`);
      await mongoose.disconnect();
      return;
    }

    const admin = await User.create(ADMIN_CREDENTIALS);

    console.log("\nAdmin account seeded successfully!");
    console.log("-----------------------------------------");
    console.log(`  Name     : ${admin.name}`);
    console.log(`  Email    : ${admin.email}`);
    console.log(`  Password : ${ADMIN_CREDENTIALS.password}`);
    console.log(`  Role     : ${admin.role}`);
    console.log(`  Status   : ${admin.accountStatus}`);
    console.log("-----------------------------------------");
    console.log("Change the password after first login!\n");
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedAdmin();
