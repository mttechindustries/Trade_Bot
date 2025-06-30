import { useState, useEffect } from 'react';
import { TradingConfig, BotStatus } from '../types';
import { tradingStore } from '../store/tradingStore';

interface ConfigurationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<TradingConfig>({
    maxPositions: 5,
    riskPerTrade: 2,
    stopLossPercent: 2,
    takeProfitPercent: 6,
    enableTrailing: false,
    trailingPercent: 1,
    minTradeAmount: 10,
    maxTradeAmount: 1000,
    allowedPairs: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT'],
    strategies: ['MA_CROSSOVER', 'RSI_OVERSOLD', 'BREAKOUT']
  });

  const [botStatus, setBotStatus] = useState<BotStatus>(BotStatus.STOPPED);

  useEffect(() => {
    // Load current configuration from store
    const currentConfig = tradingStore.getState().tradingConfig;
    const currentStatus = tradingStore.getBotStatus();
    setConfig(currentConfig);
    setBotStatus(currentStatus);

    // Listen for changes
    const handleConfigChange = (newConfig: TradingConfig) => setConfig(newConfig);
    const handleStatusChange = (newStatus: BotStatus) => setBotStatus(newStatus);

    tradingStore.on('tradingConfigUpdated', handleConfigChange);
    tradingStore.on('botStatusChanged', handleStatusChange);

    return () => {
      tradingStore.off('tradingConfigUpdated', handleConfigChange);
      tradingStore.off('botStatusChanged', handleStatusChange);
    };
  }, []);

  const handleSave = () => {
    tradingStore.updateTradingConfig(config);
    tradingStore.addNotification({
      type: 'success',
      title: 'Configuration Updated',
      message: 'Trading configuration has been saved successfully.',
      read: false
    });
    onClose();
  };

  const handleInputChange = (field: keyof TradingConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'allowedPairs' | 'strategies', index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addToArray = (field: 'allowedPairs' | 'strategies') => {
    const newValue = field === 'allowedPairs' ? 'NEWPAIR' : 'NEW_STRATEGY';
    setConfig(prev => ({
      ...prev,
      [field]: [...prev[field], newValue]
    }));
  };

  const removeFromArray = (field: 'allowedPairs' | 'strategies', index: number) => {
    setConfig(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  const isRunning = botStatus === BotStatus.RUNNING;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-100">Trading Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isRunning && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                Warning: Bot is currently running. Changes will take effect after restart.
              </p>
            </div>
          )}

          {/* Risk Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Risk Management</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Positions
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={config.maxPositions}
                  onChange={(e) => handleInputChange('maxPositions', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Risk Per Trade (%)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={config.riskPerTrade}
                  onChange={(e) => handleInputChange('riskPerTrade', parseFloat(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stop Loss (%)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.1"
                  value={config.stopLossPercent}
                  onChange={(e) => handleInputChange('stopLossPercent', parseFloat(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Take Profit (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="0.1"
                  value={config.takeProfitPercent}
                  onChange={(e) => handleInputChange('takeProfitPercent', parseFloat(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableTrailing"
                checked={config.enableTrailing}
                onChange={(e) => handleInputChange('enableTrailing', e.target.checked)}
                className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary"
              />
              <label htmlFor="enableTrailing" className="text-sm font-medium text-gray-300">
                Enable Trailing Stop Loss
              </label>
            </div>

            {config.enableTrailing && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Trailing Percent (%)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={config.trailingPercent}
                  onChange={(e) => handleInputChange('trailingPercent', parseFloat(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Trade Amounts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Trade Amounts</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Trade Amount ($)
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.minTradeAmount}
                  onChange={(e) => handleInputChange('minTradeAmount', parseFloat(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Trade Amount ($)
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.maxTradeAmount}
                  onChange={(e) => handleInputChange('maxTradeAmount', parseFloat(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Allowed Pairs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Allowed Trading Pairs</h3>
            
            <div className="space-y-2">
              {config.allowedPairs.map((pair, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={pair}
                    onChange={(e) => handleArrayChange('allowedPairs', index, e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={() => removeFromArray('allowedPairs', index)}
                    className="px-3 py-2 bg-danger/20 text-danger rounded-md hover:bg-danger/30 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => addToArray('allowedPairs')}
                className="px-4 py-2 bg-primary/20 text-primary rounded-md hover:bg-primary/30 transition-colors"
              >
                Add Pair
              </button>
            </div>
          </div>

          {/* Strategies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Active Strategies</h3>
            
            <div className="space-y-2">
              {config.strategies.map((strategy, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={strategy}
                    onChange={(e) => handleArrayChange('strategies', index, e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={() => removeFromArray('strategies', index)}
                    className="px-3 py-2 bg-danger/20 text-danger rounded-md hover:bg-danger/30 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => addToArray('strategies')}
                className="px-4 py-2 bg-primary/20 text-primary rounded-md hover:bg-primary/30 transition-colors"
              >
                Add Strategy
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
