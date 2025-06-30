import React from 'react';
import { HunterConfig, MomentumFilter } from '../types';

interface ConfigPanelProps {
  config: HunterConfig;
  onConfigChange: (config: HunterConfig) => void;
  filter: MomentumFilter;
  onFilterChange: (filter: MomentumFilter) => void;
  onClose: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
  config, 
  onConfigChange, 
  filter, 
  onFilterChange, 
  onClose 
}) => {
  const handleConfigChange = (field: keyof HunterConfig, value: any) => {
    onConfigChange({ ...config, [field]: value });
  };

  const handleFilterChange = (field: keyof MomentumFilter, value: any) => {
    onFilterChange({ ...filter, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Momentum Hunter Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hunter Config */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Hunter Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Risk Tolerance
                </label>
                <select
                  value={config.riskTolerance}
                  onChange={(e) => handleConfigChange('riskTolerance', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="CONSERVATIVE">Conservative</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="AGGRESSIVE">Aggressive</option>
                  <option value="EXTREME">Extreme</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Positions: {config.maxPositions}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={config.maxPositions}
                  onChange={(e) => handleConfigChange('maxPositions', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Allocation (%): {config.maxAllocation}%
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={config.maxAllocation}
                  onChange={(e) => handleConfigChange('maxAllocation', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quick Profit Target (%): {config.quickProfitTarget}%
                </label>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={config.quickProfitTarget}
                  onChange={(e) => handleConfigChange('quickProfitTarget', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stop Loss (%): {config.stopLossPercent}%
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={config.stopLossPercent}
                  onChange={(e) => handleConfigChange('stopLossPercent', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Hold Time (hours): {config.maxHoldTime}h
                </label>
                <input
                  type="range"
                  min="1"
                  max="168"
                  value={config.maxHoldTime}
                  onChange={(e) => handleConfigChange('maxHoldTime', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Enable Signals</h4>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.enableVolumeSignals}
                    onChange={(e) => handleConfigChange('enableVolumeSignals', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-white">Volume Signals</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.enableSocialSignals}
                    onChange={(e) => handleConfigChange('enableSocialSignals', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-white">Social Signals</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.enableOnChainSignals}
                    onChange={(e) => handleConfigChange('enableOnChainSignals', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-white">On-Chain Signals</span>
                </label>
              </div>
            </div>
          </div>

          {/* Filter Settings */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Scan Filters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timeframe
                </label>
                <select
                  value={filter.timeframe}
                  onChange={(e) => handleFilterChange('timeframe', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="5m">5 minutes</option>
                  <option value="15m">15 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="4h">4 hours</option>
                  <option value="24h">24 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Volume Increase (%): {filter.minVolumeIncrease}%
                </label>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={filter.minVolumeIncrease}
                  onChange={(e) => handleFilterChange('minVolumeIncrease', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Price Change (%): {filter.minPriceChange}%
                </label>
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={filter.minPriceChange}
                  onChange={(e) => handleFilterChange('minPriceChange', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Market Cap ($)
                </label>
                <input
                  type="number"
                  value={filter.minMarketCap || ''}
                  onChange={(e) => handleFilterChange('minMarketCap', parseInt(e.target.value) || undefined)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="100000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Market Cap ($)
                </label>
                <input
                  type="number"
                  value={filter.maxMarketCap || ''}
                  onChange={(e) => handleFilterChange('maxMarketCap', parseInt(e.target.value) || undefined)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="100000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Liquidity Score: {filter.minLiquidityScore}/100
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={filter.minLiquidityScore}
                  onChange={(e) => handleFilterChange('minLiquidityScore', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Social Mentions
                </label>
                <input
                  type="number"
                  value={filter.minSocialMentions || ''}
                  onChange={(e) => handleFilterChange('minSocialMentions', parseInt(e.target.value) || undefined)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filter.excludeStablecoins}
                    onChange={(e) => handleFilterChange('excludeStablecoins', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-white">Exclude Stablecoins</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exchanges
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['binance', 'coinbase', 'uniswap', 'pancakeswap', 'kraken', 'bitfinex'].map(exchange => (
                    <label key={exchange} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filter.exchanges.includes(exchange)}
                        onChange={(e) => {
                          const newExchanges = e.target.checked
                            ? [...filter.exchanges, exchange]
                            : filter.exchanges.filter(ex => ex !== exchange);
                          handleFilterChange('exchanges', newExchanges);
                        }}
                        className="mr-2"
                      />
                      <span className="text-white capitalize">{exchange}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
