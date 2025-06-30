import React, { useState, useEffect } from 'react';
import MomentumHunterService, { MomentumSignal, MomentumFilter } from '../services/momentumHunterService';
import MomentumAlertService, { Alert } from '../services/momentumAlertService';
import QuickExecutionService from '../services/quickExecutionService';
import { safeToLocaleString, safeToFixed } from '../utils/formatters';

interface MomentumHunterDashboardProps {
  portfolioValue: number;
  onExecuteTrade?: (signal: MomentumSignal) => void;
}

const MomentumHunterDashboard: React.FC<MomentumHunterDashboardProps> = ({ 
  portfolioValue, 
  onExecuteTrade 
}) => {
  const [signals, setSignals] = useState<MomentumSignal[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<MomentumFilter>({
    minVolumeIncrease: 500,
    minPriceChange: 50,
    minMarketCap: 500000,
    maxMarketCap: 100000000,
    minLiquidityScore: 70,
    exchanges: ['binance', 'coinbase', 'uniswap'],
    excludeStablecoins: true,
    minSocialMentions: 100,
    timeframe: '1h'
  });
  const [autoScan, setAutoScan] = useState(true);

  const momentumService = MomentumHunterService.getInstance();
  const alertService = MomentumAlertService.getInstance();
  const executionService = QuickExecutionService.getInstance();

  useEffect(() => {
    scanForOpportunities();
    loadAlerts();

    if (autoScan) {
      const interval = setInterval(() => {
        scanForOpportunities();
        loadAlerts();
      }, 30000); // Scan every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoScan, filter]);

  const scanForOpportunities = async () => {
    setLoading(true);
    try {
      const newSignals = await momentumService.scanForMomentumOpportunities(filter);
      setSignals(newSignals);

      // Process signals for alerts
      for (const signal of newSignals) {
        await alertService.processSignal(signal);
      }
    } catch (error) {
      console.error('Error scanning for opportunities:', error);
    }
    setLoading(false);
  };

  const loadAlerts = () => {
    const activeAlerts = alertService.getActiveAlerts();
    setAlerts(activeAlerts);
  };

  const executeQuickTrade = async (signal: MomentumSignal) => {
    const positionSize = portfolioValue * 0.05; // 5% of portfolio
    
    try {
      const result = await executionService.executeQuickTrade(signal, positionSize, portfolioValue);
      
      if (result.success) {
        alert(`✅ Trade executed: ${signal.symbol} at $${safeToFixed(result.executedPrice, 6)}`);
        if (onExecuteTrade) {
          onExecuteTrade(signal);
        }
      } else {
        alert(`❌ Trade failed: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Execution error:', error);
      alert('Execution failed');
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    alertService.acknowledgeAlert(alertId);
    loadAlerts();
  };

  const getSignalTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'VOLUME_SPIKE': '📊',
      'SOCIAL_BUZZ': '🔥',
      'WHALE_ACTIVITY': '🐋',
      'NEW_LISTING': '🆕',
      'BREAKOUT': '🚀',
      'INSIDER_FLOW': '💎'
    };
    return icons[type] || '⚡';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'EXTREME': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-white';
      case 'LOW': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            🚀 Momentum Hunter Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Detect and capture massive gain opportunities before they explode
          </p>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">🚨 Active Alerts</h2>
            <div className="grid gap-4">
              {alerts.slice(0, 3).map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.priority === 'CRITICAL' ? 'border-red-500 bg-red-50' : 
                    alert.priority === 'HIGH' ? 'border-orange-500 bg-orange-50' :
                    'border-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                        <span className="font-semibold text-lg">
                          {getSignalTypeIcon(alert.signal.signalType)} {alert.signal.symbol}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {alert.message}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {alert.actionRequired && (
                        <button
                          onClick={() => executeQuickTrade(alert.signal)}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                        >
                          🚀 Execute
                        </button>
                      )}
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Scan Controls</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoScan}
                  onChange={(e) => setAutoScan(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Auto-scan (30s)</span>
              </label>
              <button
                onClick={scanForOpportunities}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Scanning...' : '🔍 Scan Now'}
              </button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Volume Increase %
              </label>
              <input
                type="number"
                value={filter.minVolumeIncrease}
                onChange={(e) => setFilter({...filter, minVolumeIncrease: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price Change %
              </label>
              <input
                type="number"
                value={filter.minPriceChange}
                onChange={(e) => setFilter({...filter, minPriceChange: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Market Cap
              </label>
              <input
                type="number"
                value={filter.minMarketCap}
                onChange={(e) => setFilter({...filter, minMarketCap: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Liquidity Score
              </label>
              <input
                type="number"
                value={filter.minLiquidityScore}
                onChange={(e) => setFilter({...filter, minLiquidityScore: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Momentum Signals */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            🎯 Momentum Opportunities ({signals.length})
          </h2>
          
          {signals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Scanning for opportunities...' : 'No opportunities found. Try adjusting filters.'}
            </div>
          ) : (
            <div className="grid gap-4">
              {signals.map((signal, index) => (
                <div 
                  key={`${signal.symbol}-${index}`}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getSignalTypeIcon(signal.signalType)}
                      </span>
                      <div>
                        <h3 className="font-bold text-lg">{signal.symbol}</h3>
                        <p className="text-sm text-gray-600">{signal.signalType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(signal.riskLevel)}`}>
                        {signal.riskLevel} RISK
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {signal.exchange}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Current Price</p>
                      <p className="font-semibold">${safeToFixed(signal.price, 6)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">24h Change</p>
                      <p className={`font-semibold ${signal.priceChange24h > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {signal.priceChange24h > 0 ? '+' : ''}{safeToFixed(signal.priceChange24h, 1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Potential Gain</p>
                      <p className="font-semibold text-green-600">
                        {safeToFixed(signal.potentialGainEstimate, 0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Confidence</p>
                      <p className="font-semibold">
                        {signal.confidence}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Entry Price</p>
                      <p className="font-medium">${signal.entryPrice.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Stop Loss</p>
                      <p className="font-medium text-red-600">${signal.stopLoss.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Take Profit</p>
                      <p className="font-medium text-green-600">
                        ${signal.takeProfitLevels[0]?.toFixed(6)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Reasoning:</p>
                    <ul className="text-sm">
                      {signal.reasoning.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Social & On-Chain Metrics */}
                  {(signal.socialMetrics || signal.onChainMetrics) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                      {signal.socialMetrics && (
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="font-medium text-blue-800 mb-2">Social Metrics</p>
                          <p>Twitter: {safeToLocaleString(signal.socialMetrics.twitterMentions)}</p>
                          <p>Reddit: {safeToLocaleString(signal.socialMetrics.redditPosts)}</p>
                          <p>Sentiment: {signal.socialMetrics.sentimentScore}%</p>
                        </div>
                      )}
                      {signal.onChainMetrics && (
                        <div className="bg-green-50 p-3 rounded">
                          <p className="font-medium text-green-800 mb-2">On-Chain Metrics</p>
                          <p>Holders: {safeToLocaleString(signal.onChainMetrics.uniqueHolders)}</p>
                          <p>New Holders: +{safeToLocaleString(signal.onChainMetrics.holderIncrease24h)}</p>
                          <p>Whale Transactions: {signal.onChainMetrics.whaleTransactions}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Detected: {new Date(signal.timeDetected).toLocaleTimeString()}
                    </div>
                    <div className="flex gap-2">
                      {signal.recommendedAction === 'BUY_IMMEDIATELY' && (
                        <button
                          onClick={() => executeQuickTrade(signal)}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                        >
                          🚀 Execute Trade
                        </button>
                      )}
                      <button
                        onClick={() => {
                          console.log('Added to watchlist:', signal.symbol);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        👁️ Watch
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Scan Statistics</h3>
            <div className="space-y-2 text-sm">
              <p>Signals Found: <span className="font-medium">{signals.length}</span></p>
              <p>Active Alerts: <span className="font-medium text-red-600">{alerts.length}</span></p>
              <p>Last Scan: <span className="font-medium">
                {new Date().toLocaleTimeString()}
              </span></p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Execution Stats</h3>
            <div className="space-y-2 text-sm">
              <p>Success Rate: <span className="font-medium text-green-600">
                {executionService.getExecutionStats().successRate.toFixed(1)}%
              </span></p>
              <p>Avg Execution: <span className="font-medium">
                {executionService.getExecutionStats().averageExecutionTime.toFixed(0)}ms
              </span></p>
              <p>Avg Slippage: <span className="font-medium">
                {executionService.getExecutionStats().averageSlippage.toFixed(2)}%
              </span></p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Alert Stats</h3>
            <div className="space-y-2 text-sm">
              <p>Total Alerts: <span className="font-medium">
                {alertService.getAlertStats().totalAlerts}
              </span></p>
              <p>Critical Alerts: <span className="font-medium text-red-600">
                {alertService.getAlertStats().criticalAlerts}
              </span></p>
              <p>Executed: <span className="font-medium text-green-600">
                {alertService.getAlertStats().executedAlerts}
              </span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MomentumHunterDashboard;
