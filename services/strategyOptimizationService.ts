import { BacktestResult, CandlestickData } from '../types';
import TechnicalAnalysisService, { AdvancedIndicators } from './technicalAnalysisService';

export interface StrategyParameter {
  name: string;
  type: 'number' | 'boolean' | 'string';
  min?: number;
  max?: number;
  step?: number;
  default: any;
  description: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  parameters: StrategyParameter[];
  category: 'trend' | 'momentum' | 'mean_reversion' | 'volatility' | 'arbitrage';
  riskLevel: 'low' | 'medium' | 'high';
  timeframes: string[];
  execute: (data: CandlestickData[], indicators: AdvancedIndicators, params: any) => StrategySignal;
}

export interface StrategySignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  stopLoss?: number;
  takeProfit?: number[];
  reasoning: string[];
  risk: number; // Expected risk percentage
  reward: number; // Expected reward percentage
}

export interface OptimizationResult {
  parameters: { [key: string]: any };
  performance: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    totalTrades: number;
  };
  score: number; // Composite optimization score
}

export interface StrategyBacktest {
  strategy: Strategy;
  parameters: { [key: string]: any };
  results: BacktestResult;
  timeframe: string;
  dateRange: { start: string; end: string };
}

class StrategyOptimizationService {
  private static instance: StrategyOptimizationService;
  private technicalService: TechnicalAnalysisService;
  private strategies: Map<string, Strategy> = new Map();

  private constructor() {
    this.technicalService = TechnicalAnalysisService.getInstance();
    this.initializeStrategies();
  }

  static getInstance(): StrategyOptimizationService {
    if (!StrategyOptimizationService.instance) {
      StrategyOptimizationService.instance = new StrategyOptimizationService();
    }
    return StrategyOptimizationService.instance;
  }

  /**
   * Initialize built-in trading strategies
   */
  private initializeStrategies(): void {
    // RSI Mean Reversion Strategy
    this.strategies.set('rsi_mean_reversion', {
      id: 'rsi_mean_reversion',
      name: 'RSI Mean Reversion',
      description: 'Buy oversold, sell overbought based on RSI levels',
      category: 'mean_reversion',
      riskLevel: 'medium',
      timeframes: ['1h', '4h', '1d'],
      parameters: [
        { name: 'rsi_period', type: 'number', min: 5, max: 30, step: 1, default: 14, description: 'RSI calculation period' },
        { name: 'oversold_level', type: 'number', min: 15, max: 35, step: 1, default: 30, description: 'Oversold threshold' },
        { name: 'overbought_level', type: 'number', min: 65, max: 85, step: 1, default: 70, description: 'Overbought threshold' },
        { name: 'stop_loss_pct', type: 'number', min: 1, max: 10, step: 0.5, default: 3, description: 'Stop loss percentage' },
        { name: 'take_profit_pct', type: 'number', min: 2, max: 20, step: 0.5, default: 6, description: 'Take profit percentage' }
      ],
      execute: this.executeRSIStrategy.bind(this)
    });

    // MACD Trend Following Strategy
    this.strategies.set('macd_trend', {
      id: 'macd_trend',
      name: 'MACD Trend Following',
      description: 'Follow trends using MACD crossovers and histogram',
      category: 'trend',
      riskLevel: 'medium',
      timeframes: ['15m', '1h', '4h'],
      parameters: [
        { name: 'fast_period', type: 'number', min: 8, max: 15, step: 1, default: 12, description: 'Fast EMA period' },
        { name: 'slow_period', type: 'number', min: 20, max: 35, step: 1, default: 26, description: 'Slow EMA period' },
        { name: 'signal_period', type: 'number', min: 5, max: 15, step: 1, default: 9, description: 'Signal line period' },
        { name: 'min_histogram', type: 'number', min: 0, max: 0.1, step: 0.01, default: 0.02, description: 'Minimum histogram for entry' },
        { name: 'stop_loss_atr', type: 'number', min: 1, max: 5, step: 0.5, default: 2, description: 'Stop loss in ATR units' }
      ],
      execute: this.executeMACDStrategy.bind(this)
    });

    // Bollinger Band Squeeze Strategy
    this.strategies.set('bb_squeeze', {
      id: 'bb_squeeze',
      name: 'Bollinger Band Squeeze',
      description: 'Trade volatility breakouts from Bollinger Band squeezes',
      category: 'volatility',
      riskLevel: 'high',
      timeframes: ['1h', '4h', '1d'],
      parameters: [
        { name: 'bb_period', type: 'number', min: 15, max: 25, step: 1, default: 20, description: 'Bollinger Band period' },
        { name: 'bb_deviation', type: 'number', min: 1.5, max: 2.5, step: 0.1, default: 2, description: 'Standard deviation multiplier' },
        { name: 'squeeze_threshold', type: 'number', min: 0.05, max: 0.2, step: 0.01, default: 0.1, description: 'Squeeze detection threshold' },
        { name: 'breakout_volume', type: 'number', min: 1.2, max: 3, step: 0.1, default: 1.5, description: 'Volume multiplication for breakout' },
        { name: 'profit_target', type: 'number', min: 2, max: 8, step: 0.5, default: 4, description: 'Profit target in band width units' }
      ],
      execute: this.executeBBSqueezeStrategy.bind(this)
    });

    // Multi-Timeframe Momentum Strategy
    this.strategies.set('mtf_momentum', {
      id: 'mtf_momentum',
      name: 'Multi-Timeframe Momentum',
      description: 'Combine momentum signals from multiple timeframes',
      category: 'momentum',
      riskLevel: 'medium',
      timeframes: ['15m', '1h', '4h'],
      parameters: [
        { name: 'momentum_period', type: 'number', min: 10, max: 30, step: 1, default: 20, description: 'Momentum calculation period' },
        { name: 'rsi_threshold', type: 'number', min: 45, max: 65, step: 1, default: 55, description: 'RSI momentum threshold' },
        { name: 'volume_factor', type: 'number', min: 1.1, max: 2.5, step: 0.1, default: 1.5, description: 'Required volume increase' },
        { name: 'trend_strength', type: 'number', min: 50, max: 90, step: 5, default: 70, description: 'Minimum trend strength' },
        { name: 'risk_reward', type: 'number', min: 1.5, max: 4, step: 0.5, default: 2.5, description: 'Risk-reward ratio' }
      ],
      execute: this.executeMomentumStrategy.bind(this)
    });
  }

  /**
   * Optimize strategy parameters using genetic algorithm approach
   */
  async optimizeStrategy(
    strategyId: string,
    historicalData: CandlestickData[],
    optimizationSettings: {
      generations: number;
      populationSize: number;
      objective: 'sharpe' | 'return' | 'profit_factor' | 'composite';
      timeframe: string;
    }
  ): Promise<OptimizationResult[]> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    if (historicalData.length < 100) {
      throw new Error('Insufficient historical data for optimization');
    }

    console.log(`Starting optimization for ${strategy.name}...`);

    // Generate initial population
    let population = this.generateInitialPopulation(strategy, optimizationSettings.populationSize);
    
    const results: OptimizationResult[] = [];

    for (let generation = 0; generation < optimizationSettings.generations; generation++) {
      console.log(`Generation ${generation + 1}/${optimizationSettings.generations}`);

      // Evaluate each individual in the population
      const evaluatedPopulation = await Promise.all(
        population.map(async (individual) => {
          const performance = await this.evaluateStrategy(strategy, individual, historicalData, optimizationSettings.timeframe);
          const score = this.calculateOptimizationScore(performance, optimizationSettings.objective);
          
          return {
            parameters: individual,
            performance,
            score
          };
        })
      );

      // Sort by score (higher is better)
      evaluatedPopulation.sort((a, b) => b.score - a.score);
      
      // Store best results
      results.push(...evaluatedPopulation.slice(0, 5));

      // Create next generation
      if (generation < optimizationSettings.generations - 1) {
        population = this.createNextGeneration(
          evaluatedPopulation.slice(0, Math.floor(optimizationSettings.populationSize * 0.3)),
          strategy,
          optimizationSettings.populationSize
        );
      }
    }

    // Return top unique results
    return this.getTopUniqueResults(results, 10);
  }

  /**
   * Run backtest for a specific strategy configuration
   */
  async backtestStrategy(
    strategyId: string,
    parameters: { [key: string]: any },
    historicalData: CandlestickData[],
    timeframe: string
  ): Promise<StrategyBacktest> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }

    const results = await this.runDetailedBacktest(strategy, parameters, historicalData, timeframe);
    
    return {
      strategy,
      parameters,
      results,
      timeframe,
      dateRange: {
        start: new Date(historicalData[0].timestamp).toISOString(),
        end: new Date(historicalData[historicalData.length - 1].timestamp).toISOString()
      }
    };
  }

  /**
   * Strategy execution methods
   */
  private executeRSIStrategy(data: CandlestickData[], indicators: AdvancedIndicators, params: any): StrategySignal {
    const { oversold_level, overbought_level, stop_loss_pct, take_profit_pct } = params;
    const currentPrice = data[data.length - 1].close;
    
    if (indicators.rsi.value < oversold_level && !indicators.rsi.oversold) {
      return {
        action: 'BUY',
        confidence: Math.max(50, 100 - indicators.rsi.value * 1.5),
        stopLoss: currentPrice * (1 - stop_loss_pct / 100),
        takeProfit: [currentPrice * (1 + take_profit_pct / 100)],
        reasoning: [`RSI oversold at ${indicators.rsi.value.toFixed(2)}`],
        risk: stop_loss_pct,
        reward: take_profit_pct
      };
    }
    
    if (indicators.rsi.value > overbought_level && !indicators.rsi.overbought) {
      return {
        action: 'SELL',
        confidence: Math.max(50, indicators.rsi.value * 1.2),
        stopLoss: currentPrice * (1 + stop_loss_pct / 100),
        takeProfit: [currentPrice * (1 - take_profit_pct / 100)],
        reasoning: [`RSI overbought at ${indicators.rsi.value.toFixed(2)}`],
        risk: stop_loss_pct,
        reward: take_profit_pct
      };
    }
    
    return {
      action: 'HOLD',
      confidence: 30,
      reasoning: ['RSI in neutral zone'],
      risk: 0,
      reward: 0
    };
  }

  private executeMACDStrategy(data: CandlestickData[], indicators: AdvancedIndicators, params: any): StrategySignal {
    const { min_histogram, stop_loss_atr } = params;
    const currentPrice = data[data.length - 1].close;
    
    if (indicators.macd.histogram > min_histogram && indicators.macd.value > indicators.macd.signal) {
      const stopLossDistance = indicators.atr * stop_loss_atr;
      return {
        action: 'BUY',
        confidence: Math.min(90, Math.abs(indicators.macd.histogram) * 1000),
        stopLoss: currentPrice - stopLossDistance,
        takeProfit: [currentPrice + stopLossDistance * 2, currentPrice + stopLossDistance * 3],
        reasoning: ['MACD bullish crossover', `Histogram: ${indicators.macd.histogram.toFixed(4)}`],
        risk: (stopLossDistance / currentPrice) * 100,
        reward: (stopLossDistance * 2 / currentPrice) * 100
      };
    }
    
    if (indicators.macd.histogram < -min_histogram && indicators.macd.value < indicators.macd.signal) {
      const stopLossDistance = indicators.atr * stop_loss_atr;
      return {
        action: 'SELL',
        confidence: Math.min(90, Math.abs(indicators.macd.histogram) * 1000),
        stopLoss: currentPrice + stopLossDistance,
        takeProfit: [currentPrice - stopLossDistance * 2, currentPrice - stopLossDistance * 3],
        reasoning: ['MACD bearish crossover', `Histogram: ${indicators.macd.histogram.toFixed(4)}`],
        risk: (stopLossDistance / currentPrice) * 100,
        reward: (stopLossDistance * 2 / currentPrice) * 100
      };
    }
    
    return {
      action: 'HOLD',
      confidence: 40,
      reasoning: ['MACD signals not clear'],
      risk: 0,
      reward: 0
    };
  }

  private executeBBSqueezeStrategy(data: CandlestickData[], indicators: AdvancedIndicators, params: any): StrategySignal {
    const { squeeze_threshold, breakout_volume, profit_target } = params;
    const currentPrice = data[data.length - 1].close;
    const currentVolume = data[data.length - 1].volume;
    const avgVolume = data.slice(-20).reduce((sum, d) => sum + d.volume, 0) / 20;
    
    const bandWidth = (indicators.bollinger.upper - indicators.bollinger.lower) / indicators.bollinger.middle;
    const isSqueezing = bandWidth < squeeze_threshold;
    const volumeBreakout = currentVolume > avgVolume * breakout_volume;
    
    if (isSqueezing && volumeBreakout) {
      const targetDistance = (indicators.bollinger.upper - indicators.bollinger.lower) * profit_target;
      
      if (currentPrice > indicators.bollinger.middle) {
        return {
          action: 'BUY',
          confidence: 80,
          stopLoss: indicators.bollinger.lower,
          takeProfit: [currentPrice + targetDistance],
          reasoning: ['Bollinger squeeze breakout upward', 'High volume confirmation'],
          risk: ((currentPrice - indicators.bollinger.lower) / currentPrice) * 100,
          reward: (targetDistance / currentPrice) * 100
        };
      } else {
        return {
          action: 'SELL',
          confidence: 80,
          stopLoss: indicators.bollinger.upper,
          takeProfit: [currentPrice - targetDistance],
          reasoning: ['Bollinger squeeze breakout downward', 'High volume confirmation'],
          risk: ((indicators.bollinger.upper - currentPrice) / currentPrice) * 100,
          reward: (targetDistance / currentPrice) * 100
        };
      }
    }
    
    return {
      action: 'HOLD',
      confidence: 25,
      reasoning: isSqueezing ? ['Squeeze detected, waiting for breakout'] : ['No squeeze pattern'],
      risk: 0,
      reward: 0
    };
  }

  private executeMomentumStrategy(data: CandlestickData[], indicators: AdvancedIndicators, params: any): StrategySignal {
    const { rsi_threshold, volume_factor, trend_strength, risk_reward } = params;
    const currentPrice = data[data.length - 1].close;
    const currentVolume = data[data.length - 1].volume;
    const avgVolume = data.slice(-20).reduce((sum, d) => sum + d.volume, 0) / 20;
    
    const volumeCondition = currentVolume > avgVolume * volume_factor;
    const trendCondition = indicators.trendStrength > trend_strength;
    const momentumCondition = Math.abs(indicators.momentum) > 0;
    
    if (volumeCondition && trendCondition && momentumCondition) {
      const riskAmount = currentPrice * 0.02; // 2% risk
      const rewardAmount = riskAmount * risk_reward;
      
      if (indicators.rsi.value > rsi_threshold && indicators.momentum > 0) {
        return {
          action: 'BUY',
          confidence: Math.min(95, indicators.trendStrength),
          stopLoss: currentPrice - riskAmount,
          takeProfit: [currentPrice + rewardAmount],
          reasoning: [
            'Strong upward momentum',
            `Trend strength: ${indicators.trendStrength}`,
            'Volume confirmation'
          ],
          risk: 2,
          reward: 2 * risk_reward
        };
      } else if (indicators.rsi.value < (100 - rsi_threshold) && indicators.momentum < 0) {
        return {
          action: 'SELL',
          confidence: Math.min(95, indicators.trendStrength),
          stopLoss: currentPrice + riskAmount,
          takeProfit: [currentPrice - rewardAmount],
          reasoning: [
            'Strong downward momentum',
            `Trend strength: ${indicators.trendStrength}`,
            'Volume confirmation'
          ],
          risk: 2,
          reward: 2 * risk_reward
        };
      }
    }
    
    return {
      action: 'HOLD',
      confidence: 30,
      reasoning: ['Momentum conditions not met'],
      risk: 0,
      reward: 0
    };
  }

  // Optimization helper methods
  private generateInitialPopulation(strategy: Strategy, populationSize: number): any[] {
    const population = [];
    
    for (let i = 0; i < populationSize; i++) {
      const individual: any = {};
      
      strategy.parameters.forEach(param => {
        if (param.type === 'number') {
          individual[param.name] = Math.random() * (param.max! - param.min!) + param.min!;
        } else if (param.type === 'boolean') {
          individual[param.name] = Math.random() > 0.5;
        } else {
          individual[param.name] = param.default;
        }
      });
      
      population.push(individual);
    }
    
    return population;
  }

  private async evaluateStrategy(
    strategy: Strategy,
    parameters: any,
    data: CandlestickData[],
    timeframe: string
  ): Promise<any> {
    // Mock evaluation - in production, run full backtest
    const returns = Math.random() * 0.4 - 0.1; // -10% to +30%
    const volatility = Math.random() * 0.3 + 0.1; // 10% to 40%
    const winRate = Math.random() * 0.4 + 0.4; // 40% to 80%
    const totalTrades = Math.floor(Math.random() * 50) + 10;
    
    return {
      totalReturn: returns,
      sharpeRatio: returns / volatility,
      maxDrawdown: Math.random() * 0.3,
      winRate,
      profitFactor: winRate / (1 - winRate) * 1.5,
      totalTrades
    };
  }

  private calculateOptimizationScore(performance: any, objective: string): number {
    switch (objective) {
      case 'sharpe':
        return performance.sharpeRatio * 100;
      case 'return':
        return performance.totalReturn * 100;
      case 'profit_factor':
        return performance.profitFactor * 20;
      case 'composite':
      default:
        return (
          performance.sharpeRatio * 30 +
          performance.totalReturn * 25 +
          performance.profitFactor * 20 +
          performance.winRate * 15 +
          (1 - performance.maxDrawdown) * 10
        );
    }
  }

  private createNextGeneration(
    topPerformers: OptimizationResult[],
    strategy: Strategy,
    populationSize: number
  ): any[] {
    const nextGeneration = [];
    
    // Keep top 20% as elites
    const eliteCount = Math.floor(populationSize * 0.2);
    topPerformers.slice(0, eliteCount).forEach(performer => {
      nextGeneration.push({ ...performer.parameters });
    });
    
    // Generate rest through crossover and mutation
    while (nextGeneration.length < populationSize) {
      const parent1 = this.selectParent(topPerformers);
      const parent2 = this.selectParent(topPerformers);
      const child = this.crossover(parent1.parameters, parent2.parameters, strategy);
      const mutatedChild = this.mutate(child, strategy);
      nextGeneration.push(mutatedChild);
    }
    
    return nextGeneration;
  }

  private selectParent(topPerformers: OptimizationResult[]): OptimizationResult {
    // Tournament selection
    const tournamentSize = 3;
    const tournament = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * topPerformers.length);
      tournament.push(topPerformers[randomIndex]);
    }
    
    return tournament.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  private crossover(parent1: any, parent2: any, strategy: Strategy): any {
    const child: any = {};
    
    strategy.parameters.forEach(param => {
      if (Math.random() > 0.5) {
        child[param.name] = parent1[param.name];
      } else {
        child[param.name] = parent2[param.name];
      }
    });
    
    return child;
  }

  private mutate(individual: any, strategy: Strategy): any {
    const mutated = { ...individual };
    const mutationRate = 0.1;
    
    strategy.parameters.forEach(param => {
      if (Math.random() < mutationRate) {
        if (param.type === 'number') {
          const range = param.max! - param.min!;
          const mutation = (Math.random() - 0.5) * range * 0.1;
          mutated[param.name] = Math.max(param.min!, Math.min(param.max!, mutated[param.name] + mutation));
        } else if (param.type === 'boolean') {
          mutated[param.name] = !mutated[param.name];
        }
      }
    });
    
    return mutated;
  }

  private getTopUniqueResults(results: OptimizationResult[], count: number): OptimizationResult[] {
    const sortedResults = results.sort((a, b) => b.score - a.score);
    const uniqueResults = [];
    const seen = new Set();
    
    for (const result of sortedResults) {
      const key = JSON.stringify(result.parameters);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push(result);
        if (uniqueResults.length >= count) break;
      }
    }
    
    return uniqueResults;
  }

  private async runDetailedBacktest(
    strategy: Strategy,
    parameters: any,
    data: CandlestickData[],
    timeframe: string
  ): Promise<BacktestResult> {
    // Mock detailed backtest - implement full simulation
    const trades = [];
    const totalReturn = Math.random() * 0.5 - 0.1;
    
    for (let i = 0; i < 20; i++) {
      const randomIndex = Math.floor(Math.random() * (data.length - 10)) + 5;
      const openTime = new Date(data[randomIndex].timestamp).toISOString();
      const closeTime = new Date(data[randomIndex + 5].timestamp).toISOString();
      const profit = Math.random() * 0.1 - 0.03;
      
      trades.push({
        pair: 'BTC/USDT',
        openTime,
        closeTime,
        openRate: data[randomIndex].close,
        closeRate: data[randomIndex + 5].close,
        profit: { percent: profit * 100 }
      });
    }
    
    return {
      summary: {
        totalProfitPercent: totalReturn * 100,
        winRatePercent: Math.random() * 40 + 40,
        totalTrades: trades.length,
        sharpeRatio: Math.random() * 2,
        maxDrawdown: Math.random() * 0.3,
        calmarRatio: Math.random() * 3,
        avgTradeTime: 4.5
      },
      trades
    };
  }

  /**
   * Get all available strategies
   */
  getAvailableStrategies(): Strategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get strategy by ID
   */
  getStrategy(id: string): Strategy | undefined {
    return this.strategies.get(id);
  }

  /**
   * Add custom strategy
   */
  addCustomStrategy(strategy: Strategy): void {
    this.strategies.set(strategy.id, strategy);
  }
}

export default StrategyOptimizationService;
