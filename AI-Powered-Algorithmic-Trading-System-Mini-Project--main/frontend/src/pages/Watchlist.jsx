import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, ShoppingCart } from 'lucide-react';
import api from '../services/api';
import { formatPrice } from '../utils/currency';
import StockChart from '../components/StockChart';

const Watchlist = () => {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const prevPricesRef = useRef({});

  useEffect(() => {
    fetchWatchlist();
  }, []);

  // Auto refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWatchlistSilent();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const response = await api.get('/stocks/watchlist/prices');
      if (response.data && response.data.length > 0) {
        setWatchlist(response.data);
        // Store prices for flash comparison
        const priceMap = {};
        response.data.forEach((s) => { priceMap[s.symbol] = s.price; });
        prevPricesRef.current = priceMap;
      } else {
        setWatchlist([]);
      }
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlistSilent = async () => {
    try {
      const response = await api.get('/stocks/watchlist/prices');
      if (response.data && response.data.length > 0) {
        // Compare prices for flash animation
        const newPriceMap = {};
        response.data.forEach((s) => { newPriceMap[s.symbol] = s.price; });

        setWatchlist((prev) => {
          return response.data.map((stock) => {
            const oldPrice = prevPricesRef.current[stock.symbol];
            let priceFlash = null;
            if (oldPrice != null && stock.price != null) {
              if (stock.price > oldPrice) priceFlash = 'up';
              else if (stock.price < oldPrice) priceFlash = 'down';
            }
            return { ...stock, priceFlash };
          });
        });

        prevPricesRef.current = newPriceMap;

        // Clear flash after 1 second
        setTimeout(() => {
          setWatchlist((prev) => prev.map((s) => ({ ...s, priceFlash: null })));
        }, 1200);
      }
    } catch (err) {
      // Silent fail for auto-refresh
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setAdding(true);
    try {
      const response = await api.post('/stocks/watchlist', {
        symbol: searchQuery.toUpperCase(),
        companyName: searchQuery.toUpperCase(),
      });
      if (response.data) {
        await fetchWatchlist();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add stock';
      alert(msg);
    } finally {
      setSearchQuery('');
      setAdding(false);
    }
  };

  const handleRemoveStock = async (symbol) => {
    try {
      await api.delete(`/stocks/watchlist/${symbol}`);
      setWatchlist(watchlist.filter(stock => stock.symbol !== symbol));
    } catch (err) {
      console.error('Error removing stock:', err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1>Watchlist</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Track your favorite NSE and NASDAQ stocks. 
            <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: 'var(--color-text-light)' }}>
              Auto-refreshes every 10s
            </span>
          </p>
        </div>
        
        <form onSubmit={handleAddStock} style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '400px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
            <input 
              type="text" 
              placeholder="Search symbol (e.g. AAPL, INF)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={adding || !searchQuery.trim()}>
            {adding ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
            <span>Add</span>
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
          <RefreshCw className="animate-spin" size={32} color="var(--color-text-light)" />
        </div>
      ) : watchlist.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-border)' }}
        >
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Your watchlist is empty</h3>
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '400px' }}>
            Start building your portfolio by searching for NSE or NASDAQ stock symbols above.
          </p>
        </motion.div>
      ) : (
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          <AnimatePresence>
            {watchlist.map(stock => {
              const flashStyle = stock.priceFlash === 'up'
                ? { boxShadow: '0 0 20px rgba(0,255,136,0.3)', borderColor: 'rgba(0,255,136,0.5)' }
                : stock.priceFlash === 'down'
                  ? { boxShadow: '0 0 20px rgba(255,68,68,0.3)', borderColor: 'rgba(255,68,68,0.5)' }
                  : {};

              return (
                <motion.div
                  key={stock.symbol || stock._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="glass-card"
                  style={{ position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.3s, border-color 0.3s', ...flashStyle }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stock.symbol}</h3>
                      </div>
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{stock.companyName || stock.symbol}</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveStock(stock.symbol)}
                      style={{ color: 'var(--color-text-light)', padding: '0.4rem', borderRadius: 'var(--radius-md)' }}
                      onMouseOver={(e) => { e.currentTarget.style.color = 'var(--color-sell)'; e.currentTarget.style.background = 'var(--color-sell-bg)' }}
                      onMouseOut={(e) => { e.currentTarget.style.color = 'var(--color-text-light)'; e.currentTarget.style.background = 'none' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Mini Sparkline Chart */}
                  <div style={{ margin: '0.5rem 0' }}>
                    <StockChart symbol={stock.symbol} mini={true} showHeader={false} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                        {stock.price != null ? formatPrice(stock.price, stock.symbol) : '—'}
                      </div>
                      {stock.percentChange != null && (
                        <div style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600,
                          color: stock.percentChange >= 0 ? 'var(--color-buy)' : 'var(--color-sell)',
                          background: stock.percentChange >= 0 ? 'var(--color-buy-bg)' : 'var(--color-sell-bg)',
                          padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem',
                        }}>
                          {stock.percentChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {stock.percentChange > 0 ? '+' : ''}{parseFloat(stock.percentChange).toFixed(2)}%
                        </div>
                      )}
                    </div>

                    {/* BUY Button */}
                    <button
                      onClick={() => navigate(`/trade?symbol=${stock.symbol}`)}
                      style={{
                        background: '#00FF88', color: '#0F172A', border: 'none',
                        padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                        fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 10px rgba(0,255,136,0.2)',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,255,136,0.35)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,255,136,0.2)'; }}
                    >
                      <ShoppingCart size={14} /> BUY
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <style>{`
        @keyframes animate-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: animate-spin 1s linear infinite; }
      `}</style>
    </motion.div>
  );
};

export default Watchlist;
