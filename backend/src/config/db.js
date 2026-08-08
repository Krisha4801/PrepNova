const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn("MONGO_URI not set. Continuing without MongoDB.");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.warn(`MongoDB unavailable: ${error.message}`);
    console.warn("Continuing without MongoDB. Auth/database-backed features may fail.");
  }
};

module.exports = connectDB;
