import { Trade, Position, TradingConfig } from '../types';

export interface RiskMetrics {
  portfolioValue: number;
  totalExposure: number;
  availableMargin: number;
  usedMargin: number;
  unrealizedPnL: number;
  dailyPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  riskScore: number; // 0-100
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface PositionSizing {
  recommendedSize: number;
  maxSize: number;
  riskAmount: number;
  riskPercentage: number;
  leverage: number;
  reasoning: string[];
}

export interface RiskLimits {
  maxPositionSize: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  maxLeverage: number;
  maxCorrelation: number;
  maxPositionsPerSymbol: number;
  maxTotalPositions: number;
  stopLossPercentage: number;
  takeProfitRatio: number;
}

export interface CorrelationAnalysis {
  symbol1: string;
  symbol2: string;
  correlation: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DrawdownAnalysis {
  currentDrawdown: number;
  maxDrawdown: number;
  drawdownDuration: number;
  recoveryTime: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

class RiskManagementService {
  private static instance: RiskManagementService;
  private riskLimits: RiskLimits;
  private portfolioHistory: Array<{ timestamp: number; value: number; pnl: number }> = [];

  private constructor() {
    this.riskLimits = {
      maxPositionSize: 0.1, // 10% of portfolio per position
      maxDailyLoss: 0.05, // 5% maximum daily loss
      maxDrawdown: 0.2, // 20% maximum drawdown
      maxLeverage: 3, // 3x maximum leverage
      maxCorrelation: 0.7, // Maximum 70% correlation between positions
      maxPositionsPerSymbol: 2,
      maxTotalPositions: 10,
      stopLossPercentage: 0.02, // 2% stop loss
      takeProfitRatio: 2.5 // 2.5:1 reward to risk ratio
    };
  }

  static getInstance(): RiskManagementService {
    if (!RiskManagementService.instance) {
      RiskManagementService.instance = new RiskManagementService();
    }
    return RiskManagementService.instance;
  }

  /**
   * Calculate position size based on risk management rules
   */
  calculatePositionSize(
    symbol: string,
    entryPrice: number,
    stopLoss: number,
    portfolioValue: number,
    riskPercentage: number = 0.02
  ): PositionSizing {
    const riskAmount = portfolioValue * riskPercentage;
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    const maxShares = portfolioValue * this.riskLimits.maxPositionSize / entryPrice;
    
    let recommendedShares = riskAmount / riskPerShare;
    recommendedShares = Math.min(recommendedShares, maxShares);
    
    const recommendedSize = recommendedShares * entryPrice;
    const actualRiskPercentage = (recommendedShares * riskPerShare) / portfolioValue;
    
    const reasoning = [];
    if (recommendedShares === maxShares) {
      reasoning.push('Position size limited by maximum position size rule');
    }
    if (actualRiskPercentage > riskPercentage) {
      reasoning.push('Risk percentage adjusted to meet limits');
    }
    
    return {
      recommendedSize,
      maxSize: maxShares * entryPrice,
      riskAmount: recommendedShares * riskPerShare,
      riskPercentage: actualRiskPercentage,
      leverage: 1, // Default leverage, can be adjusted
      reasoning
    };
  }

  /**
   * Evaluate if a new trade meets risk management criteria
   */
  evaluateTradeRisk(
    newTrade: Partial<Trade>,
    currentPositions: Position[],
    portfolioValue: number
  ): {
    approved: boolean;
    riskScore: number;
    warnings: string[];
    requirements: string[];
  } {
    const warnings: string[] = [];
    const requirements: string[] = [];
    let riskScore = 0;

    // Check position concentration
    const symbolExposure = currentPositions
      .filter(p => p.symbol === newTrade.pair)
      .reduce((sum, p) => sum + p.size, 0);
    
    const newExposure = (symbolExposure + (newTrade.stakeAmount || 0)) / portfolioValue;
    if (newExposure > this.riskLimits.maxPositionSize) {
      warnings.push(`Symbol exposure exceeds ${this.riskLimits.maxPositionSize * 100}% limit`);
      riskScore += 30;
    }

    // Check total positions
    if (currentPositions.length >= this.riskLimits.maxTotalPositions) {
      warnings.push('Maximum number of positions reached');
      riskScore += 20;
    }

    // Check correlation risk
    const correlationRisk = this.analyzeCorrelationRisk(newTrade.pair!, currentPositions);
    if (correlationRisk.length > 0) {
      warnings.push(`High correlation detected with existing positions`);
      riskScore += 25;
    }

    // Check stop loss
    if (newTrade.stopLoss && newTrade.openRate) {
      const stopLossDistance = Math.abs(newTrade.openRate - newTrade.stopLoss) / newTrade.openRate;
      if (stopLossDistance > this.riskLimits.stopLossPercentage * 3) {
        warnings.push('Stop loss is too wide');
        riskScore += 15;
      }
      if (stopLossDistance < this.riskLimits.stopLossPercentage * 0.5) {
        warnings.push('Stop loss may be too tight');
        riskScore += 10;
      }
    } else {
      requirements.push('Stop loss is required');
      riskScore += 40;
    }

    // Check take profit ratio
    if (newTrade.takeProfit && newTrade.openRate && newTrade.stopLoss) {
      const riskDistance = Math.abs(newTrade.openRate - newTrade.stopLoss);
      const rewardDistance = Math.abs(newTrade.takeProfit - newTrade.openRate);
      const riskRewardRatio = rewardDistance / riskDistance;
      
      if (riskRewardRatio < this.riskLimits.takeProfitRatio) {
        warnings.push(`Risk/reward ratio below minimum ${this.riskLimits.takeProfitRatio}:1`);
        riskScore += 20;
      }
    }

    const approved = riskScore < 50 && requirements.length === 0;
    
    return { approved, riskScore, warnings, requirements };
  }

  /**
   * Calculate comprehensive risk metrics for the portfolio
   */
  calculateRiskMetrics(
    positions: Position[],
    trades: Trade[],
    portfolioValue: number
  ): RiskMetrics {
    const totalExposure = positions.reduce((sum, p) => sum + p.size, 0);
    const unrealizedPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    
    // Calculate daily P&L
    const today = new Date().toDateString();
    const todayTrades = trades.filter(t => 
      new Date(t.closeTime || t.openTime).toDateString() === today
    );
    const dailyPnL = todayTrades.reduce((sum, t) => sum + t.profit.amount, 0);
    
    // Calculate drawdown
    const drawdownAnalysis = this.calculateDrawdown(portfolioValue);
    
    // Calculate Sharpe ratio
    const sharpeRatio = this.calculateSharpeRatio(trades);
    
    // Calculate overall risk score
    const riskScore = this.calculateOverallRiskScore(
      positions,
      portfolioValue,
      drawdownAnalysis.currentDrawdown
    );
    
    let healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (riskScore > 70 || drawdownAnalysis.currentDrawdown > 0.15) {
      healthStatus = 'CRITICAL';
    } else if (riskScore > 50 || drawdownAnalysis.currentDrawdown > 0.1) {
      healthStatus = 'WARNING';
    }

    return {
      portfolioValue,
      totalExposure,
      availableMargin: portfolioValue - totalExposure,
      usedMargin: totalExposure,
      unrealizedPnL,
      dailyPnL,
      maxDrawdown: drawdownAnalysis.maxDrawdown,
      sharpeRatio,
      riskScore,
      healthStatus
    };
  }

  /**
   * Analyze correlation between trading pairs
   */
  analyzeCorrelationRisk(newSymbol: string, currentPositions: Position[]): CorrelationAnalysis[] {
    const correlations: CorrelationAnalysis[] = [];
    
    // Mock correlation analysis - in production, use historical price data
    const mockCorrelations: { [key: string]: { [key: string]: number } } = {
      'BTC/USDT': { 'ETH/USDT': 0.8, 'ADA/USDT': 0.6 },
      'ETH/USDT': { 'BTC/USDT': 0.8, 'MATIC/USDT': 0.7 },
      'ADA/USDT': { 'BTC/USDT': 0.6, 'DOT/USDT': 0.5 }
    };
    
    currentPositions.forEach(position => {
      const correlation = mockCorrelations[newSymbol]?.[position.symbol] || 0;
      if (correlation > 0.3) {
        correlations.push({
          symbol1: newSymbol,
          symbol2: position.symbol,
          correlation,
          risk: correlation > 0.7 ? 'HIGH' : correlation > 0.5 ? 'MEDIUM' : 'LOW'
        });
      }
    });
    
    return correlations;
  }

  /**
   * Calculate drawdown analysis
   */
  private calculateDrawdown(currentValue: number): DrawdownAnalysis {
    this.portfolioHistory.push({
      timestamp: Date.now(),
      value: currentValue,
      pnl: 0 // Would calculate based on previous value
    });
    
    // Keep only last 100 entries
    if (this.portfolioHistory.length > 100) {
      this.portfolioHistory = this.portfolioHistory.slice(-100);
    }
    
    let maxValue = 0;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    
    this.portfolioHistory.forEach(entry => {
      if (entry.value > maxValue) {
        maxValue = entry.value;
      }
      
      const drawdown = (maxValue - entry.value) / maxValue;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });
    
    currentDrawdown = (maxValue - currentValue) / maxValue;
    
    return {
      currentDrawdown,
      maxDrawdown,
      drawdownDuration: 0, // Would calculate duration
      recoveryTime: 0, // Would calculate recovery time
      riskLevel: currentDrawdown > 0.15 ? 'HIGH' : currentDrawdown > 0.1 ? 'MEDIUM' : 'LOW'
    };
  }

  /**
   * Calculate Sharpe ratio
   */
  private calculateSharpeRatio(trades: Trade[]): number {
    if (trades.length < 10) return 0;
    
    const returns = trades.map(t => t.profit.percent / 100);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    // Assuming risk-free rate of 2% annually
    const riskFreeRate = 0.02 / 252; // Daily risk-free rate
    
    return stdDev === 0 ? 0 : (avgReturn - riskFreeRate) / stdDev;
  }

  /**
   * Calculate overall risk score
   */
  private calculateOverallRiskScore(
    positions: Position[],
    portfolioValue: number,
    currentDrawdown: number
  ): number {
    let score = 0;
    
    // Position concentration risk
    const largestPosition = Math.max(...positions.map(p => p.size));
    const concentrationRisk = (largestPosition / portfolioValue) * 100;
    if (concentrationRisk > 20) score += 30;
    else if (concentrationRisk > 15) score += 20;
    else if (concentrationRisk > 10) score += 10;
    
    // Drawdown risk
    if (currentDrawdown > 0.15) score += 40;
    else if (currentDrawdown > 0.1) score += 25;
    else if (currentDrawdown > 0.05) score += 10;
    
    // Number of positions risk
    if (positions.length > 8) score += 15;
    else if (positions.length > 6) score += 10;
    
    // Leverage risk (if applicable)
    const totalLeverage = positions.reduce((sum, p) => sum + (p.leverage || 1), 0) / positions.length;
    if (totalLeverage > 3) score += 20;
    else if (totalLeverage > 2) score += 10;
    
    return Math.min(100, score);
  }

  /**
   * Generate risk management alerts
   */
  generateRiskAlerts(riskMetrics: RiskMetrics, positions: Position[]): Array<{
    level: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    action: string;
  }> {
    const alerts = [];
    
    if (riskMetrics.maxDrawdown > this.riskLimits.maxDrawdown) {
      alerts.push({
        level: 'CRITICAL' as const,
        message: `Maximum drawdown exceeded: ${(riskMetrics.maxDrawdown * 100).toFixed(1)}%`,
        action: 'Consider reducing position sizes or stopping trading'
      });
    }
    
    if (riskMetrics.dailyPnL < -riskMetrics.portfolioValue * this.riskLimits.maxDailyLoss) {
      alerts.push({
        level: 'CRITICAL' as const,
        message: `Daily loss limit exceeded: ${riskMetrics.dailyPnL.toFixed(2)}`,
        action: 'Stop trading for today'
      });
    }
    
    if (riskMetrics.riskScore > 70) {
      alerts.push({
        level: 'WARNING' as const,
        message: `High risk score: ${riskMetrics.riskScore}`,
        action: 'Review and reduce risk exposure'
      });
    }
    
    const highCorrelationPositions = this.findHighCorrelationPositions(positions);
    if (highCorrelationPositions.length > 0) {
      alerts.push({
        level: 'WARNING' as const,
        message: `High correlation detected between positions`,
        action: 'Consider diversifying portfolio'
      });
    }
    
    return alerts;
  }

  /**
   * Find positions with high correlation
   */
  private findHighCorrelationPositions(positions: Position[]): CorrelationAnalysis[] {
    const highCorrelations: CorrelationAnalysis[] = [];
    
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const correlation = this.analyzeCorrelationRisk(positions[i].symbol, [positions[j]]);
        const highCorr = correlation.filter(c => c.risk === 'HIGH');
        highCorrelations.push(...highCorr);
      }
    }
    
    return highCorrelations;
  }

  /**
   * Update risk limits
   */
  updateRiskLimits(newLimits: Partial<RiskLimits>): void {
    this.riskLimits = { ...this.riskLimits, ...newLimits };
  }

  /**
   * Get current risk limits
   */
  getRiskLimits(): RiskLimits {
    return { ...this.riskLimits };
  }

  /**
   * Emergency position closure recommendation
   */
  getEmergencyActions(riskMetrics: RiskMetrics, positions: Position[]): Array<{
    action: 'CLOSE_POSITION' | 'REDUCE_SIZE' | 'HEDGE_POSITION';
    symbol: string;
    reason: string;
    priority: number; // 1-5, 5 being highest
  }> {
    const actions = [];
    
    if (riskMetrics.healthStatus === 'CRITICAL') {
      // Close largest losing positions first
      const losingPositions = positions
        .filter(p => p.unrealizedPnL < 0)
        .sort((a, b) => a.unrealizedPnL - b.unrealizedPnL);
      
      losingPositions.slice(0, 3).forEach(position => {
        actions.push({
          action: 'CLOSE_POSITION' as const,
          symbol: position.symbol,
          reason: 'Large unrealized loss in critical risk state',
          priority: 5
        });
      });
    }
    
    // Recommend reducing oversized positions
    positions.forEach(position => {
      const positionPercentage = position.size / riskMetrics.portfolioValue;
      if (positionPercentage > this.riskLimits.maxPositionSize) {
        actions.push({
          action: 'REDUCE_SIZE' as const,
          symbol: position.symbol,
          reason: `Position size exceeds ${this.riskLimits.maxPositionSize * 100}% limit`,
          priority: 3
        });
      }
    });
    
    return actions.sort((a, b) => b.priority - a.priority);
  }
}

export default RiskManagementService;
