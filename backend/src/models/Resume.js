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
      candidate: {
        name: { type: String, default: null },
        email: { type: String, default: null },
        phone: { type: String, default: null },
        location: { type: String, default: null }
      },
      summary: { type: String, default: null },
      education: [
        {
          degree: String,
          institution: String,
          field: String,
          start_year: String,
          end_year: String
        }
      ],
      experience: [
        {
          company: String,
          role: String,
          start_date: String,
          end_date: String,
          description: [String],
          technologies: [String]
        }
      ],
      skills: {
        programming_languages: [String],
        frameworks: [String],
        databases: [String],
        cloud: [String],
        ai_ml: [String],
        tools: [String],
        other: [String]
      },
      projects: [
        {
          name: String,
          description: String,
          technologies: [String],
          responsibilities: [String]
        }
      ],
      certifications: [String],
      achievements: [String],
      links: [String]
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
