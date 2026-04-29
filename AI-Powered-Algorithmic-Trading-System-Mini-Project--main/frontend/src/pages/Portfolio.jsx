import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, BarChart3, History, RefreshCw, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { formatPrice, getCurrencySymbol } from '../utils/currency';
import StockChart from '../components/StockChart';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(null); // symbol being sold
  const [sellQuantity, setSellQuantity] = useState({});
  const [sellResult, setSellResult] = useState(null);
  const [sellError, setSellError] = useState(null);
  const [selectedChart, setSelectedChart] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await api.get('/portfolio');
      setPortfolio(res.data);
    } catch (err) {
      console.error('Portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchPortfolio, 10000);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  const handleSell = async (symbol, maxQty) => {
    const qty = parseInt(sellQuantity[symbol]) || maxQty;
    if (qty < 1 || qty > maxQty) return;

    setSelling(symbol);
    setSellError(null);
    setSellResult(null);

    try {
      const res = await api.post('/trades/sell', { symbol, quantity: qty });
      setSellResult(res.data);
      // Refresh portfolio
      setTimeout(() => {
        fetchPortfolio();
        setSellResult(null);
        setSelling(null);
      }, 2500);
    } catch (err) {
      setSellError(err.response?.data?.message || 'Sell failed');
      setTimeout(() => { setSellError(null); setSelling(null); }, 3000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <RefreshCw className="animate-spin" size={36} color="var(--color-text-light)" />
      </div>
    );
  }

  const isProfit = (portfolio?.totalProfitLoss || 0) >= 0;

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <div className="page-header">
        <div>
          <h1>Virtual Portfolio</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Starting Balance: ₹1,00,000 • Paper Trading
          </p>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <motion.div variants={itemVariants} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--color-primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', color: 'var(--color-primary)' }}>
            <Wallet size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Balance</p>
            <h3 style={{ fontSize: '1.35rem' }}>{formatPrice(portfolio?.virtualBalance, 'INR.NS')}</h3>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(250,204,21,0.12)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', color: '#FACC15' }}>
            <ShoppingCart size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Invested</p>
            <h3 style={{ fontSize: '1.35rem' }}>{formatPrice(portfolio?.totalInvested, 'INR.NS')}</h3>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--color-buy-bg)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', color: '#00FF88' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Current Value</p>
            <h3 style={{ fontSize: '1.35rem' }}>{formatPrice(portfolio?.totalCurrentValue, 'INR.NS')}</h3>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card" style={{
          position: 'relative', overflow: 'hidden',
          borderColor: isProfit ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,68,0.3)',
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            background: isProfit
              ? 'linear-gradient(135deg, #00FF88, transparent)'
              : 'linear-gradient(135deg, #FF4444, transparent)',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
            <div style={{
              background: isProfit ? 'var(--color-buy-bg)' : 'var(--color-sell-bg)',
              padding: '0.75rem', borderRadius: 'var(--radius-lg)',
              color: isProfit ? '#00FF88' : '#FF4444',
            }}>
              {isProfit ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Total P&L</p>
              <h3 style={{
                fontSize: '1.35rem',
                color: isProfit ? '#00FF88' : '#FF4444',
              }}>
                {isProfit ? '+' : ''}{formatPrice(portfolio?.totalProfitLoss, 'INR.NS')}
                <span style={{ fontSize: '0.8rem', marginLeft: '0.4rem' }}>
                  ({isProfit ? '+' : ''}{portfolio?.totalProfitLossPercent?.toFixed(2) || '0.00'}%)
                </span>
              </h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sell Result / Error Banners */}
      <AnimatePresence>
        {sellResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)',
              borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem',
              marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
              color: '#00FF88',
            }}
          >
            <CheckCircle size={20} />
            <div>
              <strong>{sellResult.message}</strong>
              <span style={{ marginLeft: '1rem', color: sellResult.profitLoss >= 0 ? '#00FF88' : '#FF4444' }}>
                P&L: {sellResult.profitLoss >= 0 ? '+' : ''}₹{sellResult.profitLoss?.toFixed(2)}
                ({sellResult.profitLossPercent?.toFixed(2)}%)
              </span>
            </div>
          </motion.div>
        )}
        {sellError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.3)',
              borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem',
              marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
              color: '#FF4444',
            }}
          >
            <AlertCircle size={20} /> <strong>{sellError}</strong>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Open Positions */}
      <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} color="var(--color-primary)" /> Open Positions
          </h3>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {portfolio?.openTrades?.length || 0} holdings
          </span>
        </div>

        {(!portfolio?.openTrades || portfolio.openTrades.length === 0) ? (
          <div style={{
            textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)',
          }}>
            <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>No open positions. Go to Trade to buy stocks!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {portfolio.openTrades.map((trade) => {
              const pl = trade.profitLoss || 0;
              const plPercent = trade.profitLossPercent || 0;
              const isUp = pl >= 0;

              return (
                <motion.div
                  key={trade._id}
                  layout
                  whileHover={{ scale: 1.01 }}
                  style={{
                    background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)', padding: '1.25rem',
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                    alignItems: 'center', gap: '1rem',
                  }}
                >
                  {/* Stock Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{trade.symbol}</span>
                      <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem' }}>
                        {trade.quantity} shares
                      </span>
                    </div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      {trade.companyName}
                    </span>
                  </div>

                  {/* Buy Price */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Buy Price</div>
                    <div style={{ fontWeight: 600 }}>{formatPrice(trade.price, trade.symbol)}</div>
                  </div>

                  {/* Current Price */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Current</div>
                    <div style={{ fontWeight: 600, color: isUp ? '#00FF88' : '#FF4444' }}>
                      {formatPrice(trade.currentPrice, trade.symbol)}
                    </div>
                  </div>

                  {/* P&L */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>P&L</div>
                    <div style={{
                      fontWeight: 700, color: isUp ? '#00FF88' : '#FF4444',
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                    }}>
                      {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {isUp ? '+' : ''}{formatPrice(pl, trade.symbol)}
                      <span style={{ fontSize: '0.75rem' }}>
                        ({isUp ? '+' : ''}{plPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* Sell Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number" min="1" max={trade.quantity}
                      placeholder={trade.quantity}
                      value={sellQuantity[trade.symbol] || ''}
                      onChange={(e) => setSellQuantity((prev) => ({ ...prev, [trade.symbol]: e.target.value }))}
                      style={{
                        width: '60px', padding: '0.4rem', fontSize: '0.8rem',
                        textAlign: 'center', borderRadius: 'var(--radius-md)',
                      }}
                    />
                    <button
                      onClick={() => handleSell(trade.symbol, trade.quantity)}
                      disabled={selling === trade.symbol}
                      style={{
                        background: '#FF4444', color: '#fff', padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.85rem',
                        cursor: 'pointer', border: 'none',
                        opacity: selling === trade.symbol ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 10px rgba(255,68,68,0.25)',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; }}
                    >
                      {selling === trade.symbol ? '...' : 'SELL'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Chart for selected stock */}
      <AnimatePresence>
        {selectedChart && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}
          >
            <StockChart symbol={selectedChart} height={300} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade History */}
      <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <History size={20} color="var(--color-primary)" />
          <h3 style={{ fontSize: '1.25rem' }}>Trade History</h3>
        </div>

        {(!portfolio?.closedTrades || portfolio.closedTrades.length === 0) ? (
          <div style={{
            textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)',
          }}>
            <History size={40} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
            <p>No closed trades yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {portfolio.closedTrades.map((trade) => {
              const isBuy = trade.type === 'BUY';
              const pl = trade.profitLoss || 0;
              const isUp = pl >= 0;

              return (
                <div
                  key={trade._id}
                  style={{
                    display: 'grid', gridTemplateColumns: 'auto 2fr 1fr 1fr 1fr',
                    gap: '1rem', alignItems: 'center', padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)', background: 'var(--color-surface-hover)',
                    border: '1px solid var(--color-border)', fontSize: '0.875rem',
                  }}
                >
                  <span className={`badge ${isBuy ? 'buy' : 'sell'}`}>{trade.type}</span>
                  <div>
                    <span style={{ fontWeight: 600 }}>{trade.symbol}</span>
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                      ×{trade.quantity}
                    </span>
                  </div>
                  <div style={{ color: 'var(--color-text-muted)' }}>
                    @ {formatPrice(trade.price, trade.symbol)}
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {formatPrice(trade.totalAmount, trade.symbol)}
                  </div>
                  {trade.type === 'SELL' ? (
                    <div style={{ fontWeight: 700, color: isUp ? '#00FF88' : '#FF4444', textAlign: 'right' }}>
                      {isUp ? '+' : ''}{formatPrice(pl, trade.symbol)}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-text-light)', textAlign: 'right', fontSize: '0.75rem' }}>
                      {new Date(trade.closedAt || trade.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <style>{`
        @media (max-width: 1024px) {
          .grid-cards { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .grid-cards { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  );
};

export default Portfolio;
