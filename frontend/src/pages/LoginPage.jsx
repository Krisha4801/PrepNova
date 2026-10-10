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
  ShieldCheck, 
  Layers, 
  Bot 
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthProcessing, setOauthProcessing] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithOAuthTicket } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      {/* Left Branding & Highlights Panel (Desktop 42%) */}
      <div className="hidden lg:flex flex-col w-[42%] bg-[#0B132B] dark:bg-[#070C1B] p-12 text-white justify-between relative overflow-hidden border-r border-slate-800">
        {/* Subtle geometric background grid */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative z-10">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-xs group-hover:bg-indigo-500 transition-colors">
              P
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">PrepNova</span>
              <span className="block text-[11px] font-medium text-slate-400">Interview Intelligence</span>
            </div>
          </Link>

          {/* Core Value Statement */}
          <div className="mt-20 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Realistic Interview Simulation</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.2] text-white">
              Practice role-specific interviews with structured rubric scoring.
            </h1>
            
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Target your technical depth, communication clarity, and problem-solving framework with deterministic evaluations.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-4 pt-10 border-t border-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 border border-indigo-800/50">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">User Data Isolation</p>
              <p className="text-xs text-slate-400 mt-0.5">Your sessions, custom roles, and responses remain private and secure.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 border border-indigo-800/50">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Adaptive Difficulty</p>
              <p className="text-xs text-slate-400 mt-0.5">Questions dynamically adjust across Beginner, Intermediate, and Advanced tiers.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Form Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[420px]">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                P
              </div>
              <span className="text-xl font-bold tracking-tight">PrepNova</span>
            </Link>
          </div>

          {/* Main Form Card */}
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-7 sm:p-9 shadow-sm border border-slate-200/80 dark:border-slate-800">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">Enter your credentials to access your candidate workspace.</p>
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
                <span>Verifying Google authentication and establishing your workspace session...</span>
              </div>
            )}

            {/* Real OAuth Single Sign-On Button */}
            <div className="mb-5">
              <OAuthButton provider="google" label="Continue with Google" disabled={oauthProcessing} />
            </div>

            {/* Subtle Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-[#0F172A] px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                or sign in with email
              </span>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary h-11 mt-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            New to PrepNova?{' '}
            <Link to="/signup" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
