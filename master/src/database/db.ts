import mongoose from "mongoose";

export async function connectDB() {
  // const uri = "mongodb://localhost:27017";
  const uri = "mongodb://100.109.171.73:27017";
  const dbName = "git-tracker";

  try {
    await mongoose.connect(uri, {
      dbName, // 👈 ensures all models use the same database
    });
    console.log(`✅ Connected to MongoDB database: ${dbName}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
}
