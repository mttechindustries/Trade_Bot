import { Trade } from '../types';
import MachineLearningService from './machineLearningService';
import { TimeService } from './timeService';

interface MarketConditions {
  volatility: number;
  volume: number;
  trend: number;
  rsi: number;
  macd: number;
  bollinger_position: number;
  market_session: 'pre-market' | 'market' | 'after-market' | 'closed';
  day_of_week: number;
  hour_of_day: number;
}

interface TradeCompletionData {
  trade: Trade;
  marketConditions?: MarketConditions;
}

class TradeLearningIntegration {
  private static instance: TradeLearningIntegration;
  private mlService: MachineLearningService;

  private constructor() {
    this.mlService = MachineLearningService.getInstance();
  }

  static getInstance(): TradeLearningIntegration {
    if (!TradeLearningIntegration.instance) {
      TradeLearningIntegration.instance = new TradeLearningIntegration();
    }
    return TradeLearningIntegration.instance;
  }

  /**
   * Called when a trade is completed to feed learning data to ML service
   */
  public onTradeCompleted(data: TradeCompletionData): void {
    const { trade, marketConditions } = data;
    
    if (!trade.closeTime || !trade.profit) {
      console.warn('Trade completion data incomplete, skipping ML learning');
      return;
    }

    // Convert trade to ML training format
    const tradeOutcome = {
      tradeId: trade.id.toString(),
      symbol: trade.pair,
      strategy: trade.strategy || 'unknown',
      entryTime: trade.openTime,
      exitTime: trade.closeTime,
      entryPrice: trade.openRate,
      exitPrice: trade.currentRate,
      profitLoss: trade.profit.amount * trade.stakeAmount,
      profitPercentage: trade.profit.percent,
      marketConditions: marketConditions || this.getDefaultMarketConditions(),
      indicators: this.extractIndicators(trade),
      confidence: 0.7, // Default confidence
      timeframe: '1h', // Default timeframe
      features: this.extractFeatures(trade, marketConditions),
      success: trade.profit.percent > 0
    };

    // Feed to ML service
    this.mlService.learnFromTrade(tradeOutcome);
    
    console.log(`✅ ML Service learned from ${trade.side} trade on ${trade.pair}: ${trade.profit.percent > 0 ? 'PROFIT' : 'LOSS'} (${trade.profit.percent.toFixed(2)}%)`);
  }

  /**
   * Get ML-enhanced trade predictions for a symbol
   */
  public async getMLEnhancedPrediction(_symbol: string, features: number[]): Promise<{
    successProbability: number;
    entryTimingScore: number;
    riskLevel: number;
    confidence: number;
    recommendations: string[];
  }> {
    const successProbability = this.mlService.predictTradeSuccess(features);
    const riskLevel = this.mlService.assessRisk(features);
    
    // Generate mock market conditions for timing prediction
    const mockConditions = {
      volatility: Math.random() * 0.5 + 0.1,
      volume: Math.random() * 0.8 + 0.2,
      trend: Math.random() * 2 - 1,
      rsi: Math.random() * 100,
      macd: Math.random() * 2 - 1,
      bollinger_position: Math.random(),
      market_session: 'market' as const,
      day_of_week: TimeService.getCurrentTime().getDay(),
      hour_of_day: TimeService.getCurrentTime().getHours()
    };
    
    const entryTimingScore = this.mlService.predictEntryTiming(mockConditions);
    
    // Get adaptive strategy recommendations
    const strategyRecs = this.mlService.getAdaptiveStrategyRecommendations(mockConditions);
    
    const recommendations = [
      `${(successProbability * 100).toFixed(1)}% success probability based on ${this.mlService.getLearningProgress().totalTrades} historical trades`,
      `Entry timing score: ${(entryTimingScore * 100).toFixed(1)}% - ${entryTimingScore > 0.7 ? 'Excellent' : entryTimingScore > 0.5 ? 'Good' : 'Wait for better opportunity'}`,
      `Risk level: ${(riskLevel * 100).toFixed(1)}% - ${riskLevel < 0.3 ? 'Low risk' : riskLevel < 0.7 ? 'Medium risk' : 'High risk'}`,
      ...strategyRecs.slice(0, 2).map(rec => `Recommended strategy: ${rec.strategy} (${(rec.confidence * 100).toFixed(1)}% confidence)`)
    ];

    return {
      successProbability,
      entryTimingScore,
      riskLevel,
      confidence: Math.min(successProbability, entryTimingScore, 1 - riskLevel),
      recommendations
    };
  }

  /**
   * Get overall learning progress
   */
  public getLearningStats(): {
    totalTradesLearned: number;
    currentAccuracy: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
    bestStrategy: string;
    confidence: number;
  } {
    const progress = this.mlService.getLearningProgress();
    
    const avgAccuracy = Object.values(progress.modelAccuracy)
      .reduce((sum, acc) => sum + acc, 0) / Object.keys(progress.modelAccuracy).length;

    const bestStrategy = progress.strategyPerformance
      .sort((a, b) => b.winRate - a.winRate)[0]?.strategyId || 'none';

    return {
      totalTradesLearned: progress.totalTrades,
      currentAccuracy: avgAccuracy,
      improvementTrend: progress.confidence > 0.7 ? 'improving' : progress.confidence > 0.5 ? 'stable' : 'declining',
      bestStrategy,
      confidence: progress.confidence
    };
  }

  private getDefaultMarketConditions() {
    return {
      volatility: 0.3,
      volume: 0.5,
      trend: 0,
      rsi: 50,
      macd: 0,
      bollinger_position: 0.5,
      market_session: 'market' as const,
      day_of_week: TimeService.getCurrentTime().getDay(),
      hour_of_day: TimeService.getCurrentTime().getHours()
    };
  }

  private extractIndicators(trade: Trade): { [key: string]: number } {
    return {
      profit_percent: trade.profit?.percent || 0,
      stake_amount: trade.stakeAmount,
      leverage: trade.leverage || 1,
      stop_loss_distance: trade.stopLoss ? Math.abs(trade.openRate - trade.stopLoss) / trade.openRate : 0,
      take_profit_distance: trade.takeProfit ? Math.abs(trade.takeProfit - trade.openRate) / trade.openRate : 0
    };
  }

  private extractFeatures(trade: Trade, marketConditions?: any): number[] {
    return [
      // Trade features
      trade.stakeAmount / 1000, // Normalized stake
      trade.leverage || 1,
      trade.side === 'long' ? 1 : 0,
      
      // Market condition features (if available)
      marketConditions?.volatility || 0.3,
      marketConditions?.volume || 0.5,
      marketConditions?.trend || 0,
      marketConditions?.rsi / 100 || 0.5,
      marketConditions?.macd || 0,
      
      // Time features
      TimeService.getCurrentTime().getHours() / 24,
      TimeService.getCurrentTime().getDay() / 7,
      TimeService.areMarketsOpen() ? 1 : 0,
      
      // Risk features
      trade.stopLoss ? 1 : 0,
      trade.takeProfit ? 1 : 0,
      
      // Additional normalized features
      Math.random(), // Random feature for noise
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random()
    ];
  }
}

export default TradeLearningIntegration;
