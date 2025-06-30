import { useState, useEffect } from 'react';
import MachineLearningService from '../services/machineLearningService';

interface LearningProgress {
  totalTrades: number;
  modelAccuracy: { [modelName: string]: number };
  strategyPerformance: any[];
  currentRegime: string;
  learningRate: number;
  confidence: number;
}

const LearningDashboard: React.FC = () => {
  const [learningProgress, setLearningProgress] = useState<LearningProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mlService = MachineLearningService.getInstance();
    
    const fetchLearningProgress = () => {
      try {
        const progress = mlService.getLearningProgress();
        setLearningProgress(progress);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching learning progress:', error);
        setIsLoading(false);
      }
    };

    fetchLearningProgress();
    
    // Update every 30 seconds
    const interval = setInterval(fetchLearningProgress, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !learningProgress) {
    return (
      <div className="bg-gray-800/60 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAccuracyBar = (accuracy: number) => {
    const percentage = accuracy * 100;
    const color = accuracy >= 0.7 ? 'bg-green-500' : accuracy >= 0.5 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg p-6 border border-gray-600/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-100 flex items-center">
            🧠 AI Learning Progress
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Your bot is continuously learning and improving from every trade
          </p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getConfidenceColor(learningProgress.confidence)}`}>
            {(learningProgress.confidence * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Overall Confidence</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{learningProgress.totalTrades}</div>
          <div className="text-xs text-gray-400">Total Trades Learned</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{learningProgress.currentRegime}</div>
          <div className="text-xs text-gray-400">Current Market Regime</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {(learningProgress.learningRate * 1000).toFixed(1)}
          </div>
          <div className="text-xs text-gray-400">Learning Rate (×10³)</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {learningProgress.strategyPerformance.length}
          </div>
          <div className="text-xs text-gray-400">Active Strategies</div>
        </div>
      </div>

      {/* Model Accuracy */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-100 mb-3">AI Model Performance</h4>
        <div className="space-y-3">
          {Object.entries(learningProgress.modelAccuracy).map(([modelName, accuracy]) => (
            <div key={modelName} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-300 capitalize">
                    {modelName.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-mono text-gray-400">
                    {(accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                {getAccuracyBar(accuracy)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Performance */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-100 mb-3">Strategy Learning Progress</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {learningProgress.strategyPerformance.map((strategy, index) => (
            <div key={strategy.strategyId} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-200 capitalize">
                    {strategy.strategyId.replace('_', ' ')}
                  </span>
                  <div className="flex space-x-4 text-xs">
                    <span className={`font-mono ${strategy.winRate >= 0.6 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {(strategy.winRate * 100).toFixed(1)}% WR
                    </span>
                    <span className="text-gray-400 font-mono">
                      {strategy.totalTrades} trades
                    </span>
                    <span className={`font-mono ${strategy.confidence >= 0.7 ? 'text-green-400' : 'text-gray-400'}`}>
                      {(strategy.confidence * 100).toFixed(0)}% conf
                    </span>
                  </div>
                </div>
                <div className="mt-1">
                  {getAccuracyBar(strategy.winRate)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Insights */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-blue-300 mb-2">💡 Learning Insights</h5>
        <div className="space-y-1 text-xs text-gray-300">
          <div>
            • The AI has analyzed <strong>{learningProgress.totalTrades}</strong> trades and is {learningProgress.confidence >= 0.7 ? 'highly confident' : 'moderately confident'} in its predictions
          </div>
          <div>
            • Current market regime is <strong>{learningProgress.currentRegime}</strong> - strategies are being adapted accordingly
          </div>
          <div>
            • Learning rate is automatically adjusting based on performance ({learningProgress.learningRate > 0.005 ? 'actively learning' : 'fine-tuning'})
          </div>
          <div>
            • {learningProgress.strategyPerformance.filter(s => s.winRate > 0.6).length} out of {learningProgress.strategyPerformance.length} strategies are performing above 60% win rate
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < Math.floor(learningProgress.confidence * 5) 
                  ? 'bg-green-400' 
                  : 'bg-gray-600'
              }`}
            ></div>
          ))}
        </div>
        <span className="ml-3 text-xs text-gray-400">
          Learning Progress: {Math.floor(learningProgress.confidence * 5)}/5
        </span>
      </div>
    </div>
  );
};

export default LearningDashboard;
