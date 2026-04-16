import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BusinessDetail from './pages/BusinessDetail';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import VerifyEmail from './pages/VerifyEmail';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-surface-900">
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(230,22%,14%)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: 'hsl(145,65%,52%)', secondary: 'white' } },
              error: { iconTheme: { primary: 'hsl(0,70%,55%)', secondary: 'white' } },
            }}
          />
          <Routes>
            {/* Auth routes (no navbar) */}
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* App routes (with navbar) */}
            <Route path="/*" element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/business/:id" element={<BusinessDetail />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
              </>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
