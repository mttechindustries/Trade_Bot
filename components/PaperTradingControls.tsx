import { useState, useEffect } from 'react';
import PaperTradingService from '../services/paperTradingService';
import { formatTime } from '../services/timeService';

interface PaperTradingControlsProps {
  className?: string;
}

const PaperTradingControls: React.FC<PaperTradingControlsProps> = ({ className = '' }) => {
  const [paperTradingService] = useState(() => PaperTradingService.getInstance());
  const [status, setStatus] = useState(paperTradingService.getTradingStatus());
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({
    symbol: 'BTC/USDT',
    side: 'long' as 'long' | 'short',
    amount: 100,
    leverage: 1,
    stopLoss: '',
    takeProfit: '',
    strategy: 'Manual'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(paperTradingService.getTradingStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, [paperTradingService]);

  const handleStartPaperTrading = () => {
    paperTradingService.startPaperTrading();
    setStatus(paperTradingService.getTradingStatus());
  };

  const handleStopPaperTrading = () => {
    paperTradingService.stopPaperTrading();
    setStatus(paperTradingService.getTradingStatus());
  };

  const handleResetAccount = () => {
    if (window.confirm('Are you sure you want to reset your paper trading account? This will close all positions and reset your balance to $10,000.')) {
      paperTradingService.resetAccount();
      setStatus(paperTradingService.getTradingStatus());
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const result = await paperTradingService.placeOrder({
        symbol: orderForm.symbol,
        side: orderForm.side,
        type: 'market',
        amount: orderForm.amount,
        leverage: orderForm.leverage,
        stopLoss: orderForm.stopLoss ? parseFloat(orderForm.stopLoss) : undefined,
        takeProfit: orderForm.takeProfit ? parseFloat(orderForm.takeProfit) : undefined,
        strategy: orderForm.strategy
      });

      if (result.status === 'filled') {
        alert(`✅ Order executed successfully!\nTrade ID: ${result.orderId}\nPrice: $${result.executedPrice.toFixed(2)}\nCommission: $${result.commission.toFixed(2)}`);
        setShowOrderForm(false);
        // Reset form
        setOrderForm({
          symbol: 'BTC/USDT',
          side: 'long',
          amount: 100,
          leverage: 1,
          stopLoss: '',
          takeProfit: '',
          strategy: 'Manual'
        });
      } else {
        alert(`❌ Order rejected: ${result.message}`);
      }
    } catch (error) {
      alert('Error placing order: ' + (error as Error).message);
    }
  };

  const getStatusColor = () => {
    if (!status.connectionStatus) return 'text-red-400';
    if (status.isActive) return 'text-green-400';
    return 'text-yellow-400';
  };

  const getStatusText = () => {
    if (!status.connectionStatus) return 'Disconnected';
    if (status.isActive) return 'Active';
    return 'Inactive';
  };

  return (
    <div className={`bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg p-6 border border-blue-500/30 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-100 flex items-center">
            📊 Paper Trading
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Test strategies with real-time data, zero risk
          </p>
        </div>
        <div className="text-right">
          <div className={`text-lg font-semibold ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          <div className="text-xs text-gray-400">
            {formatTime()}
          </div>
        </div>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400">
            ${status.account.balance.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">Balance</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            ${status.account.equity.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">Equity</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold ${status.account.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {status.account.unrealizedPnL >= 0 ? '+' : ''}${status.account.unrealizedPnL.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">Unrealized P&L</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-400">
            {status.openTradesCount}
          </div>
          <div className="text-xs text-gray-400">Open Trades</div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-sm text-gray-400">Total Trades</div>
          <div className="text-xl font-bold text-gray-200">{status.account.totalTrades}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">Win Rate</div>
          <div className="text-xl font-bold text-green-400">
            {status.account.totalTrades > 0 
              ? ((status.account.winningTrades / status.account.totalTrades) * 100).toFixed(1)
              : '0.0'
            }%
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">Realized P&L</div>
          <div className={`text-xl font-bold ${status.account.realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {status.account.realizedPnL >= 0 ? '+' : ''}${status.account.realizedPnL.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        {!status.isActive ? (
          <button
            onClick={handleStartPaperTrading}
            disabled={!status.connectionStatus}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold text-white transition-colors"
          >
            ▶️ Start Paper Trading
          </button>
        ) : (
          <button
            onClick={handleStopPaperTrading}
            className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold text-white transition-colors"
          >
            ⏸️ Stop Paper Trading
          </button>
        )}
        
        <button
          onClick={() => setShowOrderForm(!showOrderForm)}
          disabled={!status.isActive}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold text-white transition-colors"
        >
          📝 Manual Trade
        </button>
        
        <button
          onClick={handleResetAccount}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold text-white transition-colors"
        >
          🔄 Reset
        </button>
      </div>

      {/* Order Form */}
      {showOrderForm && (
        <div className="bg-gray-800/60 rounded-lg p-4 border border-gray-600">
          <h4 className="text-lg font-semibold text-gray-100 mb-4">Place Manual Order</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Symbol</label>
              <select
                value={orderForm.symbol}
                onChange={(e) => setOrderForm({...orderForm, symbol: e.target.value})}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
              >
                <option value="BTC/USDT">BTC/USDT</option>
                <option value="ETH/USDT">ETH/USDT</option>
                <option value="SOL/USDT">SOL/USDT</option>
                <option value="ADA/USDT">ADA/USDT</option>
                <option value="DOT/USDT">DOT/USDT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Side</label>
              <select
                value={orderForm.side}
                onChange={(e) => setOrderForm({...orderForm, side: e.target.value as 'long' | 'short'})}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
              >
                <option value="long">Long (Buy)</option>
                <option value="short">Short (Sell)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount ($)</label>
              <input
                type="number"
                value={orderForm.amount}
                onChange={(e) => setOrderForm({...orderForm, amount: parseFloat(e.target.value) || 0})}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
                min="1"
                max={status.account.marginAvailable}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Leverage</label>
              <select
                value={orderForm.leverage}
                onChange={(e) => setOrderForm({...orderForm, leverage: parseInt(e.target.value)})}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={5}>5x</option>
                <option value={10}>10x</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Stop Loss ($)</label>
              <input
                type="number"
                value={orderForm.stopLoss}
                onChange={(e) => setOrderForm({...orderForm, stopLoss: e.target.value})}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
                placeholder="Optional"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Take Profit ($)</label>
              <input
                type="number"
                value={orderForm.takeProfit}
                onChange={(e) => setOrderForm({...orderForm, takeProfit: e.target.value})}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
                placeholder="Optional"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePlaceOrder}
              className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold text-white transition-colors"
            >
              🚀 Place Order
            </button>
            <button
              onClick={() => setShowOrderForm(false)}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="mt-4 pt-4 border-t border-gray-600/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Real-time Data Connection:</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status.connectionStatus ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className={status.connectionStatus ? 'text-green-400' : 'text-red-400'}>
              {status.connectionStatus ? 'Connected to Binance' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperTradingControls;
