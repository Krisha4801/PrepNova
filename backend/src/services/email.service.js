const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.templateCache = new Map();
    this.sentEmails = []; // For test tracking/inspection in test mode
  }

  /**
   * Initializes or returns the cached Nodemailer transporter.
   */
  getTransporter() {
    // In unit test environment without explicit live test flag, use deterministic memory transport
    if (process.env.NODE_ENV === "test" && process.env.TEST_LIVE_EMAIL !== "true") {
      return {
        sendMail: async (mailOptions) => {
          const sent = {
            messageId: `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ...mailOptions,
            sentAt: new Date()
          };
          this.sentEmails.push(sent);
          return sent;
        },
        verify: async () => true
      };
    }

    if (this.transporter) {
      return this.transporter;
    }

    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const rawPass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
    const pass = rawPass ? String(rawPass).replace(/\s+/g, "") : "";

    if (!user || !pass) {
      console.warn(
        "[EmailService] Warning: No email credentials found (EMAIL_USER / EMAIL_PASS / SMTP_USER / SMTP_PASSWORD). Emails will not be delivered."
      );
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    // Use Gmail service preset if Gmail address or explicit host
    if ((user && user.includes("@gmail.com")) || (!host && user)) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user,
          pass
        }
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: host || "smtp.gmail.com",
        port,
        secure,
        auth: {
          user: user || "",
          pass: pass || ""
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }

    return this.transporter;
  }

  /**
   * Reads and caches email templates from disk.
   */
  getTemplate(templateName) {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    const templatePath = path.join(__dirname, "..", "emails", "templates", `${templateName}.html`);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${templateName}`);
    }

    const content = fs.readFileSync(templatePath, "utf8");
    this.templateCache.set(templateName, content);
    return content;
  }

  /**
   * Renders HTML content by interpolating template variables into base layout.
   */
  renderTemplate(templateName, data = {}) {
    const baseTemplate = this.getTemplate("base");
    const childTemplate = this.getTemplate(templateName);

    const mergedData = {
      year: new Date().getFullYear(),
      ...data
    };

    // Interpolate child template
    let content = childTemplate;
    for (const [key, value] of Object.entries(mergedData)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      content = content.replace(regex, value != null ? String(value) : "");
    }

    // Interpolate base template
    let finalHtml = baseTemplate.replace(/{{content}}/g, content);
    for (const [key, value] of Object.entries(mergedData)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      finalHtml = finalHtml.replace(regex, value != null ? String(value) : "");
    }

    return finalHtml;
  }

  /**
   * Get default sender address and display name from environment.
   */
  getFromAddress() {
    const fromName = process.env.EMAIL_FROM_NAME || "PrepNova";
    const fromAddress =
      process.env.EMAIL_FROM ||
      process.env.EMAIL_USER ||
      process.env.SMTP_USER ||
      "no-reply@prepnova.com";
    return `"${fromName}" <${fromAddress}>`;
  }

  /**
   * Core mail dispatcher.
   */
  async sendMail({ to, subject, html, text }) {
    const transporter = this.getTransporter();
    const from = this.getFromAddress();
    const replyTo = process.env.EMAIL_REPLY_TO || "support@prepnova.com";

    try {
      const info = await transporter.sendMail({
        from,
        to,
        replyTo,
        subject,
        html,
        text
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (err) {
      console.error(`[EmailService] Failed to send email to ${to}: ${err.message}`);
      const deliveryError = new Error("Unable to deliver email. Please try again later.");
      deliveryError.statusCode = 502;
      deliveryError.originalError = err.message;
      throw deliveryError;
    }
  }

  /**
   * Sends the 6-digit Password Reset OTP email.
   */
  async sendPasswordResetEmail({ to, name, otp, expiresInMinutes = 10 }) {
    const subject = "Reset your PrepNova password";
    const safeName = name ? name.trim() : "Candidate";

    const html = this.renderTemplate("password-reset", {
      name: safeName,
      otp,
      expiresInMinutes,
      subject
    });

    const text = [
      "PREPNOVA - Password Reset Request",
      "==================================",
      "",
      `Hello ${safeName},`,
      "",
      "We received a request to reset the password associated with your PrepNova account.",
      "",
      `Your 6-digit verification code is: ${otp}`,
      `This code will expire in ${expiresInMinutes} minutes.`,
      "",
      "For your security:",
      "- Never share this code with anyone.",
      "- PrepNova support will never ask you for this code.",
      "- If you did not request a password reset, you can safely ignore this email.",
      "",
      "Regards,",
      "PrepNova Security Team"
    ].join("\n");

    return await this.sendMail({ to, subject, html, text });
  }

  /**
   * Sends password changed confirmation security notice.
   */
  async sendPasswordChangedEmail({ to, name, email }) {
    const subject = "Your PrepNova password was changed";
    const safeName = name ? name.trim() : "Candidate";
    const timestamp = new Date().toUTCString();

    const html = this.renderTemplate("password-changed", {
      name: safeName,
      email: email || to,
      timestamp,
      subject
    });

    const text = [
      "PREPNOVA - Security Alert",
      "=========================",
      "",
      `Hello ${safeName},`,
      "",
      `The password for your PrepNova account (${email || to}) was successfully changed on ${timestamp}.`,
      "",
      "All existing active sessions across your devices have been terminated for security. You can now sign in with your new password.",
      "",
      "If you did not authorize this change, please contact our security team immediately at support@prepnova.com.",
      "",
      "Regards,",
      "PrepNova Security Team"
    ].join("\n");

    return await this.sendMail({ to, subject, html, text });
  }

  /**
   * Sends informational notice to users whose account was registered via Google OAuth.
   */
  async sendGoogleAccountNoticeEmail({ to, name }) {
    const subject = "Google Sign-In Account Notice - PrepNova";
    const safeName = name ? name.trim() : "Candidate";

    const html = this.renderTemplate("google-account-notice", {
      name: safeName,
      subject
    });

    const text = [
      "PREPNOVA - Account Notice",
      "=========================",
      "",
      `Hello ${safeName},`,
      "",
      "We received a password reset request for your PrepNova account.",
      "However, your account was created using Google Sign-In and does not use a separate password.",
      "",
      "Please sign in by clicking 'Continue with Google' on the login page.",
      "",
      "If you did not request this, you can safely ignore this email.",
      "",
      "Regards,",
      "PrepNova Security Team"
    ].join("\n");

    return await this.sendMail({ to, subject, html, text });
  }

  /**
   * Clears in-memory test email logs (useful between unit tests).
   */
  clearSentEmails() {
    this.sentEmails = [];
  }
}

module.exports = new EmailService();
