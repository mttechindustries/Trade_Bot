import React, { useState, useEffect } from 'react';
import { TickerData } from '../types';
import RealTimeMarketDataService from '../services/realTimeMarketDataService';
import { safeFormatPrice, safeFormatPercentage, safeToFixed } from '../utils/formatters';

interface PriceTickerProps {
  symbols?: string[];
  updateInterval?: number;
}

const PriceTicker: React.FC<PriceTickerProps> = ({ 
  symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT'], 
  updateInterval = 1000 
}) => {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const marketDataService = RealTimeMarketDataService.getInstance();
    let unsubscribe: (() => void) | null = null;

    const initializeRealTimeData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Initializing real-time market data for:', symbols);

        // Get initial data
        const initialData = await marketDataService.getRealTimeTickerData(symbols);
        console.log('✅ Got initial market data:', initialData);
        setTickers(initialData);
        setLoading(false);

        // Subscribe to real-time updates
        unsubscribe = marketDataService.subscribeToRealTimeUpdates(symbols, (updatedTicker) => {
          console.log('📈 Real-time update for:', updatedTicker.symbol, updatedTicker.price);
          setTickers(prev => {
            const index = prev.findIndex(t => t.symbol === updatedTicker.symbol);
            if (index >= 0) {
              const newTickers = [...prev];
              newTickers[index] = updatedTicker;
              return newTickers;
            } else {
              return [...prev, updatedTicker];
            }
          });
          setIsConnected(true);
        });

      } catch (err) {
        console.error('❌ FAILED to get REAL market data:', err);
        setLoading(false);
        setIsConnected(false);
        setError(`Real-time data unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`);
        // NO MOCK DATA FALLBACK - Show error state instead
      }
    };

    initializeRealTimeData();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        console.log('🧹 Cleaning up real-time data subscriptions');
        unsubscribe();
      }
    };
  }, [symbols]);

  const formatPrice = (price: number): string => {
    return safeFormatPrice(price);
  };

  const formatChange = (change: number): string => {
    return safeFormatPercentage(change);
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getLastUpdateTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div className="animate-pulse">
          <h3 className="text-xl font-bold text-white mb-4">Real-Time Market Data</h3>
          <div className="space-y-3">
            {symbols.map((_, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
                <div className="h-4 bg-gray-300 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-red-500/50">
        <h3 className="text-xl font-bold text-white mb-4">Market Data</h3>
        <div className="text-red-400">
          <p className="font-medium">Error loading market data:</p>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-2 text-gray-400">
            Check your internet connection and try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Real-Time Market Data</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-gray-400">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {tickers.map((ticker) => (
          <div key={ticker.symbol} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
            <div className="flex flex-col">
              <span className="font-medium text-white">{ticker.symbol}</span>
              <span className="text-xs text-gray-400">
                Vol: {safeToFixed(ticker.volume24h / 1000000, 1)}M
              </span>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-white">
                ${formatPrice(ticker.price)}
              </div>
              <div className="text-xs text-gray-400">
                Last: {getLastUpdateTime(ticker.lastUpdate)}
              </div>
            </div>
            
            <div className="text-right">
              <div className={`font-medium ${getChangeColor(ticker.changePercent24h || 0)}`}>
                {formatChange(ticker.changePercent24h || 0)}
              </div>
              <div className="text-xs text-gray-400">
                {ticker.change24h >= 0 ? '+' : ''}${safeToFixed(ticker.change24h, 2)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>Data from: Binance, Coinbase, Kraken</span>
          <span>Updates every {updateInterval/1000}s</span>
        </div>
      </div>
    </div>
  );
};

export default PriceTicker;
