import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, Activity, Brain, Target, Wallet, Briefcase, Trash2 } from 'lucide-react';
import ConditionModal from '../components/ConditionModal';
import api from '../services/api';
import { formatPrice, getCurrencySymbol } from '../utils/currency';

const Dashboard = () => {
  // State variables for dashboard data
  const [stats, setStats] = useState({ activeStocks: 0, totalAlerts: 0, profitPercentage: '0%', activeConditions: 0 });
  const [decisions, setDecisions] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCondition, setSelectedCondition] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, alertsRes, conditionsRes, portfolioRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => null),
        api.get('/dashboard/recent-alerts').catch(() => null),
        api.get('/conditions').catch(() => null),
        api.get('/portfolio').catch(() => null),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (alertsRes?.data) setDecisions(alertsRes.data);
      if (conditionsRes?.data) setConditions(conditionsRes.data.slice(0, 10));
      if (portfolioRes?.data) setPortfolioData(portfolioRes.data);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCondition = async (id, symbol) => {
    if (window.confirm(`Are you sure you want to delete ${symbol} condition?`)) {
      try {
        await api.delete(`/conditions/${id}`);
        setConditions(conditions.filter(c => c._id !== id));
      } catch (err) {
        console.error('Failed to delete condition:', err);
        alert(err.response?.data?.message || 'Failed to delete condition');
      }
    }
  };

  const getActionBadge = (action) => {
    switch (action?.toUpperCase()) {
      case 'BUY': return 'badge buy';
      case 'SELL': return 'badge sell';
      case 'HOLD': return 'badge hold';
      case 'DROP': return 'badge sell';
      case 'EXPIRED': return 'badge hold';
      default: return 'badge hold';
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return { className: 'badge hold', label: 'Pending' };
      case 'ACTIVE': return { className: 'badge buy', label: 'Active' };
      case 'COMPLETED': return { className: 'badge buy', label: 'Completed' };
      case 'EXPIRED': return { className: 'badge sell', label: 'Expired' };
      case 'CANCELLED': return { className: 'badge hold', label: 'Cancelled' };
      default: return { className: 'badge hold', label: status };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
    >
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Welcome back. Here's your trading overview.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-cards">
        <motion.div variants={itemVariants} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'var(--color-primary-light)', padding: '1rem', borderRadius: 'var(--radius-lg)', color: 'var(--color-primary)' }}>
            <Activity size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Watchlist Stocks</p>
            <h2 style={{ fontSize: '1.875rem' }}>{stats.activeStocks}</h2>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'var(--color-buy-bg)', padding: '1rem', borderRadius: 'var(--radius-lg)', color: 'var(--color-buy)' }}>
            <Target size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Active Conditions</p>
            <h2 style={{ fontSize: '1.875rem' }}>{stats.activeConditions || 0}</h2>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'var(--color-sell-bg)', padding: '1rem', borderRadius: 'var(--radius-lg)', color: 'var(--color-sell)' }}>
            <AlertCircle size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total Alerts</p>
            <h2 style={{ fontSize: '1.875rem' }}>{stats.totalAlerts}</h2>
          </div>
        </motion.div>
      </div>

      {/* Portfolio Summary Cards */}
      {portfolioData && (
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <motion.div variants={itemVariants} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(59,130,246,0.15)', padding: '1rem', borderRadius: 'var(--radius-lg)', color: '#3B82F6' }}>
              <Wallet size={28} />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Virtual Balance</p>
              <h2 style={{ fontSize: '1.5rem' }}>{formatPrice(portfolioData.virtualBalance, 'INR.NS')}</h2>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card" style={{
            display: 'flex', alignItems: 'center', gap: '1.5rem',
            borderColor: (portfolioData.totalProfitLoss || 0) >= 0 ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,68,0.2)',
          }}>
            <div style={{
              background: (portfolioData.totalProfitLoss || 0) >= 0 ? 'var(--color-buy-bg)' : 'var(--color-sell-bg)',
              padding: '1rem', borderRadius: 'var(--radius-lg)',
              color: (portfolioData.totalProfitLoss || 0) >= 0 ? '#00FF88' : '#FF4444',
            }}>
              {(portfolioData.totalProfitLoss || 0) >= 0 ? <TrendingUp size={28} /> : <TrendingUp size={28} />}
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total P&L</p>
              <h2 style={{
                fontSize: '1.5rem',
                color: (portfolioData.totalProfitLoss || 0) >= 0 ? '#00FF88' : '#FF4444',
              }}>
                {(portfolioData.totalProfitLoss || 0) >= 0 ? '+' : ''}{formatPrice(portfolioData.totalProfitLoss, 'INR.NS')}
                <span style={{ fontSize: '0.8rem', marginLeft: '0.3rem' }}>
                  ({(portfolioData.totalProfitLossPercent || 0) >= 0 ? '+' : ''}{portfolioData.totalProfitLossPercent?.toFixed(2) || '0.00'}%)
                </span>
              </h2>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(250,204,21,0.12)', padding: '1rem', borderRadius: 'var(--radius-lg)', color: '#FACC15' }}>
              <Briefcase size={28} />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Open Positions</p>
              <h2 style={{ fontSize: '1.875rem' }}>{portfolioData.openTrades?.length || 0}</h2>
            </div>
          </motion.div>
        </div>
      )}

      {/* Conditions Table + AI Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Recent Conditions</h3>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{conditions.length} total</span>
          </div>
          
          {conditions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
              <Target size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>No conditions set yet. Go to Conditions to create one.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {conditions.map((cond) => {
                const statusInfo = getStatusBadge(cond.status);
                return (
                  <div 
                    key={cond._id} 
                    onClick={() => setSelectedCondition(cond)}
                    style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '1rem', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                      background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{cond.symbol}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginLeft: '0.75rem' }}>
                        Buy ≤ {formatPrice(cond.buyPrice, cond.symbol)} · Target +{cond.targetProfitPercent}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={statusInfo.className}>{statusInfo.label}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCondition(cond._id, cond.symbol);
                        }}
                        style={{
                          background: 'none', border: 'none', color: 'var(--color-text-light)',
                          cursor: 'pointer', padding: '0.3rem', borderRadius: 'var(--radius-md)'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.color = '#FF4444'; e.currentTarget.style.background = 'rgba(255,68,68,0.1)' }}
                        onMouseOut={(e) => { e.currentTarget.style.color = 'var(--color-text-light)'; e.currentTarget.style.background = 'none' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Brain color="var(--color-primary)" size={24} />
            <h3 style={{ fontSize: '1.25rem' }}>AI Insights</h3>
          </div>
          
          {decisions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>No AI alerts yet. Set conditions and the AI will start monitoring.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
              {decisions.map((decision) => (
                <motion.div 
                  key={decision.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  style={{ 
                    background: 'var(--color-surface-hover)', 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{decision.stock}</span>
                    <span className={getActionBadge(decision.action)}>{decision.action}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    {decision.reason}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                    <span>Confidence: <strong style={{ color: 'var(--color-text-main)' }}>{Math.round(decision.confidence)}%</strong></span>
                    <span>{decision.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <ConditionModal 
        condition={selectedCondition} 
        onClose={() => setSelectedCondition(null)}
        onDelete={(id) => {
          setConditions(conditions.filter(c => c._id !== id));
        }}
      />
    </motion.div>
  );
};

export default Dashboard;
