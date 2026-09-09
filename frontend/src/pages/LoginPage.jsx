import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col w-[40%] bg-primary p-12 text-white justify-between relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary font-bold text-2xl shadow-lg">
              P
            </div>
            <span className="text-2xl font-extrabold tracking-tight">PrepNova</span>
          </Link>
          
          <div className="mt-24">
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
              Ace your next<br />technical interview.
            </h1>
            <p className="mt-6 text-indigo-100 text-lg max-w-md font-medium">
              Join thousands of engineers practicing with AI-driven mock interviews and real-time ATS feedback.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6 pt-12 border-t border-indigo-400/30">
          <div>
            <div className="text-2xl font-bold">10k+</div>
            <div className="text-indigo-200 text-sm mt-1">Mock Interviews</div>
          </div>
          <div>
            <div className="text-2xl font-bold">84</div>
            <div className="text-indigo-200 text-sm mt-1">Average ATS</div>
          </div>
          <div>
            <div className="text-2xl font-bold">92%</div>
            <div className="text-indigo-200 text-sm mt-1">Placement</div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 relative bg-[#F8FAFC]">
        <div className="w-full max-w-[420px] bg-white rounded-[24px] p-8 shadow-soft border border-border">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-heading">Welcome back</h2>
            <p className="text-body mt-2 text-sm font-medium">Enter your details to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-heading uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm text-heading font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-heading uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm text-heading font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <span className="text-sm font-medium text-body">Remember me</span>
              </label>
              <a href="#" className="text-sm font-bold text-primary hover:text-indigo-700">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center disabled:opacity-70 mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400 font-medium">or continue with</span>
            </div>
          </div>

          <button type="button" className="mt-8 w-full h-12 bg-white hover:bg-gray-50 border border-border text-heading rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
        </div>

        <p className="mt-8 text-sm font-medium text-body">
          Don't have an account? <Link to="/signup" className="font-bold text-primary hover:text-indigo-700">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}
