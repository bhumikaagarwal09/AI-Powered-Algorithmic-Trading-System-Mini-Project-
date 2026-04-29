/**
 * Currency formatting utility for Indian (.NS/.BSE) and US stocks
 */
export const formatPrice = (price, symbol, currency) => {
  if (price == null || isNaN(price)) return '—';

  const isIndian =
    symbol?.endsWith('.NS') ||
    symbol?.endsWith('.BSE') ||
    currency === 'INR';

  return isIndian
    ? `₹${Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${Number(price).toFixed(2)}`;
};

/**
 * Returns the currency symbol based on stock ticker
 */
export const getCurrencySymbol = (symbol) => {
  return symbol?.endsWith('.NS') || symbol?.endsWith('.BSE') ? '₹' : '$';
};
