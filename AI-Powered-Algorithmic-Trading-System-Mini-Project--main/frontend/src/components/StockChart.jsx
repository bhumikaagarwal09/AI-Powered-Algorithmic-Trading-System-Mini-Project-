import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import api from '../services/api';

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

const CustomTooltip = ({ active, payload, label, symbol }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const currencySymbol = symbol?.endsWith('.NS') ? '₹' : '$';
  const locale = symbol?.endsWith('.NS') ? 'en-IN' : 'en-US';
  return (
    <div style={{
      background: '#1E293B', border: '1px solid #334155', borderRadius: '0.75rem',
      padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#F1F5F9',
      boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: '#94A3B8' }}>{formatDate(label)}</div>
      {d && (
        <>
          <div>Open: <strong>{currencySymbol}{d.open?.toLocaleString(locale, {minimumFractionDigits: 2})}</strong></div>
          <div>High: <strong style={{ color: '#00FF88' }}>{currencySymbol}{d.high?.toLocaleString(locale, {minimumFractionDigits: 2})}</strong></div>
          <div>Low: <strong style={{ color: '#FF4444' }}>{currencySymbol}{d.low?.toLocaleString(locale, {minimumFractionDigits: 2})}</strong></div>
          <div>Close: <strong>{currencySymbol}{d.close?.toLocaleString(locale, {minimumFractionDigits: 2})}</strong></div>
        </>
      )}
    </div>
  );
};

const StockChart = ({ symbol, height = 200, mini = false, showHeader = true }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchChart = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/charts/${symbol}`);
        const data = mini ? res.data.slice(-7) : res.data;
        setChartData(data);
      } catch (err) {
        console.error(`Chart fetch error for ${symbol}:`, err);
        setError('Chart data unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchChart();
  }, [symbol, mini]);

  if (loading) {
    return (
      <div style={{
        height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#64748B', fontSize: '0.8rem',
      }}>
        <div style={{
          width: '20px', height: '20px', border: '2px solid #334155',
          borderTopColor: '#00FF88', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (error || chartData.length === 0) {
    return (
      <div style={{
        height: mini ? 60 : height, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#64748B', fontSize: '0.75rem',
      }}>
        {error || 'No data'}
      </div>
    );
  }

  const firstClose = chartData[0]?.close || 0;
  const lastClose = chartData[chartData.length - 1]?.close || 0;
  const changePercent = firstClose > 0 ? ((lastClose - firstClose) / firstClose * 100) : 0;
  const isPositive = changePercent >= 0;
  const lineColor = isPositive ? '#00FF88' : '#FF4444';
  const gradientId = `chartGradient_${symbol?.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  const currencySymbol = symbol?.endsWith('.NS') ? '₹' : '$';
  const locale = symbol?.endsWith('.NS') ? 'en-IN' : 'en-US';

  return (
    <div>
      {showHeader && !mini && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '0.75rem',
        }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{symbol} — 30 Day Chart</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            color: lineColor, fontWeight: 600, fontSize: '0.875rem',
            background: isPositive ? 'rgba(0,255,136,0.12)' : 'rgba(255,68,68,0.12)',
            padding: '0.2rem 0.6rem', borderRadius: '9999px',
          }}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
          </span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={mini ? 60 : height}>
        <AreaChart data={chartData} margin={mini ? { top: 2, right: 2, left: 2, bottom: 2 } : { top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          {!mini && (
            <>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }} tickLine={false}
                tickFormatter={formatDate}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }} tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(value) => `${currencySymbol}${value.toLocaleString(locale)}`}
              />
              <Tooltip content={<CustomTooltip symbol={symbol} />} />
            </>
          )}

          <Area
            type="monotone" dataKey="close" stroke={lineColor}
            strokeWidth={mini ? 1.5 : 2} fill={`url(#${gradientId})`}
            dot={false} activeDot={mini ? false : { r: 4, fill: lineColor, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
