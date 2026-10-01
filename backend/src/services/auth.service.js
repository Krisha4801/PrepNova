const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const { validateRegisterInput, validateLoginInput } = require("../validators/auth.validator");

function checkDatabaseReady() {
  if (mongoose.connection.readyState !== 1) {
    const err = new Error("Database service is currently unavailable. Please ensure MongoDB is running.");
    err.statusCode = 503;
    throw err;
  }
}

class AuthService {
  /**
   * Registers a new user account.
   */
  async register(data = {}) {
    checkDatabaseReady();
    const validation = validateRegisterInput(data);
    if (!validation.isValid) {
      const err = new Error(validation.errors[0]);
      err.statusCode = 400;
      err.errors = validation.errors;
      throw err;
    }

    const {
      name,
      password,
      role,
      userType,
      targetRole,
      organization,
      experienceLevel,
      university,
      course,
      phone,
      location,
      bio,
      avatar
    } = data;
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const err = new Error("An account with this email address already exists.");
      err.statusCode = 409;
      throw err;
    }

    // Hash password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user document (flexible for any candidate: professional, student, job seeker)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      role: role === "admin" ? "admin" : "user",
      userType: userType || "",
      targetRole: targetRole || "Software Engineer",
      organization: organization ? organization.trim() : (university ? university.trim() : ""),
      experienceLevel: experienceLevel || "",
      university: university ? university.trim() : "",
      course: course ? course.trim() : "",
      phone: phone ? phone.trim() : "",
      location: location ? location.trim() : "",
      bio: bio ? bio.trim() : "",
      avatar: avatar || ""
    });

    // Generate JWT token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    return {
      user: user.toJSON(),
      token
    };
  }

  /**
   * Authenticates user credentials and generates a JWT.
   */
  async login(data = {}) {
    checkDatabaseReady();
    const validation = validateLoginInput(data);
    if (!validation.isValid) {
      const err = new Error(validation.errors[0]);
      err.statusCode = 400;
      err.errors = validation.errors;
      throw err;
    }

    const { password } = data;
    const normalizedEmail = data.email.trim().toLowerCase();

    // Find user by normalized email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const err = new Error("Invalid email or password.");
      err.statusCode = 401;
      throw err;
    }

    // Compare password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error("Invalid email or password.");
      err.statusCode = 401;
      throw err;
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    return {
      user: user.toJSON(),
      token
    };
  }

  /**
   * Retrieves profile of current authenticated user.
   */
  async getMe(userId) {
    checkDatabaseReady();
    if (!userId) {
      const err = new Error("User identifier is required.");
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      throw err;
    }

    return user.toJSON();
  }
}

module.exports = new AuthService();
