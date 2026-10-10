import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OAuthButton from '../components/auth/OAuthButton';
import { 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Briefcase, 
  Target, 
  Award 
} from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    targetRole: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthProcessing, setOauthProcessing] = useState(false);
  const [error, setError] = useState('');
  const { signup, loginWithOAuthTicket } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle incoming OAuth callback handoff ticket or errors
  useEffect(() => {
    const oauthTicket = searchParams.get('oauth_ticket');
    const oauthError = searchParams.get('oauth_error');

    if (oauthError) {
      setError(decodeURIComponent(oauthError));
    } else if (oauthTicket) {
      setOauthProcessing(true);
      setError('');
      loginWithOAuthTicket(oauthTicket)
        .then(() => {
          navigate('/dashboard', { replace: true });
        })
        .catch((err) => {
          setError(err.message || 'OAuth authentication failed. Please sign in again.');
          setOauthProcessing(false);
        });
    }
  }, [searchParams, loginWithOAuthTicket, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        organization: formData.organization,
        targetRole: formData.targetRole,
        password: formData.password
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      {/* Left Branding & Highlights Panel (Desktop 42%) */}
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
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get Started in Seconds</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.2] text-white">
              Elevate your interview performance.
            </h1>
            
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Tailored for software engineers, product managers, data scientists, and job seekers preparing for high-stakes technical interviews.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4 pt-10 border-t border-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 border border-indigo-800/50">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">For Any Background</p>
              <p className="text-xs text-slate-400 mt-0.5">Students, working professionals, and career switchers can all practice targeted roles.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 border border-indigo-800/50">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Objective Feedback</p>
              <p className="text-xs text-slate-400 mt-0.5">Instant scoring on technical correctness, structured clarity, and depth.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Registration Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[480px]">
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                P
              </div>
              <span className="text-xl font-bold tracking-tight">PrepNova</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-7 sm:p-9 shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create your account</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">Join candidate workspaces and start your mock sessions.</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium leading-relaxed flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                <span>{error}</span>
              </div>
            )}

            {oauthProcessing && (
              <div className="mb-5 p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-medium flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Creating candidate workspace from Google authentication...</span>
              </div>
            )}

            {/* Real OAuth Single Sign-On Button */}
            <div className="mb-5">
              <OAuthButton provider="google" label="Sign up with Google" disabled={oauthProcessing} />
            </div>

            {/* Subtle Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-[#0F172A] px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                or sign up with email
              </span>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    autoFocus
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Candidate Name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="you@domain.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Company / Org</span>
                    <span className="text-[11px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g. Acme Corp or University"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Target Role</span>
                    <span className="text-[11px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    name="targetRole"
                    value={formData.targetRole}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g. Frontend Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      className="input-field pr-9"
                      placeholder="Min 6 chars"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary h-11 mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
