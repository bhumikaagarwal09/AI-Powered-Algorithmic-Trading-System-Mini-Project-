import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Clock, Brain, RefreshCw, BarChart2 } from 'lucide-react';
import api from '../services/api';
import { formatPrice } from '../utils/currency';

const AlertHistory = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/alerts');
      // Backend returns { count, alerts }
      const data = response.data;
      setAlerts(data.alerts || data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action?.toUpperCase()) {
      case 'BUY': return 'badge buy';
      case 'SELL': return 'badge sell';
      case 'DROP': return 'badge sell';
      case 'EXPIRED': return 'badge hold';
      default: return 'badge hold';
    }
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <div>
          <h1>Alert History</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Historical AI analysis and system notifications.</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto', background: 'var(--color-surface)', color: 'var(--color-text-main)', border: '1px solid var(--color-border)' }} onClick={fetchAlerts}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
          <RefreshCw className="animate-spin" size={32} color="var(--color-text-light)" />
        </div>
      ) : alerts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-border)' }}
        >
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>All Caught Up!</h3>
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '400px' }}>
            No alerts generated yet. AI will notify you automatically when your conditions are met.
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {alerts.map((alert) => (
              <motion.div
                key={alert._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'minmax(150px, 200px) 1fr 200px', gap: '1.5rem', alignItems: 'center' }}
              >
                {/* Left: Ticker & Action */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderRight: '1px solid var(--color-border)', paddingRight: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{alert.symbol}</h3>
                  </div>
                  <div>
                    <span className={getActionBadge(alert.alertType)} style={{ padding: '0.35rem 1rem', fontSize: '0.875rem' }}>
                      {alert.alertType}
                    </span>
                  </div>
                </div>

                {/* Middle: AI Note / Reason */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-main)', fontWeight: 600 }}>
                    <Brain size={18} color="var(--color-primary)" /> AI Reasoning
                  </div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {alert.aiNote || `Price triggered at ${formatPrice(alert.triggerPrice, alert.symbol)}. ${alert.profitPercent != null ? `P/L: ${alert.profitPercent > 0 ? '+' : ''}${alert.profitPercent.toFixed(2)}%` : ''}`}
                  </p>
                </div>

                {/* Right: Meta */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    <Clock size={16} />
                    {formatDate(alert.createdAt)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', background: 'var(--color-background)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)' }}>
                    <BarChart2 size={14} color="var(--color-primary)" />
                    Price: <strong style={{ color: 'var(--color-text-main)' }}>{formatPrice(alert.triggerPrice, alert.symbol)}</strong>
                  </div>
                  {alert.emailSent && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                      <Mail size={12} /> Email Sent
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default AlertHistory;
