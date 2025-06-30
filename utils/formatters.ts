// Utility functions for safe number formatting
export const safeToFixed = (value: number | undefined | null, decimals: number = 2): string => {
  if (value == null || isNaN(value) || !isFinite(value)) {
    return '0.' + '0'.repeat(Math.max(0, Math.min(20, decimals)));
  }
  // Ensure decimals is within valid range
  const validDecimals = Math.max(0, Math.min(20, decimals));
  return value.toFixed(validDecimals);
};

export const safeToLocaleString = (value: number | undefined | null): string => {
  if (value == null || isNaN(value) || !isFinite(value)) {
    return '0';
  }
  try {
    return value.toLocaleString('en-US');
  } catch (error) {
    return '0';
  }
};

export const safeFormatCurrency = (value: number | undefined | null): string => {
  if (value == null || isNaN(value) || !isFinite(value)) {
    return '$0.00';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    return '$0.00';
  }
};

export const safeFormatPercentage = (value: number | undefined | null, decimals: number = 2): string => {
  if (value == null || isNaN(value) || !isFinite(value)) {
    const validDecimals = Math.max(0, Math.min(20, decimals));
    return '0.' + '0'.repeat(validDecimals) + '%';
  }
  const validDecimals = Math.max(0, Math.min(20, decimals));
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(validDecimals)}%`;
};

export const safeFormatPrice = (price: number | undefined | null): string => {
  if (price == null || isNaN(price) || !isFinite(price)) {
    return '0.00';
  }
  
  // Ensure maxFractionDigits is within valid range (0-20)
  const maxDigits = Math.max(0, Math.min(20, price > 1000 ? 0 : 4));
  
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDigits
  });
};
