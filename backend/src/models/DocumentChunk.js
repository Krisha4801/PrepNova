const mongoose = require("mongoose");

/**
 * DocumentChunk Schema
 * 
 * Provides durable MongoDB persistence for document text chunks and pre-computed
 * vector embeddings (384-dimensional normalized vectors from BAAI/bge-small-en-v1.5).
 * 
 * This prevents data loss when ChromaDB runs on an ephemeral container or local disk,
 * and eliminates the need to re-run expensive neural embedding models upon rehydration.
 */
const DocumentChunkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    documentType: {
      type: String,
      enum: ["resume", "jd"],
      required: true,
      index: true
    },
    documentId: {
      type: String,
      required: true,
      index: true
    },
    chunkIndex: {
      type: Number,
      required: true
    },
    chunkId: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    section: {
      type: String,
      default: "general"
    },
    embedding: {
      type: [Number],
      required: true,
      default: []
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring idempotent persistence and preventing chunk duplicates
DocumentChunkSchema.index(
  { userId: 1, documentType: 1, documentId: 1, chunkIndex: 1 },
  { unique: true }
);

module.exports = mongoose.model("DocumentChunk", DocumentChunkSchema);
