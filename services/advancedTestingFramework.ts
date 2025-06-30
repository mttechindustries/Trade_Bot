// Advanced Testing Framework for Trading Strategies
import { CandlestickData, Trade } from '../types';
import { Strategy, StrategySignal } from './strategyOptimizationService';
import EnhancedLoggingService from './enhancedLoggingService';

export interface WalkForwardResult {
  periods: WalkForwardPeriod[];
  overallPerformance: BacktestSummary;
  stabilityScore: number; // 0-100, measures consistency across periods
  adaptabilityScore: number; // 0-100, measures ability to adapt to changing markets
}

export interface WalkForwardPeriod {
  trainingStart: string;
  trainingEnd: string;
  testingStart: string;
  testingEnd: string;
  trainingPerformance: BacktestSummary;
  testingPerformance: BacktestSummary;
  parameterDrift: number; // How much parameters changed
}

export interface OutOfSampleResult {
  inSamplePerformance: BacktestSummary;
  outOfSamplePerformance: BacktestSummary;
  performanceDegradation: number; // % drop from in-sample to out-of-sample
  overfittingScore: number; // 0-100, higher indicates more overfitting
}

export interface MonteCarloResult {
  scenarios: MonteCarloScenario[];
  worstCase: BacktestSummary;
  bestCase: BacktestSummary;
  averageCase: BacktestSummary;
  confidenceIntervals: {
    '95%': { lower: number; upper: number };
    '90%': { lower: number; upper: number };
    '80%': { lower: number; upper: number };
  };
  probabilityOfLoss: number;
}

export interface MonteCarloScenario {
  scenario: number;
  marketCondition: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE';
  performance: BacktestSummary;
  maxDrawdown: number;
  recoveryTime: number; // Days to recover from max drawdown
}

export interface StressTestResult {
  scenarios: StressTestScenario[];
  worstCaseDrawdown: number;
  averageRecoveryTime: number;
  systemFailurePoints: string[];
  riskMetrics: {
    valueAtRisk95: number;
    conditionalValueAtRisk: number;
    tailRisk: number;
  };
}

export interface StressTestScenario {
  name: string;
  description: string;
  marketShock: number; // % market movement
  volatilityMultiplier: number;
  liquidityCrisis: boolean;
  performance: BacktestSummary;
  systemStability: 'STABLE' | 'DEGRADED' | 'FAILED';
}

export interface BacktestSummary {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  averageTradeReturn: number;
  volatility: number;
  calmarRatio: number;
  sortinoRatio: number;
}

class AdvancedTestingFramework {
  private static instance: AdvancedTestingFramework;
  private logger: EnhancedLoggingService;

  private constructor() {
    this.logger = EnhancedLoggingService.getInstance();
  }

  static getInstance(): AdvancedTestingFramework {
    if (!AdvancedTestingFramework.instance) {
      AdvancedTestingFramework.instance = new AdvancedTestingFramework();
    }
    return AdvancedTestingFramework.instance;
  }

  /**
   * Perform walk-forward analysis
   */
  async performWalkForwardAnalysis(
    strategy: Strategy,
    data: CandlestickData[],
    trainingWindowMonths: number = 6,
    testingWindowMonths: number = 1,
    stepMonths: number = 1
  ): Promise<WalkForwardResult> {
    this.logger.log('INFO', 'TESTING', 'Starting walk-forward analysis', {
      strategy: strategy.id,
      trainingWindow: trainingWindowMonths,
      testingWindow: testingWindowMonths
    });

    const periods: WalkForwardPeriod[] = [];
    const msPerMonth = 30 * 24 * 60 * 60 * 1000;
    
    let currentStart = 0;
    
    while (currentStart + (trainingWindowMonths + testingWindowMonths) * msPerMonth < data[data.length - 1].timestamp) {
      const trainingEnd = currentStart + trainingWindowMonths * msPerMonth;
      const testingEnd = trainingEnd + testingWindowMonths * msPerMonth;
      
      // Get data slices
      const trainingData = data.filter(d => d.timestamp >= currentStart && d.timestamp < trainingEnd);
      const testingData = data.filter(d => d.timestamp >= trainingEnd && d.timestamp < testingEnd);
      
      if (trainingData.length < 100 || testingData.length < 10) {
        currentStart += stepMonths * msPerMonth;
        continue;
      }

      // Optimize strategy on training data
      const optimizedParams = await this.optimizeStrategyParameters(strategy, trainingData);
      
      // Test on training data
      const trainingPerformance = await this.backtestStrategy(strategy, optimizedParams, trainingData);
      
      // Test on out-of-sample data
      const testingPerformance = await this.backtestStrategy(strategy, optimizedParams, testingData);
      
      periods.push({
        trainingStart: new Date(currentStart).toISOString(),
        trainingEnd: new Date(trainingEnd).toISOString(),
        testingStart: new Date(trainingEnd).toISOString(),
        testingEnd: new Date(testingEnd).toISOString(),
        trainingPerformance,
        testingPerformance,
        parameterDrift: this.calculateParameterDrift(strategy.parameters, optimizedParams)
      });
      
      currentStart += stepMonths * msPerMonth;
    }

    // Calculate overall metrics
    const overallPerformance = this.aggregatePerformance(periods.map(p => p.testingPerformance));
    const stabilityScore = this.calculateStabilityScore(periods);
    const adaptabilityScore = this.calculateAdaptabilityScore(periods);

    return {
      periods,
      overallPerformance,
      stabilityScore,
      adaptabilityScore
    };
  }

  /**
   * Perform out-of-sample testing
   */
  async performOutOfSampleTest(
    strategy: Strategy,
    data: CandlestickData[],
    inSampleRatio: number = 0.7
  ): Promise<OutOfSampleResult> {
    const splitIndex = Math.floor(data.length * inSampleRatio);
    const inSampleData = data.slice(0, splitIndex);
    const outOfSampleData = data.slice(splitIndex);

    this.logger.log('INFO', 'TESTING', 'Starting out-of-sample test', {
      strategy: strategy.id,
      inSampleSize: inSampleData.length,
      outOfSampleSize: outOfSampleData.length
    });

    // Optimize on in-sample data
    const optimizedParams = await this.optimizeStrategyParameters(strategy, inSampleData);
    
    // Test on both datasets
    const inSamplePerformance = await this.backtestStrategy(strategy, optimizedParams, inSampleData);
    const outOfSamplePerformance = await this.backtestStrategy(strategy, optimizedParams, outOfSampleData);
    
    const performanceDegradation = ((inSamplePerformance.totalReturn - outOfSamplePerformance.totalReturn) / 
                                   Math.abs(inSamplePerformance.totalReturn)) * 100;
    
    const overfittingScore = Math.max(0, Math.min(100, performanceDegradation));

    return {
      inSamplePerformance,
      outOfSamplePerformance,
      performanceDegradation,
      overfittingScore
    };
  }

  /**
   * Perform Monte Carlo simulation
   */
  async performMonteCarloSimulation(
    strategy: Strategy,
    baseData: CandlestickData[],
    scenarios: number = 1000,
    parameters?: any
  ): Promise<MonteCarloResult> {
    this.logger.log('INFO', 'TESTING', 'Starting Monte Carlo simulation', {
      strategy: strategy.id,
      scenarios
    });

    const results: MonteCarloScenario[] = [];
    
    for (let i = 0; i < scenarios; i++) {
      // Generate market scenario
      const scenarioData = this.generateMarketScenario(baseData, i);
      const marketCondition = this.classifyMarketCondition(scenarioData);
      
      // Run backtest
      const performance = await this.backtestStrategy(strategy, parameters, scenarioData);
      
      results.push({
        scenario: i,
        marketCondition,
        performance,
        maxDrawdown: performance.maxDrawdown,
        recoveryTime: this.calculateRecoveryTime(scenarioData, performance.maxDrawdown)
      });
      
      if (i % 100 === 0) {
        this.logger.log('INFO', 'TESTING', `Monte Carlo progress: ${i}/${scenarios}`);
      }
    }

    // Calculate statistics
    const returns = results.map(r => r.performance.totalReturn);
    returns.sort((a, b) => a - b);
    
    const worstCase = results.reduce((worst, current) => 
      current.performance.totalReturn < worst.performance.totalReturn ? current : worst
    ).performance;
    
    const bestCase = results.reduce((best, current) => 
      current.performance.totalReturn > best.performance.totalReturn ? current : best
    ).performance;
    
    const averageCase = this.aggregatePerformance(results.map(r => r.performance));
    
    const confidenceIntervals = {
      '95%': {
        lower: returns[Math.floor(returns.length * 0.025)],
        upper: returns[Math.floor(returns.length * 0.975)]
      },
      '90%': {
        lower: returns[Math.floor(returns.length * 0.05)],
        upper: returns[Math.floor(returns.length * 0.95)]
      },
      '80%': {
        lower: returns[Math.floor(returns.length * 0.1)],
        upper: returns[Math.floor(returns.length * 0.9)]
      }
    };
    
    const probabilityOfLoss = returns.filter(r => r < 0).length / returns.length;

    return {
      scenarios: results,
      worstCase,
      bestCase,
      averageCase,
      confidenceIntervals,
      probabilityOfLoss
    };
  }

  /**
   * Perform stress testing
   */
  async performStressTest(
    strategy: Strategy,
    baseData: CandlestickData[],
    parameters?: any
  ): Promise<StressTestResult> {
    this.logger.log('INFO', 'TESTING', 'Starting stress test', {
      strategy: strategy.id
    });

    const stressScenarios: StressTestScenario[] = [];
    
    // Define stress test scenarios
    const scenarios = [
      { name: '2008 Financial Crisis', marketShock: -50, volatilityMultiplier: 3, liquidityCrisis: true },
      { name: '2020 COVID Crash', marketShock: -35, volatilityMultiplier: 4, liquidityCrisis: false },
      { name: 'Flash Crash', marketShock: -20, volatilityMultiplier: 10, liquidityCrisis: true },
      { name: 'Extended Bear Market', marketShock: -60, volatilityMultiplier: 2, liquidityCrisis: false },
      { name: 'High Inflation Period', marketShock: 0, volatilityMultiplier: 2.5, liquidityCrisis: false },
      { name: 'Currency Crisis', marketShock: -25, volatilityMultiplier: 5, liquidityCrisis: true }
    ];

    for (const scenario of scenarios) {
      const stressedData = this.applyStressScenario(baseData, scenario);
      const performance = await this.backtestStrategy(strategy, parameters, stressedData);
      
      // Determine system stability
      let systemStability: 'STABLE' | 'DEGRADED' | 'FAILED' = 'STABLE';
      if (performance.maxDrawdown > 50) {
        systemStability = 'FAILED';
      } else if (performance.maxDrawdown > 25) {
        systemStability = 'DEGRADED';
      }

      stressScenarios.push({
        name: scenario.name,
        description: `Market shock: ${scenario.marketShock}%, Volatility: ${scenario.volatilityMultiplier}x`,
        marketShock: scenario.marketShock,
        volatilityMultiplier: scenario.volatilityMultiplier,
        liquidityCrisis: scenario.liquidityCrisis,
        performance,
        systemStability
      });
    }

    // Calculate risk metrics
    const worstCaseDrawdown = Math.max(...stressScenarios.map(s => s.performance.maxDrawdown));
    const averageRecoveryTime = stressScenarios.reduce((sum, s) => 
      sum + this.calculateRecoveryTime(baseData, s.performance.maxDrawdown), 0) / stressScenarios.length;
    
    const systemFailurePoints = stressScenarios
      .filter(s => s.systemStability === 'FAILED')
      .map(s => s.name);

    const returns = stressScenarios.map(s => s.performance.totalReturn);
    returns.sort((a, b) => a - b);
    
    const valueAtRisk95 = returns[Math.floor(returns.length * 0.05)];
    const conditionalValueAtRisk = returns.slice(0, Math.floor(returns.length * 0.05))
      .reduce((sum, r) => sum + r, 0) / Math.floor(returns.length * 0.05);

    return {
      scenarios: stressScenarios,
      worstCaseDrawdown,
      averageRecoveryTime,
      systemFailurePoints,
      riskMetrics: {
        valueAtRisk95,
        conditionalValueAtRisk,
        tailRisk: Math.abs(conditionalValueAtRisk - valueAtRisk95)
      }
    };
  }

  // Private helper methods
  private async optimizeStrategyParameters(strategy: Strategy, data: CandlestickData[]): Promise<any> {
    // Mock optimization - in production, use genetic algorithm or grid search
    const optimized: any = {};
    strategy.parameters.forEach(param => {
      if (param.type === 'number') {
        optimized[param.name] = param.min! + Math.random() * (param.max! - param.min!);
      } else if (param.type === 'boolean') {
        optimized[param.name] = Math.random() > 0.5;
      } else {
        optimized[param.name] = param.default;
      }
    });
    return optimized;
  }

  private async backtestStrategy(strategy: Strategy, parameters: any, data: CandlestickData[]): Promise<BacktestSummary> {
    // Mock backtest - implement full simulation
    const totalReturn = Math.random() * 0.6 - 0.1; // -10% to +50%
    const volatility = Math.random() * 0.3 + 0.1; // 10% to 40%
    const winRate = Math.random() * 0.4 + 0.4; // 40% to 80%
    const maxDrawdown = Math.random() * 0.3; // 0% to 30%
    const totalTrades = Math.floor(Math.random() * 100) + 20;

    return {
      totalReturn,
      sharpeRatio: totalReturn / volatility,
      maxDrawdown,
      winRate,
      profitFactor: winRate / (1 - winRate) * 1.5,
      totalTrades,
      averageTradeReturn: totalReturn / totalTrades,
      volatility,
      calmarRatio: totalReturn / maxDrawdown,
      sortinoRatio: totalReturn / (volatility * 0.7) // Simplified Sortino
    };
  }

  private calculateParameterDrift(originalParams: any[], optimizedParams: any): number {
    // Calculate how much parameters changed (normalized)
    return Math.random() * 0.3; // Mock 0-30% drift
  }

  private aggregatePerformance(performances: BacktestSummary[]): BacktestSummary {
    return {
      totalReturn: performances.reduce((sum, p) => sum + p.totalReturn, 0) / performances.length,
      sharpeRatio: performances.reduce((sum, p) => sum + p.sharpeRatio, 0) / performances.length,
      maxDrawdown: Math.max(...performances.map(p => p.maxDrawdown)),
      winRate: performances.reduce((sum, p) => sum + p.winRate, 0) / performances.length,
      profitFactor: performances.reduce((sum, p) => sum + p.profitFactor, 0) / performances.length,
      totalTrades: performances.reduce((sum, p) => sum + p.totalTrades, 0),
      averageTradeReturn: performances.reduce((sum, p) => sum + p.averageTradeReturn, 0) / performances.length,
      volatility: performances.reduce((sum, p) => sum + p.volatility, 0) / performances.length,
      calmarRatio: performances.reduce((sum, p) => sum + p.calmarRatio, 0) / performances.length,
      sortinoRatio: performances.reduce((sum, p) => sum + p.sortinoRatio, 0) / performances.length
    };
  }

  private calculateStabilityScore(periods: WalkForwardPeriod[]): number {
    const returns = periods.map(p => p.testingPerformance.totalReturn);
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower volatility = higher stability
    return Math.max(0, 100 - (standardDeviation * 100));
  }

  private calculateAdaptabilityScore(periods: WalkForwardPeriod[]): number {
    // Score based on how well the strategy adapts to changing market conditions
    const adaptationSuccess = periods.filter(p => 
      p.testingPerformance.totalReturn > p.trainingPerformance.totalReturn * 0.8
    ).length;
    
    return (adaptationSuccess / periods.length) * 100;
  }

  private generateMarketScenario(baseData: CandlestickData[], seed: number): CandlestickData[] {
    // Generate synthetic market data based on base data with random variations
    return baseData.map(candle => ({
      ...candle,
      open: candle.open * (1 + (Math.random() - 0.5) * 0.02),
      high: candle.high * (1 + (Math.random() - 0.5) * 0.02),
      low: candle.low * (1 + (Math.random() - 0.5) * 0.02),
      close: candle.close * (1 + (Math.random() - 0.5) * 0.02),
      volume: candle.volume * (0.5 + Math.random())
    }));
  }

  private classifyMarketCondition(data: CandlestickData[]): 'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE' {
    const returns = data.slice(1).map((candle, i) => 
      (candle.close - data[i].close) / data[i].close
    );
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    
    if (volatility > 0.03) return 'VOLATILE';
    if (avgReturn > 0.001) return 'BULL';
    if (avgReturn < -0.001) return 'BEAR';
    return 'SIDEWAYS';
  }

  private calculateRecoveryTime(data: CandlestickData[], maxDrawdown: number): number {
    // Mock recovery time calculation
    return Math.random() * 30 + 5; // 5-35 days
  }

  private applyStressScenario(baseData: CandlestickData[], scenario: any): CandlestickData[] {
    const shockFactor = 1 + (scenario.marketShock / 100);
    const volatilityMultiplier = scenario.volatilityMultiplier;
    
    return baseData.map((candle, i) => ({
      ...candle,
      open: candle.open * shockFactor * (1 + (Math.random() - 0.5) * 0.01 * volatilityMultiplier),
      high: candle.high * shockFactor * (1 + (Math.random() - 0.5) * 0.01 * volatilityMultiplier),
      low: candle.low * shockFactor * (1 + (Math.random() - 0.5) * 0.01 * volatilityMultiplier),
      close: candle.close * shockFactor * (1 + (Math.random() - 0.5) * 0.01 * volatilityMultiplier),
      volume: scenario.liquidityCrisis ? candle.volume * 0.3 : candle.volume
    }));
  }
}

export default AdvancedTestingFramework;
