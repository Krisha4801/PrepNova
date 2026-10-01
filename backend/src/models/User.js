const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    // User profile metadata (flexible for students, professionals, and job seekers)
    userType: {
      type: String,
      enum: ["student", "professional", "job_seeker", "other", ""],
      default: ""
    },
    targetRole: {
      type: String,
      trim: true,
      default: "Software Engineer"
    },
    experienceLevel: {
      type: String,
      trim: true,
      default: ""
    },
    organization: {
      type: String,
      trim: true,
      default: ""
    },
    university: {
      type: String,
      trim: true,
      default: ""
    },
    course: {
      type: String,
      trim: true,
      default: ""
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    location: {
      type: String,
      trim: true,
      default: ""
    },
    bio: {
      type: String,
      trim: true,
      default: ""
    },
    avatar: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model("User", UserSchema);
