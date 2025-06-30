import { useState, useEffect } from 'react';
import { formatTime, TimeService } from '../services/timeService';
import { TickerData } from '../types';
import RealTimeMarketDataService from '../services/realTimeMarketDataService';
import { tradingStore } from '../store/tradingStore';

interface PriceTickerProps {
  symbols: string[];
  className?: string;
}

const PriceTicker: React.FC<PriceTickerProps> = ({ symbols, className = '' }) => {
  const [tickers, setTickers] = useState<Map<string, TickerData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(formatTime(undefined, true));

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdate(formatTime(undefined, true));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const marketData = RealTimeMarketDataService.getInstance();
    const unsubscribeFunctions: (() => void)[] = [];

    // Subscribe to ticker data for each symbol
    symbols.forEach(symbol => {
      const unsubscribe = marketData.subscribeToTicker(symbol, (data: TickerData) => {
        setTickers(prev => {
          const newTickers = new Map(prev);
          newTickers.set(symbol, data);
          return newTickers;
        });
        
        // Update global store
        tradingStore.updateTicker(symbol, data);
      });
      unsubscribeFunctions.push(unsubscribe);
    });

    setIsConnected(marketData.isConnectedToRealTimeData());

    // Check connection status every 5 seconds
    const connectionCheck = setInterval(() => {
      setIsConnected(marketData.isConnectedToRealTimeData());
    }, 5000);

    // Cleanup on unmount
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      clearInterval(connectionCheck);
      setIsConnected(false);
    };
  }, [symbols]);

  const formatPrice = (price: number): string => {
    if (price >= 1) {
      return price.toFixed(2);
    } else {
      return price.toFixed(6);
    }
  };

  const formatChange = (change: number): string => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  return (
    <div className={`bg-gray-800/50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-100">Market Prices</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`}></div>
          <span className="text-xs text-gray-400">{isConnected ? 'Live' : 'Disconnected'}</span>
          <span className="text-xs text-gray-500 font-mono">•</span>
          <span className="text-xs text-gray-400 font-mono">{lastUpdate}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {symbols.map(symbol => {
          const ticker = tickers.get(symbol);
          if (!ticker) {
            return (
              <div key={symbol} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                <span className="text-gray-300">{symbol}</span>
                <div className="text-gray-500 text-sm">Loading...</div>
              </div>
            );
          }

          const isPositive = (ticker.changePercent24h || ticker.change24h) >= 0;
          
          return (
            <div key={symbol} className="flex items-center justify-between p-2 bg-gray-700/30 rounded hover:bg-gray-700/50 transition-colors">
              <div className="flex flex-col">
                <span className="text-gray-100 font-medium">{symbol}</span>
                <span className="text-xs text-gray-400">
                  Vol: {(ticker.volume24h / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="text-right">
                <div className="text-gray-100 font-mono">${formatPrice(ticker.price)}</div>
                <div className={`text-xs font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}>
                  {formatChange(ticker.changePercent24h || ticker.change24h)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <span className="text-xs text-gray-500">Last updated: {lastUpdate}</span>
      </div>
    </div>
  );
};

export default PriceTicker;
