import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import toast from 'react-hot-toast';
import { Mail, Lock, User, UserPlus, Star } from 'lucide-react';

export default function SignUp() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { data, error } = await insforge.auth.signUp({
      email: form.email,
      password: form.password,
      name: form.name,
    });
    if (error) {
      toast.error(error.message || 'Registration failed');
    } else if (data?.requireEmailVerification) {
      toast.success('Account created! Check your email for a verification code.');
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } else {
      toast.success('Account created! Please sign in.');
      navigate('/sign-in');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-lg">
              <Star size={24} className="text-white" fill="white" />
            </div>
            <span className="font-display text-2xl font-bold bg-gradient-to-r from-primary-300 to-purple-300 bg-clip-text text-transparent">
              Infinite Locus
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Create account</h1>
          <p className="text-white/50 text-sm">Join thousands discovering great local businesses</p>
        </div>

        <div className="glass-card p-8 !hover:transform-none">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input id="signup-name" type="text" required placeholder="John Doe" className="input-field pl-10"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input id="signup-email" type="email" required placeholder="you@example.com" className="input-field pl-10"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input id="signup-password" type="password" required placeholder="Min. 6 characters" className="input-field pl-10"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
            <button id="signup-submit" type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><UserPlus size={18} /> Create Account</>
              )}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-primary-300 hover:text-primary-200 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
