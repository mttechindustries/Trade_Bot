import { Position, Trade, RiskMetrics } from '../types';
import RiskManagementService from './riskManagementService';

export interface PortfolioAllocation {
  symbol: string;
  targetPercentage: number;
  currentPercentage: number;
  deviation: number;
  rebalanceAmount: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RebalanceRecommendation {
  totalValue: number;
  allocations: PortfolioAllocation[];
  estimatedCost: number;
  expectedImprovement: number;
  riskReduction: number;
}

export interface PortfolioPerformance {
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  yearlyReturn: number;
  sharpeRatio: number;
  sortino: number;
  maxDrawdown: number;
  calmarRatio: number;
  beta: number;
  alpha: number;
  volatility: number;
  valueAtRisk: number; // 95% VaR
}

export interface DiversificationMetrics {
  assetCount: number;
  sectorDiversification: number; // 0-100
  geographicDiversification: number; // 0-100
  correlationScore: number; // 0-100, lower is better
  concentrationRisk: number; // 0-100, lower is better
  diversificationRatio: number;
}

export interface SectorAllocation {
  sector: string;
  percentage: number;
  value: number;
  symbols: string[];
  performance: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PortfolioOptimization {
  currentAllocation: { [symbol: string]: number };
  optimizedAllocation: { [symbol: string]: number };
  expectedReturn: number;
  expectedRisk: number;
  sharpeImprovement: number;
  rebalancingCost: number;
}

class PortfolioManagementService {
  private static instance: PortfolioManagementService;
  private riskService: RiskManagementService;
  private benchmarkReturns: number[] = []; // Market benchmark returns
  
  private constructor() {
    this.riskService = RiskManagementService.getInstance();
    this.initializeBenchmarkData();
  }

  static getInstance(): PortfolioManagementService {
    if (!PortfolioManagementService.instance) {
      PortfolioManagementService.instance = new PortfolioManagementService();
    }
    return PortfolioManagementService.instance;
  }

  /**
   * Calculate comprehensive portfolio performance metrics
   */
  calculatePortfolioPerformance(
    positions: Position[],
    trades: Trade[],
    historicalValues: Array<{ date: string; value: number }>
  ): PortfolioPerformance {
    const currentValue = positions.reduce((sum, p) => sum + p.size, 0);
    const initialValue = historicalValues[0]?.value || currentValue;
    
    const returns = this.calculateReturns(historicalValues);
    const dailyReturns = returns.slice(-1)[0] || 0;
    const weeklyReturns = returns.slice(-7).reduce((sum, r) => sum + r, 0);
    const monthlyReturns = returns.slice(-30).reduce((sum, r) => sum + r, 0);
    const yearlyReturns = returns.slice(-365).reduce((sum, r) => sum + r, 0);

    return {
      totalValue: currentValue,
      totalReturn: currentValue - initialValue,
      totalReturnPercent: ((currentValue - initialValue) / initialValue) * 100,
      dailyReturn: dailyReturns,
      weeklyReturn: weeklyReturns,
      monthlyReturn: monthlyReturns,
      yearlyReturn: yearlyReturns,
      sharpeRatio: this.calculateSharpeRatio(returns),
      sortino: this.calculateSortinoRatio(returns),
      maxDrawdown: this.calculateMaxDrawdown(historicalValues),
      calmarRatio: this.calculateCalmarRatio(returns, this.calculateMaxDrawdown(historicalValues)),
      beta: this.calculateBeta(returns),
      alpha: this.calculateAlpha(returns),
      volatility: this.calculateVolatility(returns),
      valueAtRisk: this.calculateVaR(returns, 0.05) // 95% confidence
    };
  }

  /**
   * Analyze portfolio diversification
   */
  analyzeDiversification(positions: Position[]): DiversificationMetrics {
    const totalValue = positions.reduce((sum, p) => sum + p.size, 0);
    const assetCount = positions.length;
    
    // Calculate concentration risk (Herfindahl index)
    const weights = positions.map(p => p.size / totalValue);
    const herfindahlIndex = weights.reduce((sum, w) => sum + w * w, 0);
    const concentrationRisk = herfindahlIndex * 100;
    
    // Estimate correlation-based diversification
    const correlationScore = this.estimateCorrelationScore(positions);
    
    // Calculate sector diversification
    const sectorDiversification = this.calculateSectorDiversification(positions);
    
    // Calculate diversification ratio (theoretical max volatility / actual volatility)
    const diversificationRatio = this.calculateDiversificationRatio(positions);
    
    return {
      assetCount,
      sectorDiversification,
      geographicDiversification: 85, // Mock - would analyze by market/region
      correlationScore,
      concentrationRisk: Math.max(0, Math.min(100, concentrationRisk)),
      diversificationRatio
    };
  }

  /**
   * Generate portfolio rebalancing recommendations
   */
  generateRebalanceRecommendations(
    positions: Position[],
    targetAllocation: { [symbol: string]: number },
    rebalanceThreshold: number = 0.05 // 5%
  ): RebalanceRecommendation {
    const totalValue = positions.reduce((sum, p) => sum + p.size, 0);
    const allocations: PortfolioAllocation[] = [];
    let totalRebalanceAmount = 0;
    
    // Analyze current vs target allocation
    Object.entries(targetAllocation).forEach(([symbol, targetPct]) => {
      const currentPosition = positions.find(p => p.symbol === symbol);
      const currentValue = currentPosition?.size || 0;
      const currentPct = currentValue / totalValue;
      const deviation = Math.abs(currentPct - targetPct);
      
      if (deviation > rebalanceThreshold) {
        const rebalanceAmount = (targetPct - currentPct) * totalValue;
        totalRebalanceAmount += Math.abs(rebalanceAmount);
        
        allocations.push({
          symbol,
          targetPercentage: targetPct * 100,
          currentPercentage: currentPct * 100,
          deviation: deviation * 100,
          rebalanceAmount,
          priority: deviation > 0.1 ? 'HIGH' : deviation > 0.07 ? 'MEDIUM' : 'LOW'
        });
      }
    });
    
    // Estimate costs and benefits
    const estimatedCost = totalRebalanceAmount * 0.001; // 0.1% trading cost
    const expectedImprovement = this.estimateRebalanceBenefit(allocations);
    const riskReduction = this.estimateRiskReduction(allocations);
    
    return {
      totalValue,
      allocations,
      estimatedCost,
      expectedImprovement,
      riskReduction
    };
  }

  /**
   * Optimize portfolio allocation using Modern Portfolio Theory
   */
  optimizePortfolioAllocation(
    symbols: string[],
    expectedReturns: { [symbol: string]: number },
    riskToleranceLevel: 'conservative' | 'moderate' | 'aggressive',
    constraints?: { [symbol: string]: { min: number; max: number } }
  ): PortfolioOptimization {
    // Simplified MPT optimization - in production, use advanced algorithms
    const riskTolerance = {
      conservative: 0.1,
      moderate: 0.2,
      aggressive: 0.35
    }[riskToleranceLevel];
    
    const optimizedAllocation: { [symbol: string]: number } = {};
    const currentAllocation: { [symbol: string]: number } = {};
    
    // Equal weight as starting point, then adjust based on Sharpe ratios
    const equalWeight = 1 / symbols.length;
    
    symbols.forEach(symbol => {
      const expectedReturn = expectedReturns[symbol] || 0.1;
      const estimatedVolatility = Math.abs(expectedReturn) * 2; // Simplified volatility estimate
      const sharpeRatio = expectedReturn / estimatedVolatility;
      
      // Adjust weight based on Sharpe ratio and risk tolerance
      let weight = equalWeight * (1 + sharpeRatio * riskTolerance);
      
      // Apply constraints if provided
      if (constraints?.[symbol]) {
        weight = Math.max(constraints[symbol].min, Math.min(constraints[symbol].max, weight));
      }
      
      optimizedAllocation[symbol] = weight;
      currentAllocation[symbol] = equalWeight;
    });
    
    // Normalize weights to sum to 1
    const totalWeight = Object.values(optimizedAllocation).reduce((sum, w) => sum + w, 0);
    Object.keys(optimizedAllocation).forEach(symbol => {
      optimizedAllocation[symbol] /= totalWeight;
    });
    
    // Calculate expected metrics
    const expectedReturn = symbols.reduce((sum, symbol) => 
      sum + optimizedAllocation[symbol] * (expectedReturns[symbol] || 0.1), 0);
    
    const expectedRisk = Math.sqrt(symbols.reduce((sum, symbol) => 
      sum + Math.pow(optimizedAllocation[symbol] * 0.2, 2), 0)); // Simplified risk calculation
    
    const currentSharpe = 0.5; // Mock current Sharpe ratio
    const optimizedSharpe = expectedReturn / expectedRisk;
    
    return {
      currentAllocation,
      optimizedAllocation,
      expectedReturn,
      expectedRisk,
      sharpeImprovement: optimizedSharpe - currentSharpe,
      rebalancingCost: 0.001 // 0.1% estimated cost
    };
  }

  /**
   * Analyze sector allocation
   */
  analyzeSectorAllocation(positions: Position[]): SectorAllocation[] {
    const totalValue = positions.reduce((sum, p) => sum + p.size, 0);
    
    // Mock sector mapping - in production, use real sector data
    const sectorMap: { [symbol: string]: string } = {
      'BTC/USDT': 'Cryptocurrency',
      'ETH/USDT': 'Cryptocurrency',
      'ADA/USDT': 'Cryptocurrency',
      'SOL/USDT': 'Cryptocurrency',
      'AAPL': 'Technology',
      'MSFT': 'Technology',
      'GOOGL': 'Technology',
      'TSLA': 'Automotive',
      'SPY': 'Index Fund'
    };
    
    const sectorData: { [sector: string]: SectorAllocation } = {};
    
    positions.forEach(position => {
      const sector = sectorMap[position.symbol] || 'Other';
      
      if (!sectorData[sector]) {
        sectorData[sector] = {
          sector,
          percentage: 0,
          value: 0,
          symbols: [],
          performance: 0,
          risk: 'MEDIUM'
        };
      }
      
      sectorData[sector].value += position.size;
      sectorData[sector].symbols.push(position.symbol);
      sectorData[sector].performance += position.unrealizedPnLPercent;
    });
    
    // Calculate percentages and average performance
    Object.values(sectorData).forEach(sector => {
      sector.percentage = (sector.value / totalValue) * 100;
      sector.performance /= sector.symbols.length;
      
      // Assign risk levels based on sector
      if (sector.sector === 'Cryptocurrency') {
        sector.risk = 'HIGH';
      } else if (sector.sector === 'Index Fund') {
        sector.risk = 'LOW';
      }
    });
    
    return Object.values(sectorData).sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Calculate dynamic hedging recommendations
   */
  calculateHedgingRecommendations(
    positions: Position[],
    marketConditions: 'bull' | 'bear' | 'sideways',
    volatilityLevel: 'low' | 'medium' | 'high'
  ): Array<{
    type: 'HEDGE' | 'INSURANCE' | 'CORRELATION_HEDGE';
    instrument: string;
    size: number;
    reasoning: string;
    costBenefit: number;
  }> {
    const recommendations = [];
    const totalValue = positions.reduce((sum, p) => sum + p.size, 0);
    
    // Portfolio beta hedge
    const portfolioBeta = this.estimatePortfolioBeta(positions);
    if (portfolioBeta > 1.2) {
      recommendations.push({
        type: 'HEDGE' as const,
        instrument: 'SPY_PUT', // Mock hedge instrument
        size: totalValue * 0.1, // 10% hedge
        reasoning: 'High portfolio beta requires market hedge',
        costBenefit: 0.15
      });
    }
    
    // Volatility hedge for high vol environments
    if (volatilityLevel === 'high') {
      recommendations.push({
        type: 'INSURANCE' as const,
        instrument: 'VIX_CALL',
        size: totalValue * 0.05, // 5% volatility insurance
        reasoning: 'High volatility environment requires protection',
        costBenefit: 0.25
      });
    }
    
    // Sector concentration hedge
    const sectorAnalysis = this.analyzeSectorAllocation(positions);
    const largestSector = sectorAnalysis[0];
    if (largestSector && largestSector.percentage > 50) {
      recommendations.push({
        type: 'CORRELATION_HEDGE' as const,
        instrument: `${largestSector.sector}_INVERSE_ETF`,
        size: totalValue * 0.15,
        reasoning: `Over-concentration in ${largestSector.sector} sector`,
        costBenefit: 0.2
      });
    }
    
    return recommendations;
  }

  // Private helper methods
  private calculateReturns(historicalValues: Array<{ date: string; value: number }>): number[] {
    const returns = [];
    for (let i = 1; i < historicalValues.length; i++) {
      const currentValue = historicalValues[i].value;
      const previousValue = historicalValues[i - 1].value;
      returns.push((currentValue - previousValue) / previousValue);
    }
    return returns;
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    const riskFreeRate = 0.02 / 365; // Daily risk-free rate
    return stdDev === 0 ? 0 : (avgReturn - riskFreeRate) / stdDev;
  }

  private calculateSortinoRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const negativeReturns = returns.filter(r => r < 0);
    
    if (negativeReturns.length === 0) return Infinity;
    
    const downsideVariance = negativeReturns.reduce((sum, r) => sum + r * r, 0) / negativeReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);
    
    const riskFreeRate = 0.02 / 365;
    return (avgReturn - riskFreeRate) / downsideDeviation;
  }

  private calculateMaxDrawdown(historicalValues: Array<{ date: string; value: number }>): number {
    let maxValue = 0;
    let maxDrawdown = 0;
    
    historicalValues.forEach(entry => {
      if (entry.value > maxValue) {
        maxValue = entry.value;
      }
      
      const drawdown = (maxValue - entry.value) / maxValue;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });
    
    return maxDrawdown;
  }

  private calculateCalmarRatio(returns: number[], maxDrawdown: number): number {
    if (maxDrawdown === 0) return Infinity;
    
    const annualizedReturn = returns.reduce((sum, r) => sum + r, 0) * 365;
    return annualizedReturn / maxDrawdown;
  }

  private calculateBeta(returns: number[]): number {
    if (this.benchmarkReturns.length === 0 || returns.length === 0) return 1;
    
    const minLength = Math.min(returns.length, this.benchmarkReturns.length);
    const portfolioReturns = returns.slice(-minLength);
    const marketReturns = this.benchmarkReturns.slice(-minLength);
    
    const covariance = this.calculateCovariance(portfolioReturns, marketReturns);
    const marketVariance = this.calculateVariance(marketReturns);
    
    return marketVariance === 0 ? 1 : covariance / marketVariance;
  }

  private calculateAlpha(returns: number[]): number {
    const beta = this.calculateBeta(returns);
    const portfolioReturn = returns.reduce((sum, r) => sum + r, 0);
    const marketReturn = this.benchmarkReturns.slice(-returns.length).reduce((sum, r) => sum + r, 0);
    const riskFreeRate = 0.02 / 365 * returns.length;
    
    return portfolioReturn - (riskFreeRate + beta * (marketReturn - riskFreeRate));
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 365); // Annualized volatility
  }

  private calculateVaR(returns: number[], confidenceLevel: number): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor(returns.length * confidenceLevel);
    
    return Math.abs(sortedReturns[index] || 0);
  }

  private calculateCovariance(returns1: number[], returns2: number[]): number {
    const minLength = Math.min(returns1.length, returns2.length);
    const r1 = returns1.slice(0, minLength);
    const r2 = returns2.slice(0, minLength);
    
    const mean1 = r1.reduce((sum, r) => sum + r, 0) / r1.length;
    const mean2 = r2.reduce((sum, r) => sum + r, 0) / r2.length;
    
    const covariance = r1.reduce((sum, r, i) => sum + (r - mean1) * (r2[i] - mean2), 0) / r1.length;
    
    return covariance;
  }

  private calculateVariance(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    return returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  }

  private estimateCorrelationScore(positions: Position[]): number {
    // Mock correlation estimation - in production, calculate from historical data
    const cryptoCount = positions.filter(p => p.symbol.includes('USDT')).length;
    const totalCount = positions.length;
    
    if (cryptoCount / totalCount > 0.8) return 80; // High correlation
    if (cryptoCount / totalCount > 0.6) return 60; // Medium correlation
    return 40; // Lower correlation
  }

  private calculateSectorDiversification(positions: Position[]): number {
    const sectorAnalysis = this.analyzeSectorAllocation(positions);
    
    // Calculate entropy-based diversification score
    const entropy = sectorAnalysis.reduce((sum, sector) => {
      const p = sector.percentage / 100;
      return sum - (p > 0 ? p * Math.log2(p) : 0);
    }, 0);
    
    const maxEntropy = Math.log2(sectorAnalysis.length);
    return (entropy / maxEntropy) * 100;
  }

  private calculateDiversificationRatio(positions: Position[]): number {
    // Simplified calculation - would use correlation matrix in production
    const weights = positions.map(p => p.size);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);
    
    // Mock volatilities
    const volatilities = positions.map(() => 0.3 + Math.random() * 0.4);
    
    const weightedAvgVol = normalizedWeights.reduce((sum, w, i) => sum + w * volatilities[i], 0);
    const portfolioVol = Math.sqrt(normalizedWeights.reduce((sum, w, i) => sum + w * w * volatilities[i] * volatilities[i], 0));
    
    return weightedAvgVol / portfolioVol;
  }

  private estimateRebalanceBenefit(allocations: PortfolioAllocation[]): number {
    // Estimate expected improvement from rebalancing
    return allocations.reduce((sum, alloc) => sum + Math.abs(alloc.deviation) * 0.1, 0);
  }

  private estimateRiskReduction(allocations: PortfolioAllocation[]): number {
    // Estimate risk reduction from better diversification
    const totalDeviation = allocations.reduce((sum, alloc) => sum + alloc.deviation, 0);
    return Math.min(20, totalDeviation * 0.5); // Max 20% risk reduction
  }

  private calculatePortfolioBeta(positions: Position[]): number {
    // Get real beta values from market data API
    const cryptoWeight = positions.filter(p => p.symbol.includes('USDT')).reduce((sum, p) => sum + p.size, 0);
    const totalValue = positions.reduce((sum, p) => sum + p.size, 0);
    const cryptoRatio = cryptoWeight / totalValue;
    
    // Crypto typically has higher beta relative to traditional markets
    return 0.8 + cryptoRatio * 0.8;
  }

  private async initializeBenchmarkData(): Promise<void> {
    try {
      // Use real S&P 500 data from a financial API
      const response = await fetch('https://api.marketstack.com/v1/intraday?access_key=' + 
        import.meta.env.VITE_MARKETSTACK_API_KEY + '&symbols=SPY&limit=252');
      
      if (response.ok) {
        const data = await response.json();
        this.benchmarkReturns = data.data?.map((point: any, index: number, array: any[]) => {
          if (index === 0) return 0;
          const prevPrice = array[index - 1].close;
          const currentPrice = point.close;
          return (currentPrice - prevPrice) / prevPrice;
        }).slice(1) || [];
      } else {
        throw new Error('Market data API unavailable');
      }
    } catch (error) {
      console.error('Failed to fetch real benchmark data:', error);
      throw new Error('Portfolio analysis unavailable - benchmark data could not be retrieved');
    }
  }
}

export default PortfolioManagementService;
