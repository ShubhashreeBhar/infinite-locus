import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { insforge } from '../lib/insforge';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ShieldCheck, RefreshCw, Star } from 'lucide-react';

export default function VerifyEmail() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    const { data, error } = await insforge.auth.verifyEmail({ email, otp: code });
    if (error) {
      toast.error(error.message || 'Invalid or expired code');
    } else {
      setUser(data.user);
      toast.success('Email verified! Welcome to Infinite Locus 🎉');
      navigate('/');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await insforge.auth.resendVerificationEmail({ email });
    if (error) toast.error('Could not resend — try again');
    else toast.success('New code sent to your email!');
    setResending(false);
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-lg">
              <Star size={24} className="text-white" fill="white" />
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-emerald-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-white/50 text-sm">
            We sent a 6-digit code to<br />
            <span className="text-primary-300 font-medium">{email}</span>
          </p>
        </div>

        <div className="glass-card p-8 !hover:transform-none">
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2 text-center">Verification Code</label>
              <input
                id="verify-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                className="input-field text-center text-2xl tracking-widest font-bold"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <button id="verify-submit" type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Email'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button onClick={handleResend} disabled={resending} className="text-white/40 hover:text-white/70 text-sm flex items-center gap-1.5 mx-auto transition-colors">
              <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
