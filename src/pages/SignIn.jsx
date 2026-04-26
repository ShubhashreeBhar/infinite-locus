import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, Star } from 'lucide-react';

export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await insforge.auth.signInWithPassword(form);
    if (error) {
      toast.error(error.message || 'Invalid credentials');
    } else {
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.profile?.name || data.user.email}!`);
      if (data.user.profile?.role === 'admin') navigate('/admin');
      else navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-lg">
              <Star size={24} className="text-white" fill="white" />
            </div>
            <span className="font-display text-2xl font-bold bg-gradient-to-r from-primary-300 to-purple-300 bg-clip-text text-transparent">
              FeedTrust
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/50 text-sm">Sign in to discover and review local businesses</p>
        </div>

        <div className="glass-card p-8 !hover:transform-none">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                  id="signin-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                  id="signin-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-field pl-10"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>
            </div>
            <button id="signin-submit" type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn size={18} /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/sign-up" className="text-primary-300 hover:text-primary-200 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
