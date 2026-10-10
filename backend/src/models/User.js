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
      required: function() {
        return !this.authProviders || this.authProviders.length === 0;
      }
    },
    authProviders: [
      {
        provider: {
          type: String,
          required: true,
          lowercase: true,
          trim: true
        },
        providerUserId: {
          type: String,
          required: true,
          trim: true
        },
        email: {
          type: String,
          lowercase: true,
          trim: true
        },
        linkedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
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
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Authentication Session & Token Invalidation
    tokenVersion: {
      type: Number,
      default: 0
    },
    // Secure Password Reset OTP Fields (Never exposed in API responses)
    passwordResetOTPHash: {
      type: String,
      default: null
    },
    passwordResetOTPExpiresAt: {
      type: Date,
      default: null
    },
    passwordResetOTPAttempts: {
      type: Number,
      default: 0
    },
    passwordResetOTPVerifiedAt: {
      type: Date,
      default: null
    },
    passwordResetRequestedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret.password;
        delete ret.passwordResetOTPHash;
        delete ret.passwordResetOTPExpiresAt;
        delete ret.passwordResetOTPAttempts;
        delete ret.passwordResetOTPVerifiedAt;
        delete ret.passwordResetRequestedAt;
        delete ret.__v;
        return ret;
      }
    }
  }
);

UserSchema.index(
  { "authProviders.provider": 1, "authProviders.providerUserId": 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("User", UserSchema);
