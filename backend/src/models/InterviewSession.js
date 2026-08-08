const mongoose = require("mongoose");

const InterviewSessionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  role: String,
  questions: [String],
  answers: [String],
  score: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("InterviewSession", InterviewSessionSchema);
