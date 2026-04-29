import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; //navigation+routing
import { Mail, Lock, LogIn, Loader } from 'lucide-react'; //icons
import { motion } from 'framer-motion';//animation library
import api from '../services/api';
import loginIllustration from '../assets/login_illustration_1776524155268.png';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Handle email and password
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userName', response.data.user?.name || 'Investor');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="auth-container" style={{
      background: 'var(--color-background)',
    }}>
      <motion.div 
        className="glass-card auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          maxWidth: '850px', 
          padding: 0, 
          overflow: 'hidden' 
        }}
      >
        {/* Left side illustration */}
        <div style={{ flex: 1, background: '#1a2744', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src={loginIllustration} 
            alt="AI Assistant" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            className="animate-pulse-subtle"
          />
        </div>

        {/* Right side form */}
        <div style={{ flex: '1', padding: '3rem' }}>
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to continue to AITrade</p>
          </div>

          {error && (
            <div style={{ background: 'var(--color-sell-bg)', color: 'var(--color-sell)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--color-text-main)',
              transition: 'all 0.2s ease',
              marginBottom: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            color: 'var(--color-text-light)',
            fontSize: '0.8rem',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span>or sign in with email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                <input 
                  type="email" 
                  required
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem' }} 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem' }} 
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader className="animate-spin" size={20} /> : <LogIn size={20} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Don't have an account? <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Create account</Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
