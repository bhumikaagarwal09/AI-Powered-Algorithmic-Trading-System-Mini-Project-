import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, TrendingUp, Wallet, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { formatPrice, getCurrencySymbol } from '../utils/currency';
import StockChart from '../components/StockChart';

const Trade = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [symbol, setSymbol] = useState(searchParams.get('symbol') || '');
  const [quantity, setQuantity] = useState(1);
  const [priceData, setPriceData] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Fetch portfolio balance
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await api.get('/portfolio');
        setPortfolio(res.data);
      } catch (err) {
        console.error('Portfolio fetch error:', err);
      }
    };
    fetchPortfolio();
  }, []);

  // Fetch price when symbol changes (debounced)
  useEffect(() => {
    if (!symbol || symbol.length < 2) {
      setPriceData(null);
      return;
    }

    const timer = setTimeout(async () => {
      setFetchingPrice(true);
      setError(null);
      try {
        const res = await api.get(`/stocks/price/${symbol.toUpperCase()}`);
        setPriceData(res.data);
      } catch (err) {
        setPriceData(null);
        setError(`Could not fetch price for "${symbol}"`);
      } finally {
        setFetchingPrice(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [symbol]);

  // Auto-refresh price every 10 seconds
  useEffect(() => {
    if (!symbol || !priceData) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/stocks/price/${symbol.toUpperCase()}`);
        setPriceData(res.data);
      } catch {
        // Silent fail for refresh
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [symbol, priceData]);

  const currentPrice = priceData?.price || 0;
  const totalCost = Math.round(currentPrice * quantity * 100) / 100;
  const currSymbol = getCurrencySymbol(symbol);
  const canBuy = portfolio && totalCost > 0 && portfolio.virtualBalance >= totalCost;

  const handleBuy = async () => {
    if (!canBuy) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('/trades/buy', {
        symbol: symbol.toUpperCase(),
        quantity: parseInt(quantity),
        companyName: priceData?.companyName || symbol.toUpperCase(),
      });

      setSuccess(res.data);
      setPortfolio((prev) => prev ? { ...prev, virtualBalance: res.data.newBalance } : prev);

      // Redirect to portfolio after 2 seconds
      setTimeout(() => navigate('/portfolio'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <div>
          <h1>Buy Stock</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Paper trade with your virtual balance</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Chart Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card" style={{ padding: '2rem' }}
        >
          {symbol && symbol.length >= 2 ? (
            <StockChart symbol={symbol.toUpperCase()} height={350} />
          ) : (
            <div style={{
              height: 350, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)',
            }}>
              <TrendingUp size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Enter a stock symbol to see the price chart</p>
            </div>
          )}
        </motion.div>

        {/* Trade Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card" style={{ padding: '2rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
            <div style={{
              background: 'rgba(0,255,136,0.12)', padding: '0.75rem',
              borderRadius: 'var(--radius-lg)', color: '#00FF88',
            }}>
              <ShoppingCart size={24} />
            </div>
            <h2 style={{ fontSize: '1.35rem' }}>Place Order</h2>
          </div>

          {/* Symbol Input */}
          <div className="form-group">
            <label>Stock Symbol</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute', left: '0.75rem', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--color-text-light)',
              }} />
              <input
                type="text" placeholder="e.g. TCS.NS, AAPL, RELIANCE.NS"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                style={{ paddingLeft: '2.25rem', width: '100%', textTransform: 'uppercase' }}
              />
              {fetchingPrice && (
                <RefreshCw size={14} style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--color-primary)',
                  animation: 'spin 1s linear infinite',
                }} />
              )}
            </div>
          </div>

          {/* Quantity Input */}
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number" min="1" step="1" value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Price Info */}
          {priceData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-lg)',
                padding: '1.25rem', marginBottom: '1.25rem',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Current Price</span>
                <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#00FF88' }}>
                  {formatPrice(currentPrice, symbol)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Total Cost</span>
                <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                  {formatPrice(totalCost, symbol)}
                </span>
              </div>
              <div style={{
                borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Wallet size={14} /> Available Balance
                </span>
                <span style={{
                  fontWeight: 600,
                  color: canBuy ? 'var(--color-text-main)' : '#FF4444',
                }}>
                  {portfolio ? formatPrice(portfolio.virtualBalance, symbol) : '—'}
                </span>
              </div>
            </motion.div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.3)',
                  borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
                  color: '#FF4444', fontSize: '0.875rem', marginBottom: '1rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)',
                  borderRadius: 'var(--radius-md)', padding: '1rem',
                  color: '#00FF88', fontSize: '0.9rem', marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                <CheckCircle size={32} style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                  Trade Successful! 🎉
                </div>
                <div style={{ color: 'var(--color-text-muted)' }}>
                  {success.message}
                </div>
                <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                  New Balance: {formatPrice(success.newBalance, symbol)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buy Button */}
          <button
            onClick={handleBuy}
            disabled={!canBuy || loading || !!success}
            style={{
              width: '100%', padding: '1rem', borderRadius: 'var(--radius-lg)',
              fontWeight: 700, fontSize: '1.1rem', cursor: canBuy && !loading ? 'pointer' : 'not-allowed',
              background: canBuy && !loading ? '#00FF88' : '#334155',
              color: canBuy && !loading ? '#0F172A' : '#64748B',
              border: 'none', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transform: canBuy && !loading ? 'none' : 'none',
              boxShadow: canBuy ? '0 4px 20px rgba(0,255,136,0.25)' : 'none',
            }}
            onMouseOver={(e) => { if (canBuy && !loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; }}
          >
            {loading ? (
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>🟢 BUY NOW</>
            )}
          </button>
        </motion.div>
      </div>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .trade-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  );
};

export default Trade;
