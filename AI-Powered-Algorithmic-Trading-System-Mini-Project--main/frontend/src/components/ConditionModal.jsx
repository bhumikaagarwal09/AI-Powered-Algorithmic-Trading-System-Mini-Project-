import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, Target, Clock, Bot, Activity, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../utils/currency';

const getStatusBadge = (status) => {
  switch (status) {
    case 'PENDING': return { label: 'Pending', className: 'badge pending' };
    case 'ACTIVE': return { label: 'Active', className: 'badge active pulse' };
    case 'COMPLETED': return { label: 'Completed', className: 'badge completed' };
    case 'EXPIRED': return { label: 'Expired', className: 'badge neutral' };
    case 'CANCELLED': return { label: 'Cancelled', className: 'badge cancelled' };
    default: return { label: status, className: 'badge neutral' };
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
};

const ConditionModal = ({ condition, onClose, onDelete }) => {
  if (!condition) return null;

  const statusInfo = getStatusBadge(condition.status);
  
  // Calculate specific fields
  const targetPrice = condition.buyPrice * (1 + (condition.targetProfitPercent / 100));
  
  const createdDate = new Date(condition.createdAt);
  const now = new Date();
  
  // Days Remaining logic
  let daysRemaining = '—';
  let daysTaken = '—';
  
  if (condition.status === 'PENDING' || condition.status === 'ACTIVE') {
    const elapsedDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    daysRemaining = Math.max(0, condition.maxDays - elapsedDays) + ' days';
  } else if (condition.status === 'COMPLETED' || condition.status === 'EXPIRED') {
    const endDate = new Date(condition.updatedAt);
    daysTaken = Math.floor((endDate - createdDate) / (1000 * 60 * 60 * 24)) + ' days';
  }

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${condition.symbol} condition?`)) {
      onDelete(condition._id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed', inset: 0, zIndex: 1000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#1E293B', borderRadius: 'var(--radius-xl)', 
            border: '1px solid var(--color-border)',
            width: '100%', maxWidth: '500px', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: '1.5rem', borderBottom: '1px solid var(--color-border)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>
                  {condition.symbol}
                </h2>
                <span className={statusInfo.className} style={{ transform: 'translateY(-2px)' }}>
                  {statusInfo.label}
                </span>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                Automated Trading Condition
              </p>
            </div>
            <button 
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)', border: 'none',
                color: 'var(--color-text-muted)', cursor: 'pointer',
                padding: '0.5rem', borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Core Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Target size={14} /> Buy Limit Price
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {formatPrice(condition.buyPrice, condition.symbol)}
                </div>
              </div>
              <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ color: 'var(--color-buy)', fontSize: '0.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Target size={14} /> Target Price (+{condition.targetProfitPercent}%)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#00FF88' }}>
                  {formatPrice(targetPrice, condition.symbol)}
                </div>
              </div>
            </div>

            {/* Timeline Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={14} /> Created At</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{formatDate(condition.createdAt)}</span>
              </div>
              {condition.activatedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={14} /> Activated At</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-primary)' }}>{formatDate(condition.activatedAt)}</span>
                </div>
              )}
              {condition.status === 'COMPLETED' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={14} color="#3B82F6" /> Completed At</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#3B82F6' }}>{formatDate(condition.updatedAt)}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14} /> Max Timeout</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{condition.maxDays} days</span>
              </div>
              
              {(condition.status === 'PENDING' || condition.status === 'ACTIVE') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14} /> Days Remaining</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{daysRemaining}</span>
                </div>
              )}
              
              {(condition.status === 'COMPLETED' || condition.status === 'EXPIRED') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14} /> Days Taken</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{daysTaken}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={14} /> Last Checked Price</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  {condition.lastCheckedPrice ? formatPrice(condition.lastCheckedPrice, condition.symbol) : '—'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Sell Type</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: condition.autoSell ? '#4ade80' : '#60a5fa' }}>
                  {condition.autoSell ? '⚡ Auto Sell Enabled' : '📧 Alert Only'}
                </span>
              </div>
            </div>

            {/* AI Note */}
            {condition.aiNote && (
              <div style={{ 
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                padding: '1rem', borderRadius: 'var(--radius-lg)',
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
              }}>
                <Bot size={18} color="#3B82F6" style={{ marginTop: '0.1rem' }} />
                <div>
                  <div style={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem', textTransform: 'uppercase' }}>AI Insight</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', lineHeight: 1.4 }}>
                    "{condition.aiNote}"
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{ 
            padding: '1.25rem 1.5rem', background: 'rgba(0,0,0,0.2)', 
            borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end'
          }}>
            <button 
              onClick={handleDelete}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(255,68,68,0.1)', color: '#FF4444',
                border: '1px solid rgba(255,68,68,0.3)', padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#FF4444'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,68,68,0.1)'; e.currentTarget.style.color = '#FF4444'; }}
            >
              <Trash2 size={16} /> Delete Condition
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConditionModal;
