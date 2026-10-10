const mongoose = require("mongoose");

const JobDescriptionSchema = new mongoose.Schema(
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
    title: {
      type: String,
      trim: true,
      default: null
    },
    company: {
      type: String,
      trim: true,
      default: null
    },
    location: {
      type: String,
      trim: true,
      default: null
    },
    rawText: {
      type: String,
      default: null
    },
    originalFilename: {
      type: String,
      default: null
    },
    parsedData: {
      job_info: {
        title: String,
        company: String,
        location: String,
        employment_type: String
      },
      requirements: {
        required_skills: [String],
        preferred_skills: [String],
        education: [String],
        experience: [String]
      },
      responsibilities: {
        items: [String]
      },
      technologies: [String],
      soft_skills: [String],
      qualifications: [String]
    },
    indexedInChroma: {
      type: Boolean,
      default: false
    },
    chunksCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("JobDescription", JobDescriptionSchema);
