import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Mail,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  forgotPasswordApi,
  verifyResetOtpApi,
  resetPasswordApi,
  resendResetOtpApi
} from '../lib/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Multi-step flow: 'request' | 'verify' | 'reset' | 'success'
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputsRef = useRef([]);

  // Resend cooldown timer countdown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Mask email for display in Step 2: "jaimin@example.com" -> "j***n@example.com"
  const maskEmail = (str) => {
    if (!str || !str.includes('@')) return str;
    const [local, domain] = str.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  };

  // STEP 1: Submit Forgot Password Request
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await forgotPasswordApi(email);
      setSuccessMessage(response.message || 'If an account exists, a verification code has been sent.');
      setResendCooldown(45);
      setStep('verify');
      setTimeout(() => {
        if (otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      }, 100);
    } catch (err) {
      setError(err.message || 'Unable to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input Key Handling & Auto-Focus
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, ''); // Numeric only
    if (!cleanVal) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // Handle paste of full 6-digit code
    if (cleanVal.length > 1) {
      const pastedDigits = cleanVal.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedDigits.forEach((digit, idx) => {
        if (idx < 6) newOtp[idx] = digit;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(pastedDigits.length, 5);
      if (otpInputsRef.current[nextIdx]) {
        otpInputsRef.current[nextIdx].focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanVal[0];
    setOtp(newOtp);

    // Auto-advance to next input box
    if (cleanVal && index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      if (otpInputsRef.current[index - 1]) {
        otpInputsRef.current[index - 1].focus();
      }
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await verifyResetOtpApi(email, fullOtp);
      setResetToken(response.resetToken);
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setError('');
    setSuccessMessage('');
    setResending(true);

    try {
      const response = await resendResetOtpApi(email);
      setSuccessMessage('A fresh verification code has been dispatched to your email.');
      setResendCooldown(45);
      setOtp(['', '', '', '', '', '']);
      if (otpInputsRef.current[0]) {
        otpInputsRef.current[0].focus();
      }
    } catch (err) {
      setError(err.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPasswordApi(resetToken, newPassword, confirmPassword);
      setStep('success');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please start a new request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      {/* Left Branding Panel (Desktop 42%) */}
      <div className="hidden lg:flex flex-col w-[42%] bg-[#0B132B] dark:bg-[#070C1B] p-12 text-white justify-between relative overflow-hidden border-r border-slate-800">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-xs group-hover:bg-indigo-500 transition-colors">
              P
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">PrepNova</span>
              <span className="block text-[11px] font-medium text-slate-400">Interview Intelligence</span>
            </div>
          </Link>

          <div className="mt-20 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Account Security</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.2] text-white">
              Self-service password recovery with timed one-time codes.
            </h1>

            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Verify your identity securely with a 6-digit email OTP and regain access to your candidate workspace in seconds.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4 pt-10 border-t border-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 border border-indigo-800/50">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Cryptographic Protection</p>
              <p className="text-xs text-slate-400 mt-0.5">Verification codes are hashed with SHA-256 and never stored in plain text.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Content Form Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[440px]">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                P
              </div>
              <span className="text-xl font-bold tracking-tight">PrepNova</span>
            </Link>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-7 sm:p-9 shadow-sm border border-slate-200/80 dark:border-slate-800">
            {/* Error Message Display */}
            {error && (
              <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium leading-relaxed flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message Banner */}
            {successMessage && step !== 'success' && (
              <div className="mb-6 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium leading-relaxed flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* STEP 1: REQUEST OTP */}
            {step === 'request' && (
              <div>
                <div className="mb-7">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Forgot password?</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
                    Enter the email address associated with your PrepNova account and we'll send you a 6-digit verification code.
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="candidate@domain.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full btn-primary h-11 mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send verification code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </div>
            )}

            {/* STEP 2: VERIFY OTP */}
            {step === 'verify' && (
              <div>
                <div className="mb-7">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Enter verification code</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
                    We sent a 6-digit code to <span className="font-semibold text-slate-800 dark:text-slate-200">{maskEmail(email)}</span>. It will expire in 10 minutes.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* 6-box OTP Input Grid */}
                  <div className="flex justify-between gap-2 sm:gap-2.5">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-12 h-13 text-center text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-slate-900 dark:text-white transition-all shadow-2xs"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.join('').length !== 6}
                    className="w-full btn-primary h-11"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('request');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change email</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || resending}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:text-slate-400 disabled:no-underline transition-colors"
                  >
                    {resending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? '' : 'hover:rotate-180 transition-transform'}`} />
                    )}
                    <span>
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SET NEW PASSWORD */}
            {step === 'reset' && (
              <div>
                <div className="mb-7">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Set new password</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
                    Create a strong, unique password to secure your PrepNova account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoFocus
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password requirement indicator */}
                  <div className="py-1">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <span>Must be at least 6 characters</span>
                    </p>
                    {confirmPassword && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${newPassword === confirmPassword ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="w-full btn-primary h-11 mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving new password...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 'success' && (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Password updated!
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed max-w-sm mx-auto">
                  Your PrepNova password has been changed successfully. All previous sessions have been signed out.
                </p>

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full btn-primary h-11"
                  >
                    <span>Sign In with New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
