// Performance Monitoring and Alerting System
import { Trade, Position } from '../types';
import EnhancedLoggingService from './enhancedLoggingService';

export interface PerformanceAlert {
  id: string;
  type: 'PERFORMANCE' | 'RISK' | 'SYSTEM' | 'STRATEGY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
  acknowledged: boolean;
  resolved: boolean;
  actions: string[];
}

export interface PerformanceMetrics {
  // Trading Performance
  totalReturn: number;
  periodicReturns: {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  riskAdjustedReturns: {
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    informationRatio: number;
  };
  drawdownMetrics: {
    currentDrawdown: number;
    maxDrawdown: number;
    avgDrawdown: number;
    drawdownDuration: number;
    recoveryTime: number;
  };
  tradingMetrics: {
    winRate: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    expectancy: number;
    totalTrades: number;
    avgHoldTime: number;
  };
  
  // System Performance
  executionMetrics: {
    avgExecutionTime: number;
    orderFillRate: number;
    slippageAvg: number;
    rejectionRate: number;
  };
  dataMetrics: {
    feedLatency: number;
    dataQuality: number;
    uptimePercentage: number;
  };
}

export interface PerformanceThresholds {
  maxDrawdown: number;
  minSharpeRatio: number;
  maxDailyLoss: number;
  minWinRate: number;
  maxExecutionTime: number;
  minDataQuality: number;
  maxSlippage: number;
}

export interface PerformanceTrend {
  metric: string;
  period: string;
  direction: 'UP' | 'DOWN' | 'STABLE';
  magnitude: number;
  significance: 'MINOR' | 'MODERATE' | 'MAJOR';
  description: string;
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private logger: EnhancedLoggingService;
  private alerts: PerformanceAlert[] = [];
  private metricsHistory: Array<{ timestamp: string; metrics: PerformanceMetrics }> = [];
  private thresholds: PerformanceThresholds;
  private isMonitoring = false;

  private constructor() {
    this.logger = EnhancedLoggingService.getInstance();
    this.thresholds = this.getDefaultThresholds();
    this.startMonitoring();
  }

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Calculate current performance metrics
   */
  calculatePerformanceMetrics(
    trades: Trade[],
    positions: Position[],
    portfolioValue: number,
    initialValue: number
  ): PerformanceMetrics {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    const oneQuarter = 90 * oneDay;
    const oneYear = 365 * oneDay;

    // Calculate periodic returns
    const totalReturn = ((portfolioValue - initialValue) / initialValue) * 100;
    const dailyTrades = trades.filter(t => now - new Date(t.openTime).getTime() < oneDay);
    const weeklyTrades = trades.filter(t => now - new Date(t.openTime).getTime() < oneWeek);
    const monthlyTrades = trades.filter(t => now - new Date(t.openTime).getTime() < oneMonth);
    const quarterlyTrades = trades.filter(t => now - new Date(t.openTime).getTime() < oneQuarter);
    const yearlyTrades = trades.filter(t => now - new Date(t.openTime).getTime() < oneYear);

    const periodicReturns = {
      daily: this.calculateReturn(dailyTrades),
      weekly: this.calculateReturn(weeklyTrades),
      monthly: this.calculateReturn(monthlyTrades),
      quarterly: this.calculateReturn(quarterlyTrades),
      yearly: this.calculateReturn(yearlyTrades)
    };

    // Calculate risk-adjusted returns
    const returns = trades.map(t => t.profit.percent);
    const riskAdjustedReturns = {
      sharpeRatio: this.calculateSharpeRatio(returns),
      sortinoRatio: this.calculateSortinoRatio(returns),
      calmarRatio: this.calculateCalmarRatio(totalReturn, this.calculateMaxDrawdown(trades)),
      informationRatio: this.calculateInformationRatio(returns)
    };

    // Calculate drawdown metrics
    const drawdownMetrics = {
      currentDrawdown: this.calculateCurrentDrawdown(portfolioValue),
      maxDrawdown: this.calculateMaxDrawdown(trades),
      avgDrawdown: this.calculateAvgDrawdown(trades),
      drawdownDuration: this.calculateDrawdownDuration(trades),
      recoveryTime: this.calculateRecoveryTime(trades)
    };

    // Calculate trading metrics
    const winningTrades = trades.filter(t => t.profit.amount > 0);
    const losingTrades = trades.filter(t => t.profit.amount < 0);
    
    const tradingMetrics = {
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      avgWin: winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.profit.amount, 0) / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.profit.amount, 0) / losingTrades.length) : 0,
      profitFactor: this.calculateProfitFactor(winningTrades, losingTrades),
      expectancy: this.calculateExpectancy(trades),
      totalTrades: trades.length,
      avgHoldTime: this.calculateAvgHoldTime(trades)
    };

    // Calculate execution metrics (mock for now)
    const executionMetrics = {
      avgExecutionTime: 150 + Math.random() * 50, // 150-200ms
      orderFillRate: 98 + Math.random() * 2, // 98-100%
      slippageAvg: Math.random() * 0.1, // 0-0.1%
      rejectionRate: Math.random() * 2 // 0-2%
    };

    // Calculate data metrics (mock for now)
    const dataMetrics = {
      feedLatency: 100 + Math.random() * 100, // 100-200ms
      dataQuality: 95 + Math.random() * 5, // 95-100%
      uptimePercentage: 99.5 + Math.random() * 0.5 // 99.5-100%
    };

    return {
      totalReturn,
      periodicReturns,
      riskAdjustedReturns,
      drawdownMetrics,
      tradingMetrics,
      executionMetrics,
      dataMetrics
    };
  }

  /**
   * Check performance against thresholds and generate alerts
   */
  checkPerformanceThresholds(metrics: PerformanceMetrics): PerformanceAlert[] {
    const newAlerts: PerformanceAlert[] = [];

    // Check drawdown threshold
    if (metrics.drawdownMetrics.currentDrawdown > this.thresholds.maxDrawdown) {
      newAlerts.push(this.createAlert(
        'RISK',
        'CRITICAL',
        'Maximum Drawdown Exceeded',
        `Current drawdown ${metrics.drawdownMetrics.currentDrawdown.toFixed(2)}% exceeds threshold of ${this.thresholds.maxDrawdown}%`,
        { currentDrawdown: metrics.drawdownMetrics.currentDrawdown, threshold: this.thresholds.maxDrawdown },
        ['Reduce position sizes', 'Review risk management', 'Consider stopping trading']
      ));
    }

    // Check Sharpe ratio threshold
    if (metrics.riskAdjustedReturns.sharpeRatio < this.thresholds.minSharpeRatio) {
      newAlerts.push(this.createAlert(
        'PERFORMANCE',
        'HIGH',
        'Low Sharpe Ratio',
        `Sharpe ratio ${metrics.riskAdjustedReturns.sharpeRatio.toFixed(2)} below threshold of ${this.thresholds.minSharpeRatio}`,
        { sharpeRatio: metrics.riskAdjustedReturns.sharpeRatio, threshold: this.thresholds.minSharpeRatio },
        ['Review strategy parameters', 'Analyze recent trades', 'Consider strategy optimization']
      ));
    }

    // Check daily loss threshold
    if (metrics.periodicReturns.daily < -this.thresholds.maxDailyLoss) {
      newAlerts.push(this.createAlert(
        'RISK',
        'HIGH',
        'Daily Loss Limit Exceeded',
        `Daily loss of ${metrics.periodicReturns.daily.toFixed(2)}% exceeds limit of ${this.thresholds.maxDailyLoss}%`,
        { dailyLoss: metrics.periodicReturns.daily, threshold: this.thresholds.maxDailyLoss },
        ['Stop trading for today', 'Review losing trades', 'Check risk parameters']
      ));
    }

    // Check win rate threshold
    if (metrics.tradingMetrics.winRate < this.thresholds.minWinRate) {
      newAlerts.push(this.createAlert(
        'PERFORMANCE',
        'MEDIUM',
        'Low Win Rate',
        `Win rate ${metrics.tradingMetrics.winRate.toFixed(1)}% below threshold of ${this.thresholds.minWinRate}%`,
        { winRate: metrics.tradingMetrics.winRate, threshold: this.thresholds.minWinRate },
        ['Analyze losing trades', 'Review entry criteria', 'Consider strategy adjustment']
      ));
    }

    // Check execution time threshold
    if (metrics.executionMetrics.avgExecutionTime > this.thresholds.maxExecutionTime) {
      newAlerts.push(this.createAlert(
        'SYSTEM',
        'MEDIUM',
        'High Execution Latency',
        `Average execution time ${metrics.executionMetrics.avgExecutionTime.toFixed(0)}ms exceeds threshold of ${this.thresholds.maxExecutionTime}ms`,
        { executionTime: metrics.executionMetrics.avgExecutionTime, threshold: this.thresholds.maxExecutionTime },
        ['Check system performance', 'Review network connectivity', 'Optimize execution logic']
      ));
    }

    // Check data quality threshold
    if (metrics.dataMetrics.dataQuality < this.thresholds.minDataQuality) {
      newAlerts.push(this.createAlert(
        'SYSTEM',
        'HIGH',
        'Poor Data Quality',
        `Data quality ${metrics.dataMetrics.dataQuality.toFixed(1)}% below threshold of ${this.thresholds.minDataQuality}%`,
        { dataQuality: metrics.dataMetrics.dataQuality, threshold: this.thresholds.minDataQuality },
        ['Check data feeds', 'Validate data sources', 'Consider backup data providers']
      ));
    }

    // Check slippage threshold
    if (metrics.executionMetrics.slippageAvg > this.thresholds.maxSlippage) {
      newAlerts.push(this.createAlert(
        'PERFORMANCE',
        'MEDIUM',
        'High Slippage',
        `Average slippage ${(metrics.executionMetrics.slippageAvg * 100).toFixed(3)}% exceeds threshold of ${(this.thresholds.maxSlippage * 100).toFixed(3)}%`,
        { slippage: metrics.executionMetrics.slippageAvg, threshold: this.thresholds.maxSlippage },
        ['Review order sizes', 'Check market liquidity', 'Consider limit orders']
      ));
    }

    // Add alerts to collection
    newAlerts.forEach(alert => {
      this.alerts.push(alert);
      this.logger.log('WARN', 'PERFORMANCE_ALERT', alert.title, alert);
    });

    return newAlerts;
  }

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends(periods: number = 10): PerformanceTrend[] {
    if (this.metricsHistory.length < periods) {
      return [];
    }

    const recentMetrics = this.metricsHistory.slice(-periods);
    const trends: PerformanceTrend[] = [];

    // Analyze return trend
    const returns = recentMetrics.map(m => m.metrics.periodicReturns.daily);
    trends.push(this.analyzeTrend('Daily Returns', returns, 'percentage'));

    // Analyze Sharpe ratio trend
    const sharpeRatios = recentMetrics.map(m => m.metrics.riskAdjustedReturns.sharpeRatio);
    trends.push(this.analyzeTrend('Sharpe Ratio', sharpeRatios, 'ratio'));

    // Analyze win rate trend
    const winRates = recentMetrics.map(m => m.metrics.tradingMetrics.winRate);
    trends.push(this.analyzeTrend('Win Rate', winRates, 'percentage'));

    // Analyze drawdown trend
    const drawdowns = recentMetrics.map(m => m.metrics.drawdownMetrics.currentDrawdown);
    trends.push(this.analyzeTrend('Current Drawdown', drawdowns, 'percentage'));

    return trends.filter(trend => trend.significance !== 'MINOR');
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.logger.log('INFO', 'ALERT_MANAGEMENT', `Alert acknowledged: ${alert.title}`);
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.log('INFO', 'ALERT_MANAGEMENT', `Alert resolved: ${alert.title}`);
    }
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    this.logger.log('INFO', 'THRESHOLD_UPDATE', 'Performance thresholds updated', newThresholds);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    current: PerformanceMetrics | null;
    alerts: number;
    trends: PerformanceTrend[];
    systemHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  } {
    const current = this.metricsHistory.length > 0 ? 
      this.metricsHistory[this.metricsHistory.length - 1].metrics : null;
    
    const activeAlerts = this.getActiveAlerts().length;
    const trends = this.analyzePerformanceTrends();
    
    let systemHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' = 'EXCELLENT';
    if (activeAlerts > 5 || (current && current.drawdownMetrics.currentDrawdown > 15)) {
      systemHealth = 'POOR';
    } else if (activeAlerts > 2 || (current && current.drawdownMetrics.currentDrawdown > 10)) {
      systemHealth = 'FAIR';
    } else if (activeAlerts > 0 || (current && current.drawdownMetrics.currentDrawdown > 5)) {
      systemHealth = 'GOOD';
    }

    return {
      current,
      alerts: activeAlerts,
      trends,
      systemHealth
    };
  }

  // Private helper methods
  private getDefaultThresholds(): PerformanceThresholds {
    return {
      maxDrawdown: 15, // 15%
      minSharpeRatio: 1.0,
      maxDailyLoss: 5, // 5%
      minWinRate: 50, // 50%
      maxExecutionTime: 500, // 500ms
      minDataQuality: 95, // 95%
      maxSlippage: 0.001 // 0.1%
    };
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    title: string,
    message: string,
    data?: any,
    actions: string[] = []
  ): PerformanceAlert {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      severity,
      title,
      message,
      timestamp: new Date().toISOString(),
      data,
      acknowledged: false,
      resolved: false,
      actions
    };
  }

  private calculateReturn(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    return trades.reduce((sum, trade) => sum + trade.profit.percent, 0);
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  private calculateSortinoRatio(returns: number[]): number {
    const positiveReturns = returns.filter(r => r > 0);
    const negativeReturns = returns.filter(r => r < 0);
    
    if (positiveReturns.length === 0 || negativeReturns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const downside = Math.sqrt(negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length);
    
    return downside > 0 ? avgReturn / downside : 0;
  }

  private calculateCalmarRatio(totalReturn: number, maxDrawdown: number): number {
    return maxDrawdown > 0 ? totalReturn / maxDrawdown : 0;
  }

  private calculateInformationRatio(returns: number[]): number {
    // Simplified - would compare against benchmark
    return this.calculateSharpeRatio(returns) * 0.8;
  }

  private calculateCurrentDrawdown(portfolioValue: number): number {
    // Mock - would track actual peak values
    return Math.random() * 10; // 0-10%
  }

  private calculateMaxDrawdown(trades: Trade[]): number {
    // Mock calculation
    return Math.random() * 20; // 0-20%
  }

  private calculateAvgDrawdown(trades: Trade[]): number {
    return this.calculateMaxDrawdown(trades) * 0.5;
  }

  private calculateDrawdownDuration(trades: Trade[]): number {
    // Mock - days in drawdown
    return Math.random() * 30; // 0-30 days
  }

  private calculateRecoveryTime(trades: Trade[]): number {
    // Mock - days to recover
    return Math.random() * 15; // 0-15 days
  }

  private calculateProfitFactor(winningTrades: Trade[], losingTrades: Trade[]): number {
    const totalWins = winningTrades.reduce((sum, t) => sum + t.profit.amount, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit.amount, 0));
    return totalLosses > 0 ? totalWins / totalLosses : 0;
  }

  private calculateExpectancy(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    return trades.reduce((sum, trade) => sum + trade.profit.amount, 0) / trades.length;
  }

  private calculateAvgHoldTime(trades: Trade[]): number {
    const completedTrades = trades.filter(t => t.closeTime);
    if (completedTrades.length === 0) return 0;
    
    const holdTimes = completedTrades.map(t => 
      new Date(t.closeTime!).getTime() - new Date(t.openTime).getTime()
    );
    
    return holdTimes.reduce((sum, time) => sum + time, 0) / holdTimes.length / (1000 * 60 * 60); // Hours
  }

  private analyzeTrend(name: string, values: number[], type: string): PerformanceTrend {
    if (values.length < 2) {
      return {
        metric: name,
        period: '10 periods',
        direction: 'STABLE',
        magnitude: 0,
        significance: 'MINOR',
        description: 'Insufficient data for trend analysis'
      };
    }

    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const magnitude = Math.abs(slope);

    let direction: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (slope > 0.01) direction = 'UP';
    else if (slope < -0.01) direction = 'DOWN';

    let significance: 'MINOR' | 'MODERATE' | 'MAJOR' = 'MINOR';
    if (magnitude > 0.1) significance = 'MAJOR';
    else if (magnitude > 0.05) significance = 'MODERATE';

    return {
      metric: name,
      period: '10 periods',
      direction,
      magnitude,
      significance,
      description: `${name} is trending ${direction.toLowerCase()} with ${significance.toLowerCase()} significance`
    };
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Monitor every 5 minutes
    setInterval(() => {
      // This would be called with actual trading data
      // For now, we'll just store the monitoring state
      this.logger.log('DEBUG', 'PERFORMANCE_MONITOR', 'Performance monitoring cycle completed');
    }, 5 * 60 * 1000);
  }
}

export default PerformanceMonitoringService;
