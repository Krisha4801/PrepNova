import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    course: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign up');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Panel - Hidden on mobile, takes 40% on desktop */}
      <div className="hidden lg:flex flex-col w-[40%] bg-primary p-12 text-white justify-between relative overflow-hidden">
        <div className="absolute bottom-[-20%] right-[-10%] w-[120%] h-[120%] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary font-bold text-2xl shadow-lg">
              P
            </div>
            <span className="text-2xl font-extrabold tracking-tight">PrepNova</span>
          </Link>
          
          <div className="mt-24">
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
              Launch your<br />tech career.
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

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 relative bg-[#F8FAFC]">
        <div className="w-full max-w-[480px] bg-white rounded-[24px] p-8 shadow-soft border border-border">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-heading">Create your account</h2>
            <p className="text-body mt-2 text-sm font-medium">Start practicing for your dream role today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-heading uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm text-heading font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-heading uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm text-heading font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-heading uppercase tracking-wider">University</label>
                <input
                  type="text"
                  name="university"
                  required
                  value={formData.university}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm text-heading font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="e.g. Stanford University"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-heading uppercase tracking-wider">Course</label>
                <input
                  type="text"
                  name="course"
                  required
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm text-heading font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="e.g. Computer Science"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-heading uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm text-heading font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-heading uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm text-heading font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center disabled:opacity-70 mt-6"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

        </div>

        <p className="mt-8 text-sm font-medium text-body">
          Already have an account? <Link to="/login" className="font-bold text-primary hover:text-indigo-700">Log in</Link>
        </p>
      </div>
    </div>
  );
}
