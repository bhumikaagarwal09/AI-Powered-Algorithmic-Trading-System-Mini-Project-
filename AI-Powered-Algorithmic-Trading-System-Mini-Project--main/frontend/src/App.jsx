import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Watchlist from './pages/Watchlist';
import ConditionSetup from './pages/ConditionSetup';
import AlertHistory from './pages/AlertHistory';
import Portfolio from './pages/Portfolio';
import Trade from './pages/Trade';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Simple PrivateRoute wrapper block
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Component to handle Google OAuth callback token from URL
const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      // Fetch user info with the new token
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.user?.name) {
            localStorage.setItem('userName', data.user.name);
          }
          navigate('/dashboard', { replace: true });
        })
        .catch(() => {
          // Even if /me fails, we have the token — proceed
          localStorage.setItem('userName', 'Investor');
          navigate('/dashboard', { replace: true });
        });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-muted)' }}>
      Signing you in...
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Google OAuth callback — captures ?token= from URL */}
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* Protected Routes directly embedded into layout */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="trade" element={<Trade />} />
          <Route path="conditions" element={<ConditionSetup />} />
          <Route path="alerts" element={<AlertHistory />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
