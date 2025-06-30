import React, { useState, useEffect, useCallback } from 'react';
import { MomentumSignal, HunterConfig, MomentumFilter } from '../types';
import MomentumHunterService from '../services/momentumHunterService';
import SignalCard from './SignalCard';
import ConfigPanel from './ConfigPanel';

const MomentumDashboard: React.FC = () => {
  const [signals, setSignals] = useState<MomentumSignal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const hunterService = MomentumHunterService.getInstance();
  
  const [config, setConfig] = useState<HunterConfig>(hunterService.getConfig());
  const [filter, setFilter] = useState<MomentumFilter>({
      minVolumeIncrease: 300,
      minPriceChange: 20,
      minMarketCap: 100000,
      maxMarketCap: 50000000,
      minLiquidityScore: 60,
      exchanges: ['binance', 'coinbase', 'uniswap', 'pancakeswap'],
      excludeStablecoins: true,
      minSocialMentions: 50,
      timeframe: '1h'
  });

  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  const scanForSignals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newSignals = await hunterService.scanForMomentumOpportunities(filter);
      setSignals(newSignals);
      setLastUpdated(new Date());
    } catch (err) {
      let message = 'An unknown error occurred while fetching signals.';
      if (err instanceof Error) {
        // Provide specific, user-friendly feedback for different error types
        if (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('429')) {
          message = 'API Rate Limit Exceeded. Please wait a moment before scanning again.';
        } else if (err.message.includes('API_KEY_INVALID') || err.message.includes('401')) {
          message = 'Invalid API Key. Please check your Gemini API key configuration.';
        } else if (err.message.includes('QUOTA_EXCEEDED')) {
          message = 'API Quota Exceeded. Please check your Gemini API usage limits.';
        } else {
          message = err.message;
        }
      }
      setError(message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [hunterService, filter]);

  useEffect(() => {
    // Scan only on the initial component mount. Subsequent scans are triggered manually.
    scanForSignals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfigChange = (newConfig: HunterConfig) => {
    hunterService.updateConfig(newConfig);
    setConfig(newConfig);
  };
  
  const handleFilterChange = (newFilter: MomentumFilter) => {
      setFilter(newFilter);
  }

  const handleExecuteTrade = (signal: MomentumSignal) => {
    // This would integrate with your trading system
    alert(`Execute trade for ${signal.symbol} - Entry: $${signal.entryPrice}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              🚀 Momentum Hunter AI
            </h1>
            <p className="text-gray-400 mt-2">
              AI-powered detection of massive gain opportunities
            </p>
            <p className="text-gray-500 text-sm">
              {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading signals...'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
              <button
                  onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
                  className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
                  title="Configuration"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
              </button>
              <button
                  onClick={scanForSignals}
                  disabled={isLoading}
                  className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                  {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  )}
                  {isLoading ? 'AI Scanning Market...' : 'Scan for Opportunities'}
              </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Signals Found</p>
            <p className="text-2xl font-bold text-white">{signals.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Risk Level</p>
            <p className="text-xl font-bold text-yellow-400">{config.riskTolerance}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Max Allocation</p>
            <p className="text-xl font-bold text-blue-400">{config.maxAllocation}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Timeframe</p>
            <p className="text-xl font-bold text-green-400">{filter.timeframe}</p>
          </div>
        </div>
        
        {isConfigPanelOpen && (
          <ConfigPanel 
            config={config} 
            onConfigChange={handleConfigChange} 
            filter={filter} 
            onFilterChange={handleFilterChange} 
            onClose={() => setIsConfigPanelOpen(false)} 
          />
        )}

        {/* Main Content */}
        {isLoading && signals.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center px-6 py-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
              <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-400 font-medium">AI analyzing market for massive gain opportunities...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto bg-red-900/20 border border-red-500/30 rounded-lg p-6">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <p className="text-red-400 font-bold text-xl mb-2">Error Fetching Signals</p>
              <p className="text-gray-300 mb-4">{error}</p>
              <button
                onClick={scanForSignals}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : signals.length > 0 ? (
          <>
            {/* High Priority Alerts */}
            {signals.filter(s => s.recommendedAction === 'BUY_IMMEDIATELY').length > 0 && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500/50 rounded-lg p-4">
                  <h2 className="text-xl font-bold text-red-400 mb-2 flex items-center">
                    🚨 IMMEDIATE ACTION REQUIRED
                  </h2>
                  <p className="text-gray-300 mb-4">
                    {signals.filter(s => s.recommendedAction === 'BUY_IMMEDIATELY').length} high-confidence signals detected requiring immediate action
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {signals
                      .filter(s => s.recommendedAction === 'BUY_IMMEDIATELY')
                      .map((signal) => (
                        <div key={signal.symbol} className="relative">
                          <SignalCard signal={signal} />
                          <button
                            onClick={() => handleExecuteTrade(signal)}
                            className="absolute top-4 right-4 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold"
                          >
                            EXECUTE
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* All Signals */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                All Momentum Signals ({signals.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {signals.map((signal) => (
                  <SignalCard key={signal.symbol} signal={signal} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-400 mb-2">No Momentum Signals Found</p>
            <p className="text-gray-500 mb-6">
              The AI didn't find any opportunities matching your current criteria.
            </p>
            <button
              onClick={() => setIsConfigPanelOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Adjust Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MomentumDashboard;
