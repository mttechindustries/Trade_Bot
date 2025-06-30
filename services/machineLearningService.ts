import { Trade, CandlestickData, TickerData } from '../types';
import { TimeService } from './timeService';

interface TradeOutcome {
  tradeId: string;
  symbol: string;
  strategy: string;
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  profitLoss: number;
  profitPercentage: number;
  marketConditions: MarketConditions;
  indicators: { [key: string]: number };
  confidence: number;
  timeframe: string;
  features: number[]; // Normalized feature vector
  success: boolean; // Profitable trade or not
}

interface MarketConditions {
  volatility: number;
  volume: number;
  trend: number; // -1 to 1
  rsi: number;
  macd: number;
  bollinger_position: number; // Position within Bollinger Bands
  market_session: 'pre-market' | 'market' | 'after-market' | 'closed';
  day_of_week: number;
  hour_of_day: number;
}

interface LearningModel {
  weights: number[];
  bias: number;
  learningRate: number;
  momentum: number[];
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  lastUpdated: string;
}

interface StrategyPerformance {
  strategyId: string;
  totalTrades: number;
  profitableTrades: number;
  totalProfit: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  sharpeRatio: number;
  maxDrawdown: number;
  confidence: number; // Current confidence in this strategy
  recentPerformance: number[]; // Last 20 trade results
  adaptedParameters: { [key: string]: any };
  lastOptimization: string;
}

interface MarketRegime {
  name: string;
  description: string;
  conditions: {
    volatilityRange: [number, number];
    trendRange: [number, number];
    volumeRange: [number, number];
  };
  bestStrategies: string[];
  performance: number;
  frequency: number; // How often this regime occurs
}

class MachineLearningService {
  private static instance: MachineLearningService;
  private tradeHistory: TradeOutcome[] = [];
  private strategyPerformance: Map<string, StrategyPerformance> = new Map();
  private models: Map<string, LearningModel> = new Map();
  private marketRegimes: MarketRegime[] = [];
  private currentRegime: MarketRegime | null = null;
  private featureImportance: Map<string, number> = new Map();

  private constructor() {
    this.initializeModels();
    this.initializeMarketRegimes();
    this.loadHistoricalData();
  }

  static getInstance(): MachineLearningService {
    if (!MachineLearningService.instance) {
      MachineLearningService.instance = new MachineLearningService();
    }
    return MachineLearningService.instance;
  }

  /**
   * Initialize machine learning models
   */
  private initializeModels(): void {
    // Neural network for trade success prediction
    this.models.set('trade_success', {
      weights: Array(20).fill(0).map(() => Math.random() * 0.1 - 0.05),
      bias: 0,
      learningRate: 0.001,
      momentum: Array(20).fill(0),
      accuracy: 0.5,
      totalPredictions: 0,
      correctPredictions: 0,
      lastUpdated: TimeService.getCurrentTime().toISOString()
    });

    // Model for optimal entry timing
    this.models.set('entry_timing', {
      weights: Array(15).fill(0).map(() => Math.random() * 0.1 - 0.05),
      bias: 0,
      learningRate: 0.002,
      momentum: Array(15).fill(0),
      accuracy: 0.5,
      totalPredictions: 0,
      correctPredictions: 0,
      lastUpdated: TimeService.getCurrentTime().toISOString()
    });

    // Model for risk assessment
    this.models.set('risk_assessment', {
      weights: Array(12).fill(0).map(() => Math.random() * 0.1 - 0.05),
      bias: 0,
      learningRate: 0.0015,
      momentum: Array(12).fill(0),
      accuracy: 0.5,
      totalPredictions: 0,
      correctPredictions: 0,
      lastUpdated: TimeService.getCurrentTime().toISOString()
    });
  }

  /**
   * Initialize market regime detection
   */
  private initializeMarketRegimes(): void {
    this.marketRegimes = [
      {
        name: 'bull_market',
        description: 'Strong upward trend with high confidence',
        conditions: {
          volatilityRange: [0.1, 0.4],
          trendRange: [0.3, 1.0],
          volumeRange: [0.4, 1.0]
        },
        bestStrategies: ['macd_trend', 'momentum_breakout'],
        performance: 0,
        frequency: 0
      },
      {
        name: 'bear_market',
        description: 'Strong downward trend',
        conditions: {
          volatilityRange: [0.2, 0.8],
          trendRange: [-1.0, -0.3],
          volumeRange: [0.3, 1.0]
        },
        bestStrategies: ['rsi_mean_reversion', 'contrarian'],
        performance: 0,
        frequency: 0
      },
      {
        name: 'sideways_market',
        description: 'Range-bound market with low trend',
        conditions: {
          volatilityRange: [0.05, 0.3],
          trendRange: [-0.2, 0.2],
          volumeRange: [0.2, 0.7]
        },
        bestStrategies: ['rsi_mean_reversion', 'bollinger_bands'],
        performance: 0,
        frequency: 0
      },
      {
        name: 'high_volatility',
        description: 'High volatility period with uncertain direction',
        conditions: {
          volatilityRange: [0.5, 1.0],
          trendRange: [-0.5, 0.5],
          volumeRange: [0.3, 1.0]
        },
        bestStrategies: ['volatility_breakout', 'news_momentum'],
        performance: 0,
        frequency: 0
      }
    ];
  }

  /**
   * Load and process historical trade data for initial training
   */
  private loadHistoricalData(): void {
    // In a real implementation, this would load from database
    // For now, we'll simulate some historical learning
    const simulatedTrades = this.generateSimulatedHistory();
    simulatedTrades.forEach(trade => this.learnFromTrade(trade));
  }

  /**
   * Main learning function - called after each completed trade
   */
  public learnFromTrade(trade: TradeOutcome): void {
    this.tradeHistory.push(trade);
    
    // Update strategy performance
    this.updateStrategyPerformance(trade);
    
    // Train models
    this.trainModels(trade);
    
    // Update market regime understanding
    this.updateMarketRegimeKnowledge(trade);
    
    // Adapt strategy parameters
    this.adaptStrategyParameters(trade);
    
    // Update feature importance
    this.updateFeatureImportance(trade);
    
    // Keep only recent history (last 1000 trades)
    if (this.tradeHistory.length > 1000) {
      this.tradeHistory = this.tradeHistory.slice(-1000);
    }
  }

  /**
   * Predict trade success probability
   */
  public predictTradeSuccess(features: number[]): number {
    const model = this.models.get('trade_success')!;
    return this.sigmoid(this.dotProduct(features, model.weights) + model.bias);
  }

  /**
   * Predict optimal entry timing score
   */
  public predictEntryTiming(marketConditions: MarketConditions): number {
    const features = this.extractTimingFeatures(marketConditions);
    const model = this.models.get('entry_timing')!;
    return this.sigmoid(this.dotProduct(features, model.weights) + model.bias);
  }

  /**
   * Assess risk level for a potential trade
   */
  public assessRisk(features: number[]): number {
    const model = this.models.get('risk_assessment')!;
    return this.sigmoid(this.dotProduct(features, model.weights) + model.bias);
  }

  /**
   * Get adaptive strategy recommendations based on current market conditions
   */
  public getAdaptiveStrategyRecommendations(
    marketConditions: MarketConditions
  ): {
    strategy: string;
    confidence: number;
    adaptedParameters: { [key: string]: any };
    reasoning: string[];
  }[] {
    const currentRegime = this.detectCurrentMarketRegime(marketConditions);
    const recommendations: any[] = [];

    for (const strategyId of currentRegime.bestStrategies) {
      const performance = this.strategyPerformance.get(strategyId);
      if (performance) {
        const confidence = this.calculateStrategyConfidence(strategyId, marketConditions);
        recommendations.push({
          strategy: strategyId,
          confidence,
          adaptedParameters: performance.adaptedParameters,
          reasoning: this.generateStrategyReasoning(strategyId, currentRegime, performance)
        });
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get learning progress and model performance
   */
  public getLearningProgress(): {
    totalTrades: number;
    modelAccuracy: { [modelName: string]: number };
    strategyPerformance: StrategyPerformance[];
    currentRegime: string;
    learningRate: number;
    confidence: number;
  } {
    const modelAccuracy: { [key: string]: number } = {};
    this.models.forEach((model, name) => {
      modelAccuracy[name] = model.accuracy;
    });

    const overallConfidence = this.calculateOverallConfidence();

    return {
      totalTrades: this.tradeHistory.length,
      modelAccuracy,
      strategyPerformance: Array.from(this.strategyPerformance.values()),
      currentRegime: this.currentRegime?.name || 'unknown',
      learningRate: this.calculateAdaptiveLearningRate(),
      confidence: overallConfidence
    };
  }

  /**
   * Private helper methods
   */
  private updateStrategyPerformance(trade: TradeOutcome): void {
    const existing = this.strategyPerformance.get(trade.strategy);
    
    if (existing) {
      existing.totalTrades++;
      if (trade.success) existing.profitableTrades++;
      existing.totalProfit += trade.profitLoss;
      existing.winRate = existing.profitableTrades / existing.totalTrades;
      existing.recentPerformance.push(trade.profitPercentage);
      if (existing.recentPerformance.length > 20) {
        existing.recentPerformance.shift();
      }
    } else {
      this.strategyPerformance.set(trade.strategy, {
        strategyId: trade.strategy,
        totalTrades: 1,
        profitableTrades: trade.success ? 1 : 0,
        totalProfit: trade.profitLoss,
        winRate: trade.success ? 1 : 0,
        avgProfit: trade.success ? trade.profitLoss : 0,
        avgLoss: !trade.success ? trade.profitLoss : 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        confidence: 0.5,
        recentPerformance: [trade.profitPercentage],
        adaptedParameters: {},
        lastOptimization: TimeService.getCurrentTime().toISOString()
      });
    }
  }

  private trainModels(trade: TradeOutcome): void {
    // Train trade success model
    const tradeModel = this.models.get('trade_success')!;
    const prediction = this.predictTradeSuccess(trade.features);
    const error = (trade.success ? 1 : 0) - prediction;
    this.updateWeights(tradeModel, trade.features, error);
    
    // Update accuracy
    tradeModel.totalPredictions++;
    if ((prediction > 0.5 && trade.success) || (prediction <= 0.5 && !trade.success)) {
      tradeModel.correctPredictions++;
    }
    tradeModel.accuracy = tradeModel.correctPredictions / tradeModel.totalPredictions;
  }

  private detectCurrentMarketRegime(conditions: MarketConditions): MarketRegime {
    for (const regime of this.marketRegimes) {
      const { volatilityRange, trendRange, volumeRange } = regime.conditions;
      
      if (
        conditions.volatility >= volatilityRange[0] && conditions.volatility <= volatilityRange[1] &&
        conditions.trend >= trendRange[0] && conditions.trend <= trendRange[1] &&
        conditions.volume >= volumeRange[0] && conditions.volume <= volumeRange[1]
      ) {
        this.currentRegime = regime;
        return regime;
      }
    }
    
    return this.marketRegimes[2]; // Default to sideways market
  }

  private calculateStrategyConfidence(strategyId: string, conditions: MarketConditions): number {
    const performance = this.strategyPerformance.get(strategyId);
    if (!performance) return 0.5;

    const baseConfidence = performance.winRate;
    const recentPerformance = performance.recentPerformance.slice(-10);
    const recentAvg = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;
    
    // Adjust based on recent performance and market conditions
    const marketFit = this.calculateMarketFit(strategyId, conditions);
    
    return Math.min(0.95, Math.max(0.05, baseConfidence * 0.6 + recentAvg * 0.2 + marketFit * 0.2));
  }

  private calculateMarketFit(strategyId: string, conditions: MarketConditions): number {
    // Simple heuristic for strategy-market fit
    if (strategyId.includes('trend') && Math.abs(conditions.trend) > 0.3) return 0.8;
    if (strategyId.includes('mean_reversion') && Math.abs(conditions.trend) < 0.2) return 0.8;
    if (strategyId.includes('volatility') && conditions.volatility > 0.5) return 0.8;
    return 0.5;
  }

  private updateWeights(model: LearningModel, features: number[], error: number): void {
    for (let i = 0; i < model.weights.length && i < features.length; i++) {
      const gradient = error * features[i];
      model.momentum[i] = 0.9 * model.momentum[i] + model.learningRate * gradient;
      model.weights[i] += model.momentum[i];
    }
    model.bias += model.learningRate * error;
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
  }

  private extractTimingFeatures(conditions: MarketConditions): number[] {
    return [
      conditions.volatility,
      conditions.volume,
      conditions.trend,
      conditions.rsi / 100,
      conditions.macd,
      conditions.bollinger_position,
      conditions.day_of_week / 7,
      conditions.hour_of_day / 24,
      conditions.market_session === 'market' ? 1 : 0
    ];
  }

  private generateSimulatedHistory(): TradeOutcome[] {
    // Generate realistic historical trade data for initial training
    const trades: TradeOutcome[] = [];
    const strategies = ['rsi_mean_reversion', 'macd_trend', 'momentum_breakout'];
    
    for (let i = 0; i < 100; i++) {
      const strategy = strategies[Math.floor(Math.random() * strategies.length)];
      const success = Math.random() > 0.4; // 60% success rate for simulation
      const profitPercentage = success ? Math.random() * 10 - 2 : -(Math.random() * 8 + 1);
      
      trades.push({
        tradeId: `sim_${i}`,
        symbol: 'BTC/USDT',
        strategy,
        entryTime: TimeService.generateHistoricalTime(Math.random() * 30).toISOString(),
        exitTime: TimeService.generateHistoricalTime(Math.random() * 30 - 0.5).toISOString(),
        entryPrice: 50000 + Math.random() * 20000,
        exitPrice: 50000 + Math.random() * 20000,
        profitLoss: profitPercentage * 100,
        profitPercentage,
        marketConditions: {
          volatility: Math.random(),
          volume: Math.random(),
          trend: Math.random() * 2 - 1,
          rsi: Math.random() * 100,
          macd: Math.random() * 2 - 1,
          bollinger_position: Math.random(),
          market_session: 'market',
          day_of_week: Math.floor(Math.random() * 7),
          hour_of_day: Math.floor(Math.random() * 24)
        },
        indicators: {},
        confidence: Math.random(),
        timeframe: '1h',
        features: Array(20).fill(0).map(() => Math.random()),
        success
      });
    }
    
    return trades;
  }

  private updateMarketRegimeKnowledge(trade: TradeOutcome): void {
    // Update regime frequency and performance
    if (this.currentRegime) {
      this.currentRegime.frequency++;
      this.currentRegime.performance = 
        (this.currentRegime.performance + (trade.success ? 1 : 0)) / 2;
    }
  }

  private adaptStrategyParameters(trade: TradeOutcome): void {
    const performance = this.strategyPerformance.get(trade.strategy);
    if (performance && performance.totalTrades > 10) {
      // Simple parameter adaptation based on recent performance
      if (performance.recentPerformance.slice(-5).every(p => p < 0)) {
        // Recent losses - make strategy more conservative
        performance.adaptedParameters.risk_multiplier = 0.8;
        performance.adaptedParameters.confidence_threshold = 0.7;
      } else if (performance.recentPerformance.slice(-5).every(p => p > 0)) {
        // Recent wins - can be more aggressive
        performance.adaptedParameters.risk_multiplier = 1.2;
        performance.adaptedParameters.confidence_threshold = 0.5;
      }
    }
  }

  private updateFeatureImportance(trade: TradeOutcome): void {
    // Simple feature importance based on correlation with success
    trade.features.forEach((value, index) => {
      const featureName = `feature_${index}`;
      const currentImportance = this.featureImportance.get(featureName) || 0;
      const correlation = trade.success ? value : -value;
      this.featureImportance.set(featureName, currentImportance * 0.9 + correlation * 0.1);
    });
  }

  private calculateOverallConfidence(): number {
    const accuracies = Array.from(this.models.values()).map(m => m.accuracy);
    const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const tradeSample = Math.min(this.tradeHistory.length / 100, 1); // Confidence grows with sample size
    return avgAccuracy * tradeSample;
  }

  private calculateAdaptiveLearningRate(): number {
    const overallAccuracy = this.calculateOverallConfidence();
    // Lower learning rate as accuracy improves
    return Math.max(0.0001, 0.01 * (1 - overallAccuracy));
  }

  private generateStrategyReasoning(
    strategyId: string,
    regime: MarketRegime,
    performance: StrategyPerformance
  ): string[] {
    return [
      `Strategy has ${(performance.winRate * 100).toFixed(1)}% win rate with ${performance.totalTrades} trades`,
      `Current market regime: ${regime.description}`,
      `Recent performance: ${performance.recentPerformance.slice(-3).map(p => p.toFixed(1) + '%').join(', ')}`,
      `Adapted for current conditions with ${(performance.confidence * 100).toFixed(1)}% confidence`
    ];
  }
}

export default MachineLearningService;
