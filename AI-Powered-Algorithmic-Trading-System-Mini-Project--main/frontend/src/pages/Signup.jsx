import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      // Auto-login after registration
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userName', response.data.user?.name || name);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="auth-container" style={{
      background: 'var(--color-background)',
    }}>
      <motion.div 
        className="glass-card auth-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ padding: '3rem' }}
      >
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join AITrade and start growing your portfolio</p>
        </div>

        {error && (
          <div style={{ background: 'var(--color-sell-bg)', color: 'var(--color-sell)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
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
          <span>or sign up with email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        </div>

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
              <input 
                type="text" 
                required
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem' }} 
              />
            </div>
          </div>

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
             {loading ? <Loader className="animate-spin" size={20} /> : <UserPlus size={20} />}
             {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Signup;
