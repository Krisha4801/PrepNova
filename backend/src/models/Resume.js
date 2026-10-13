const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true
    },
    fileSize: {
      type: Number,
      default: 0
    },
    mimeType: {
      type: String,
      default: "application/pdf"
    },
    extractionMethod: {
      type: String,
      enum: ["pdf_text", "ocr", "manual"],
      default: "pdf_text"
    },
    parsedData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    indexedInChroma: {
      type: Boolean,
      default: false
    },
    chunksCount: {
      type: Number,
      default: 0
    },
    detectedRole: {
      type: String,
      default: null
    },
    atsScore: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Resume", ResumeSchema);
