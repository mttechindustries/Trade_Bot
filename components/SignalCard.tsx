import React from 'react';
import { MomentumSignal } from '../types';
import { safeToLocaleString, safeToFixed } from '../utils/formatters';

interface SignalCardProps {
  signal: MomentumSignal;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
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
      case 'EXTREME': return 'text-red-400 bg-red-900/30';
      case 'HIGH': return 'text-orange-400 bg-orange-900/30';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/30';
      case 'LOW': return 'text-green-400 bg-green-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY_IMMEDIATELY': return 'text-green-400 bg-green-900/30';
      case 'WAIT_FOR_DIP': return 'text-yellow-400 bg-yellow-900/30';
      case 'MONITOR': return 'text-blue-400 bg-blue-900/30';
      case 'AVOID': return 'text-red-400 bg-red-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price) || !isFinite(price)) return '0.0000';
    if (price < 0.001) return safeToFixed(price, 8);
    if (price < 1) return safeToFixed(price, 6);
    return safeToFixed(price, 4);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{getSignalTypeIcon(signal.signalType)}</span>
          <div>
            <h3 className="text-xl font-bold text-white">{signal.symbol}</h3>
            <p className="text-gray-400 text-sm">{signal.exchange}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(signal.riskLevel)}`}>
            {signal.riskLevel} RISK
          </div>
          <div className="text-gray-400 text-xs mt-1">{signal.signalType}</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900 rounded p-3">
          <p className="text-gray-400 text-xs">Potential Gain</p>
          <p className="text-green-400 text-xl font-bold">
            {safeToFixed(signal.potentialGainEstimate, 0)}%
          </p>
        </div>
        <div className="bg-gray-900 rounded p-3">
          <p className="text-gray-400 text-xs">Confidence</p>
          <p className="text-blue-400 text-xl font-bold">
            {signal.confidence}%
          </p>
        </div>
      </div>

      {/* Price Info */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
        <div>
          <p className="text-gray-400">Current Price</p>
          <p className="text-white font-mono">${formatPrice(signal.price)}</p>
        </div>
        <div>
          <p className="text-gray-400">Entry Price</p>
          <p className="text-white font-mono">${formatPrice(signal.entryPrice)}</p>
        </div>
        <div>
          <p className="text-gray-400">24h Change</p>
          <p className={`font-bold ${signal.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {signal.priceChange24h > 0 ? '+' : ''}{safeToFixed(signal.priceChange24h, 1)}%
          </p>
        </div>
      </div>

      {/* Volume & Market Data */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-400">Volume Increase</p>
          <p className="text-yellow-400 font-bold">
            {safeToFixed(signal.volumeIncrease, 0)}%
          </p>
        </div>
        <div>
          <p className="text-gray-400">Liquidity Score</p>
          <p className="text-blue-400 font-bold">
            {signal.liquidityScore}/100
          </p>
        </div>
      </div>

      {/* Take Profit Levels */}
      <div className="mb-4">
        <p className="text-gray-400 text-xs mb-2">Take Profit Levels</p>
        <div className="flex space-x-1">
          {signal.takeProfitLevels.slice(0, 4).map((level, index) => (
            <div key={index} className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs font-mono">
              ${formatPrice(level)}
            </div>
          ))}
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-4">
        <p className="text-gray-400 text-xs mb-2">Analysis</p>
        <ul className="space-y-1">
          {signal.reasoning.map((reason, index) => (
            <li key={index} className="text-gray-300 text-sm flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Social/OnChain Metrics */}
      {(signal.socialMetrics || signal.onChainMetrics) && (
        <div className="mb-4">
          {signal.socialMetrics && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 mb-2">
              <p className="text-blue-400 font-bold text-sm mb-2">Social Metrics</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Twitter:</span>
                  <span className="text-white ml-1">{safeToLocaleString(signal.socialMetrics.twitterMentions)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Reddit:</span>
                  <span className="text-white ml-1">{safeToLocaleString(signal.socialMetrics.redditPosts)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Sentiment:</span>
                  <span className="text-green-400 ml-1">{signal.socialMetrics.sentimentScore}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Influencers:</span>
                  <span className="text-white ml-1">{signal.socialMetrics.influencerMentions}</span>
                </div>
              </div>
            </div>
          )}
          {signal.onChainMetrics && (
            <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
              <p className="text-green-400 font-bold text-sm mb-2">On-Chain Metrics</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Holders:</span>
                  <span className="text-white ml-1">{safeToLocaleString(signal.onChainMetrics.uniqueHolders)}</span>
                </div>
                <div>
                  <span className="text-gray-400">New Holders:</span>
                  <span className="text-green-400 ml-1">+{safeToLocaleString(signal.onChainMetrics.holderIncrease24h)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Whale Txs:</span>
                  <span className="text-yellow-400 ml-1">{signal.onChainMetrics.whaleTransactions}</span>
                </div>
                <div>
                  <span className="text-gray-400">Burns:</span>
                  <span className="text-red-400 ml-1">{signal.onChainMetrics.burnEvents}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {new Date(signal.timeDetected).toLocaleTimeString()}
        </div>
        <div className={`px-3 py-1 rounded text-sm font-bold ${getActionColor(signal.recommendedAction)}`}>
          {signal.recommendedAction.replace(/_/g, ' ')}
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">
            Strength: <span className="text-white">{signal.strength}/100</span>
          </span>
          <span className="text-gray-400">
            Stop Loss: <span className="text-red-400">${formatPrice(signal.stopLoss)}</span>
          </span>
          {signal.marketCap && (
            <span className="text-gray-400">
              MCap: <span className="text-white">${safeToFixed((signal.marketCap || 0) / 1000000, 1)}M</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignalCard;
