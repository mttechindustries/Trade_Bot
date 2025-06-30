import { useState, useEffect } from 'react';
import { Trade, Position } from '../types';
import { TimeService } from '../services/timeService';

interface PerformanceMetrics {
  totalPnL: number;
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  currentDrawdown: number;
  dayPnL: number;
  weekPnL: number;
  monthPnL: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldTime: number;
  totalFees: number;
  netProfit: number;
}

interface PerformanceDashboardProps {
  trades: Trade[];
  positions: Position[];
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ trades, positions }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'ALL'>('1D');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateMetrics();
  }, [trades, positions, timeframe]);

  const calculateMetrics = () => {
    setLoading(true);
    
    try {
      // Filter trades based on timeframe
      const now = TimeService.now();
      const timeframeMs = {
        '1D': 24 * 60 * 60 * 1000,
        '1W': 7 * 24 * 60 * 60 * 1000,
        '1M': 30 * 24 * 60 * 60 * 1000,
        'ALL': Infinity
      };

      const filteredTrades = timeframe === 'ALL' 
        ? trades 
        : trades.filter(trade => now - new Date(trade.openTime).getTime() < timeframeMs[timeframe]);

      if (filteredTrades.length === 0) {
        setMetrics({
          totalPnL: 0,
          totalTrades: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          profitFactor: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          currentDrawdown: 0,
          dayPnL: 0,
          weekPnL: 0,
          monthPnL: 0,
          bestTrade: 0,
          worstTrade: 0,
          avgHoldTime: 0,
          totalFees: 0,
          netProfit: 0
        });
        setLoading(false);
        return;
      }

      // Calculate basic metrics
      const totalTrades = filteredTrades.length;
      const winningTrades = filteredTrades.filter(t => t.profit.amount > 0);
      const losingTrades = filteredTrades.filter(t => t.profit.amount < 0);
      
      const totalPnL = filteredTrades.reduce((sum, t) => sum + t.profit.amount, 0);
      const totalFees = filteredTrades.reduce((sum, t) => sum + (t.fees || 0), 0);
      const netProfit = totalPnL - totalFees;
      
      const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
      const avgWin = winningTrades.length > 0 
        ? winningTrades.reduce((sum, t) => sum + t.profit.amount, 0) / winningTrades.length 
        : 0;
      const avgLoss = losingTrades.length > 0 
        ? Math.abs(losingTrades.reduce((sum, t) => sum + t.profit.amount, 0) / losingTrades.length)
        : 0;
      
      const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
      
      // Calculate drawdown
      let runningPnL = 0;
      let peak = 0;
      let maxDrawdown = 0;
      let currentDrawdown = 0;
      
      const sortedTrades = [...filteredTrades].sort((a, b) => new Date(a.openTime).getTime() - new Date(b.openTime).getTime());
      
      for (const trade of sortedTrades) {
        runningPnL += trade.profit.amount;
        if (runningPnL > peak) {
          peak = runningPnL;
        }
        const drawdown = ((peak - runningPnL) / Math.max(peak, 1)) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
      
      currentDrawdown = ((peak - runningPnL) / Math.max(peak, 1)) * 100;
      
      // Calculate Sharpe ratio (simplified)
      const returns = filteredTrades.map(t => (t.profit.amount / t.openRate) * 100);
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const returnStdDev = Math.sqrt(
        returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      );
      const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;
      
      // Time-based PnL
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
      
      const dayPnL = trades
        .filter(t => new Date(t.openTime).getTime() > oneDayAgo)
        .reduce((sum, t) => sum + t.profit.amount, 0);
      
      const weekPnL = trades
        .filter(t => new Date(t.openTime).getTime() > oneWeekAgo)
        .reduce((sum, t) => sum + t.profit.amount, 0);
      
      const monthPnL = trades
        .filter(t => new Date(t.openTime).getTime() > oneMonthAgo)
        .reduce((sum, t) => sum + t.profit.amount, 0);
      
      const bestTrade = Math.max(...filteredTrades.map(t => t.profit.amount));
      const worstTrade = Math.min(...filteredTrades.map(t => t.profit.amount));
      
      // Average hold time
      const avgHoldTime = filteredTrades.length > 0
        ? filteredTrades
            .filter(t => t.closeTime)
            .reduce((sum, t) => sum + (new Date(t.closeTime!).getTime() - new Date(t.openTime).getTime()), 0) / 
          filteredTrades.filter(t => t.closeTime).length
        : 0;

      setMetrics({
        totalPnL,
        totalTrades,
        winRate,
        avgWin,
        avgLoss,
        profitFactor,
        sharpeRatio,
        maxDrawdown,
        currentDrawdown,
        dayPnL,
        weekPnL,
        monthPnL,
        bestTrade,
        worstTrade,
        avgHoldTime,
        totalFees,
        netProfit
      });
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h`;
  };

  const getColorForValue = (value: number) => {
    return value >= 0 ? 'text-green-400' : 'text-red-400';
  };

  if (loading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg text-center">
        <div className="text-gray-400">No performance data available</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Performance Analytics</h3>
        <div className="flex space-x-2">
          {(['1D', '1W', '1M', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                timeframe === tf
                  ? 'bg-primary text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">Total P&L</div>
          <div className={`text-xl font-bold ${getColorForValue(metrics.totalPnL)}`}>
            {formatCurrency(metrics.totalPnL)}
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">Net Profit</div>
          <div className={`text-xl font-bold ${getColorForValue(metrics.netProfit)}`}>
            {formatCurrency(metrics.netProfit)}
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">Win Rate</div>
          <div className="text-xl font-bold text-primary">
            {formatPercentage(metrics.winRate)}
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">Total Trades</div>
          <div className="text-xl font-bold text-white">
            {metrics.totalTrades}
          </div>
        </div>
      </div>

      {/* Time-based P&L */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">24h P&L</div>
          <div className={`text-lg font-semibold ${getColorForValue(metrics.dayPnL)}`}>
            {formatCurrency(metrics.dayPnL)}
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">7d P&L</div>
          <div className={`text-lg font-semibold ${getColorForValue(metrics.weekPnL)}`}>
            {formatCurrency(metrics.weekPnL)}
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">30d P&L</div>
          <div className={`text-lg font-semibold ${getColorForValue(metrics.monthPnL)}`}>
            {formatCurrency(metrics.monthPnL)}
          </div>
        </div>
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Profit Factor</div>
          <div className="text-lg font-semibold text-white">
            {metrics.profitFactor.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Sharpe Ratio</div>
          <div className="text-lg font-semibold text-white">
            {metrics.sharpeRatio.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Max Drawdown</div>
          <div className="text-lg font-semibold text-red-400">
            -{formatPercentage(metrics.maxDrawdown)}
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Current DD</div>
          <div className="text-lg font-semibold text-red-400">
            -{formatPercentage(metrics.currentDrawdown)}
          </div>
        </div>
      </div>

      {/* Trade Analysis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Avg Win</div>
          <div className="text-lg font-semibold text-green-400">
            {formatCurrency(metrics.avgWin)}
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Avg Loss</div>
          <div className="text-lg font-semibold text-red-400">
            -{formatCurrency(metrics.avgLoss)}
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Best Trade</div>
          <div className="text-lg font-semibold text-green-400">
            {formatCurrency(metrics.bestTrade)}
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Worst Trade</div>
          <div className="text-lg font-semibold text-red-400">
            {formatCurrency(metrics.worstTrade)}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Avg Hold Time:</span>
            <span className="ml-2 text-white">{formatTime(metrics.avgHoldTime)}</span>
          </div>
          <div>
            <span className="text-gray-400">Total Fees:</span>
            <span className="ml-2 text-red-400">{formatCurrency(metrics.totalFees)}</span>
          </div>
          <div>
            <span className="text-gray-400">Active Positions:</span>
            <span className="ml-2 text-white">{positions.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
