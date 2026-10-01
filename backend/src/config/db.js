const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prepnova";

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB Connected: ${uri}`);
  } catch (error) {
    console.warn(`MongoDB connection error (${uri}): ${error.message}`);
    console.warn("Continuing without MongoDB. Ensure MongoDB service is running (mongod or Windows service).");
  }
};

module.exports = connectDB;
