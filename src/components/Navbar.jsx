import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Star, LogOut, LayoutDashboard, LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/8" style={{ background: 'rgba(15,12,28,0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 shadow-md group-hover:shadow-primary-500/40 transition-shadow">
            <Star size={18} className="text-white" fill="white" />
          </div>
          <span className="font-display text-xl font-bold bg-gradient-to-r from-primary-300 to-purple-300 bg-clip-text text-transparent">
            Infinite Locus
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" id="nav-admin" className="btn-ghost flex items-center gap-1.5 text-sm">
                  <LayoutDashboard size={15} /> Admin
                </Link>
              )}
              <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-white/40">Signed in as</p>
                  <p className="text-sm font-medium text-white/80 leading-none">{user.profile?.name || user.email}</p>
                </div>
                <button
                  id="nav-signout"
                  onClick={handleSignOut}
                  className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/sign-in" id="nav-signin" className="btn-ghost flex items-center gap-1.5 text-sm">
                <LogIn size={15} /> Sign In
              </Link>
              <Link to="/sign-up" id="nav-signup" className="btn-primary flex items-center gap-1.5 !py-2 !px-4 text-sm">
                <UserPlus size={15} /> Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
