import { createContext, useContext, useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await insforge.auth.getCurrentUser();
      setUser(data?.user || null);
      setLoading(false);
    };
    init();
  }, []);

  const signOut = async () => {
    await insforge.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await insforge.auth.getCurrentUser();
    setUser(data?.user || null);
  };

  const isAdmin = user?.profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signOut, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
