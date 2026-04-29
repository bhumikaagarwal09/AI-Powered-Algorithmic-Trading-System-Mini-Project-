import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Target, Clock, DollarSign, Loader, Search, Trash2 } from 'lucide-react';
import api from '../services/api';
import ConditionModal from '../components/ConditionModal';
import { formatPrice } from '../utils/currency';

const ConditionSetup = () => {
  const [formData, setFormData] = useState({
    stockSymbol: '',
    buyPrice: '',
    targetProfit: '',
    maxDays: ''
  });
  
  const [autoSell, setAutoSell] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [validationMsg, setValidationMsg] = useState(null);

  const [conditions, setConditions] = useState([]);
  const [filterTab, setFilterTab] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState(null);

  const fetchConditions = async () => {
    try {
      const res = await api.get('/conditions');
      setConditions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, []);

  // Fetch live price when user types symbol
  useEffect(() => {
    const symbol = formData.stockSymbol.trim().toUpperCase();
    if (symbol.length < 2) {
      setCurrentPrice(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPriceLoading(true);
      try {
        const res = await api.get(`/stocks/price/${symbol}`);
        if (res.data && res.data.price) {
          setCurrentPrice(res.data.price);
        }
      } catch (err) {
        setCurrentPrice(null);
      } finally {
        setPriceLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.stockSymbol]);

  // Buy price validation 
  useEffect(() => {
    if (currentPrice && formData.buyPrice) {
      const buyPrice = parseFloat(formData.buyPrice);
      const minAllowed = currentPrice * 0.80;
      const maxAllowed = currentPrice * 1.20;

      if (buyPrice < minAllowed) {
        setValidationMsg({ type: 'error', text: `Price too low! ${formData.stockSymbol.toUpperCase()} is at ₹${currentPrice.toLocaleString('en-IN')}` });
      } else if (buyPrice > maxAllowed) {
        setValidationMsg({ type: 'error', text: `Price too high! ${formData.stockSymbol.toUpperCase()} is at ₹${currentPrice.toLocaleString('en-IN')}` });
      } else {
        setValidationMsg(null);
      }
    } else {
      setValidationMsg(null);
    }
  }, [formData.buyPrice, currentPrice, formData.stockSymbol]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (success) setSuccess(false);
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await api.post('/conditions', {
        symbol: formData.stockSymbol,
        buyPrice: parseFloat(formData.buyPrice),
        targetProfitPercent: parseFloat(formData.targetProfit),
        maxDays: parseInt(formData.maxDays),
        autoSell,
      });
      setSuccess(true);
      setFormData({ stockSymbol: '', buyPrice: '', targetProfit: '', maxDays: '' });
      setAutoSell(false);
      fetchConditions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save condition. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCondition = async (id, symbol) => {
    if (window.confirm(`Are you sure you want to delete ${symbol} condition?`)) {
      try {
        await api.delete(`/conditions/${id}`);
        setConditions(conditions.filter(c => c._id !== id));
        if (selectedCondition?._id === id) setSelectedCondition(null);
      } catch (err) {
        console.error('Failed to delete condition:', err);
        alert(err.response?.data?.message || 'Failed to delete condition');
      }
    }
  };

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

  const filteredConditions = filterTab === 'ALL' 
    ? conditions 
    : conditions.filter(c => c.status === filterTab);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <div>
          <h1>Condition Setup</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Define rules for AI automated monitoring.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 600px) 1fr', gap: '2rem' }}>
        <div className="glass-card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ background: 'var(--color-buy-bg)', color: 'var(--color-buy)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} />
                <span style={{ fontWeight: 500 }}>Condition saved successfully! AI is now monitoring.</span>
              </motion.div>
            )}

            {error && (
              <div style={{ background: 'var(--color-sell-bg)', color: 'var(--color-sell)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                {error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Target Stock Symbol</label>
              <input 
                type="text" 
                name="stockSymbol"
                required
                placeholder="e.g. TSLA, AAPL" 
                value={formData.stockSymbol}
                onChange={handleChange}
                style={{ textTransform: 'uppercase' }}
              />
              <div style={{ minHeight: '20px', marginTop: '0.4rem', fontSize: '0.85rem' }}>
                {priceLoading ? (
                  <span style={{ color: 'var(--color-text-muted)' }}>Fetching live price...</span>
                ) : currentPrice ? (
                  <span style={{ color: '#00FF88', fontWeight: 500 }}>
                    Current Price: ₹{currentPrice.toLocaleString('en-IN')}
                  </span>
                ) : null}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Maximum Buy Price</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    name="buyPrice"
                    min="0.01" step="0.01" required
                    placeholder="0.00" 
                    value={formData.buyPrice}
                    onChange={handleChange}
                    style={{ 
                      width: '100%', padding: '0.5rem 0.75rem',
                      borderColor: validationMsg?.type === 'error' ? '#FF4444' : ''
                    }}
                  />
                </div>
                {currentPrice && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', lineHeight: '1.4' }}>
                    {validationMsg && (
                      <div style={{ color: '#FF4444', fontWeight: 500 }}>
                        {validationMsg.text}
                      </div>
                    )}
                    <div style={{ color: 'var(--color-text-muted)' }}>
                      Valid range: ₹{(currentPrice * 0.8).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} — ₹{(currentPrice * 1.2).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Target Profit (%)</label>
                <div style={{ position: 'relative' }}>
                  <Target size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                  <input 
                    type="number" 
                    name="targetProfit"
                    min="0.1" step="0.1" required
                    placeholder="5.0" 
                    value={formData.targetProfit}
                    onChange={handleChange}
                    style={{ width: '100%', paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Action Expiry (Max Days to wait)</label>
              <div style={{ position: 'relative' }}>
                <Clock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                <input 
                  type="number" 
                  name="maxDays"
                  min="1" max="365" required
                  placeholder="e.g. 14" 
                  value={formData.maxDays}
                  onChange={handleChange}
                  style={{ width: '100%', paddingLeft: '2.25rem' }}
                />
              </div>
            </div>

            {/* Auto Sell Toggle */}
            <div style={{
              marginTop: '0.25rem', padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)'
            }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                On Target Hit:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="sellType"
                    checked={!autoSell}
                    onChange={() => setAutoSell(false)}
                    style={{ width: '16px', height: '16px', accentColor: '#3B82F6' }}
                  />
                  <div>
                    <p style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
                      📧 Send Email Alert Only
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>
                      You will manually sell from Portfolio
                    </p>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="sellType"
                    checked={autoSell}
                    onChange={() => setAutoSell(true)}
                    style={{ width: '16px', height: '16px', accentColor: '#22c55e' }}
                  />
                  <div>
                    <p style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
                      ⚡ Auto Sell + Send Email
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>
                      AI will automatically sell when target hits
                    </p>
                  </div>
                </label>
              </div>

              {autoSell && (
                <div style={{
                  marginTop: '0.75rem', padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <p style={{ color: '#f59e0b', fontSize: '0.75rem', margin: 0 }}>
                    ⚠️ System will automatically close your position when target is reached
                  </p>
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading || validationMsg !== null} style={{ marginTop: '1rem' }}>
              {loading ? <Loader className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
              {loading ? 'Saving Condition...' : 'Save & Start AI Monitoring'}
            </button>
          </form>
        </div>

        {/* Feature Explanation Side Panel */}
        <div style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target color="var(--color-primary)" size={20} />
            How Conditions Work
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <ChevronRight size={18} color="var(--color-primary)" style={{ marginTop: '0.1rem' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--color-text-main)' }}>Set the Limit:</strong> AI will only issue a BUY signal if the stock falls below your Maximum Buy Price.
              </p>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <ChevronRight size={18} color="var(--color-primary)" style={{ marginTop: '0.1rem' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--color-text-main)' }}>Lock in Gains:</strong> Once purchased, the system automatically marks a SELL signal when your Target Profit % is reached.
              </p>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <ChevronRight size={18} color="var(--color-primary)" style={{ marginTop: '0.1rem' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--color-text-main)' }}>Time Constraints:</strong> If the condition isn't met within the Max Days, the condition expires to ensure your capital isn't indefinitely pending.
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* Conditions Listing Section */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Conditions</h2>
          
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface)', padding: '0.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
            {['ALL', 'PENDING', 'ACTIVE', 'COMPLETED', 'EXPIRED'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                style={{
                  background: filterTab === tab ? 'var(--color-surface-hover)' : 'transparent',
                  color: filterTab === tab ? '#fff' : 'var(--color-text-muted)',
                  border: filterTab === tab ? '1px solid var(--color-border)' : '1px solid transparent',
                  padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: filterTab === tab ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredConditions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)' }}>
            <Target size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No conditions found for this filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredConditions.map((cond) => {
              const statusInfo = getStatusBadge(cond.status);
              return (
                <div 
                  key={cond._id} 
                  onClick={() => setSelectedCondition(cond)}
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1.25rem', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                    background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>{cond.symbol}</span>
                      <span className={statusInfo.className}>{statusInfo.label}</span>
                      {cond.autoSell ? (
                        <span style={{
                          fontSize: '0.7rem', padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          background: 'rgba(34,197,94,0.15)',
                          color: '#4ade80',
                          border: '1px solid rgba(34,197,94,0.3)'
                        }}>⚡ Auto Sell</span>
                      ) : (
                        <span style={{
                          fontSize: '0.7rem', padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          background: 'rgba(59,130,246,0.15)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59,130,246,0.3)'
                        }}>📧 Alert Only</span>
                      )}
                    </div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                      Buy ≤ <strong style={{ color: '#fff' }}>{formatPrice(cond.buyPrice, cond.symbol)}</strong> 
                      <span style={{ margin: '0 0.5rem', color: 'var(--color-border)' }}>|</span> 
                      Target: <strong style={{ color: '#00FF88' }}>+{cond.targetProfitPercent}%</strong>
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ color: 'var(--color-text-light)', fontSize: '0.75rem' }}>Created</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {new Date(cond.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCondition(cond._id, cond.symbol);
                      }}
                      style={{
                        background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', 
                        color: '#FF4444', cursor: 'pointer', padding: '0.5rem', 
                        borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#FF4444'; e.currentTarget.style.color = '#fff'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,68,68,0.1)'; e.currentTarget.style.color = '#FF4444'; }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

export default ConditionSetup;
