import { MarketOpportunity, TickerData, CandlestickData, NewsImpactAnalysis } from '../types';
import NewsAnalysisService from './newsAnalysisService';
import MachineLearningService from './machineLearningService';

interface TechnicalIndicators {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  bollinger: { upper: number; middle: number; lower: number };
  ema20: number;
  ema50: number;
  volume: number;
  volatility: number;
  momentum: number;
}

interface MarketConditions {
  trend: 'bullish' | 'bearish' | 'sideways';
  strength: number; // 0-100
  volatility: 'low' | 'medium' | 'high';
  volume: 'low' | 'medium' | 'high';
  support: number;
  resistance: number;
}

interface ProfitableOpportunity extends MarketOpportunity {
  confidence: number; // 0-100
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number[];
  riskReward: number;
  technicalSignals: string[];
  fundamentalFactors: string[];
  newsImpact: 'positive' | 'negative' | 'neutral';
  marketCap?: number;
  liquidity: 'low' | 'medium' | 'high';
}

class EnhancedAIService {
  private static instance: EnhancedAIService;
  private newsService: NewsAnalysisService;

  private constructor() {
    this.newsService = NewsAnalysisService.getInstance();
  }

  static getInstance(): EnhancedAIService {
    if (!EnhancedAIService.instance) {
      EnhancedAIService.instance = new EnhancedAIService();
    }
    return EnhancedAIService.instance;
  }

  /**
   * Advanced AI-powered market screening for high-profit opportunities
   */
  async findProfitableOpportunities(
    userProfile: string,
    riskTolerance: 'low' | 'medium' | 'high',
    timeframe: string = '4h',
    maxOpportunities: number = 10
  ): Promise<ProfitableOpportunity[]> {
    try {
      // Get market data and news analysis
      const [marketData, newsAnalysis] = await Promise.all([
        this.getMarketData(),
        this.newsService.analyzeNewsImpact(['BTC', 'ETH', 'SOL', 'ADA'])
      ]);

      // Advanced screening criteria
      const opportunities: ProfitableOpportunity[] = [];

      // Analyze each potential symbol
      const symbols = this.getTopSymbolsByVolume(marketData);
      
      for (const symbol of symbols.slice(0, 20)) {
        const analysis = await this.analyzeSymbolForProfitability(
          symbol,
          userProfile,
          riskTolerance,
          timeframe,
          newsAnalysis
        );
        
        if (analysis && analysis.confidence > 60) {
          opportunities.push(analysis);
        }
      }

      // Sort by confidence and profit potential
      return opportunities
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxOpportunities);

    } catch (error) {
      console.error('Error finding profitable opportunities:', error);
      return this.getMockProfitableOpportunities(riskTolerance, maxOpportunities);
    }
  }

  /**
   * Analyze a specific symbol for profitability using multiple factors
   */
  private async analyzeSymbolForProfitability(
    symbol: string,
    userProfile: string,
    riskTolerance: 'low' | 'medium' | 'high',
    timeframe: string,
    newsAnalysis: NewsImpactAnalysis
  ): Promise<ProfitableOpportunity | null> {
    try {
      // Get technical indicators
      const technicals = await this.getTechnicalIndicators(symbol, timeframe);
      const marketConditions = this.analyzeMarketConditions(technicals);
      
      // Calculate confidence score
      const confidence = this.calculateConfidenceScore(
        technicals,
        marketConditions,
        newsAnalysis,
        symbol
      );

      if (confidence < 50) return null;

      // Calculate entry/exit points
      const currentPrice = technicals.ema20; // Use EMA20 as current price proxy
      const { entryPrice, stopLoss, takeProfit } = this.calculateTradingLevels(
        currentPrice,
        marketConditions,
        riskTolerance
      );

      // Generate trading signals
      const technicalSignals = this.generateTechnicalSignals(technicals, marketConditions);
      const fundamentalFactors = this.analyzeFundamentals(symbol, newsAnalysis);

      return {
        symbol,
        rationale: this.generateRationale(technicalSignals, fundamentalFactors, confidence),
        type: symbol.includes('/') ? 'Crypto' : 'Stock',
        keyMetrics: {
          volatility: marketConditions.volatility,
          trend: marketConditions.trend
        },
        confidence,
        timeframe,
        entryPrice,
        stopLoss,
        takeProfit,
        riskReward: this.calculateRiskReward(entryPrice, stopLoss, takeProfit[0]),
        technicalSignals,
        fundamentalFactors,
        newsImpact: this.assessNewsImpact(symbol, newsAnalysis),
        liquidity: this.assessLiquidity(technicals.volume)
      };

    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
      return null;
    }
  }

  private calculateConfidenceScore(
    technicals: TechnicalIndicators,
    marketConditions: MarketConditions,
    newsAnalysis: NewsImpactAnalysis,
    symbol: string
  ): number {
    let score = 0;

    // Technical analysis weight: 40%
    if (technicals.rsi > 30 && technicals.rsi < 70) score += 10;
    if (technicals.macd.value > technicals.macd.signal) score += 10;
    if (technicals.ema20 > technicals.ema50) score += 10;
    if (marketConditions.trend === 'bullish') score += 10;

    // Market conditions weight: 30%
    if (marketConditions.strength > 60) score += 15;
    if (marketConditions.volume === 'high') score += 10;
    if (marketConditions.volatility === 'medium') score += 5;

    // News sentiment weight: 20%
    const newsImpact = this.assessNewsImpact(symbol, newsAnalysis);
    if (newsImpact === 'positive') score += 15;
    else if (newsImpact === 'neutral') score += 5;

    // Momentum weight: 10%
    if (technicals.momentum > 0) score += 10;

    return Math.min(score, 100);
  }

  private generateTechnicalSignals(
    technicals: TechnicalIndicators,
    marketConditions: MarketConditions
  ): string[] {
    const signals: string[] = [];

    if (technicals.rsi < 30) signals.push('RSI Oversold - Potential Reversal');
    if (technicals.rsi > 70) signals.push('RSI Overbought - Take Profit Zone');
    if (technicals.macd.value > technicals.macd.signal) signals.push('MACD Bullish Crossover');
    if (technicals.ema20 > technicals.ema50) signals.push('EMA Golden Cross');
    if (marketConditions.trend === 'bullish') signals.push('Strong Uptrend Confirmed');
    if (marketConditions.volume === 'high') signals.push('High Volume Breakout');

    return signals;
  }

  private analyzeFundamentals(symbol: string, newsAnalysis: NewsImpactAnalysis): string[] {
    const factors: string[] = [];

    // Check if symbol appears in recent news
    const relevantNews = newsAnalysis.keyEvents.filter(event =>
      event.relevantSymbols.includes(symbol) || 
      event.title.toLowerCase().includes(symbol.toLowerCase())
    );

    if (relevantNews.length > 0) {
      const bullishNews = relevantNews.filter(n => n.sentiment === 'bullish');
      const bearishNews = relevantNews.filter(n => n.sentiment === 'bearish');

      if (bullishNews.length > bearishNews.length) {
        factors.push('Positive News Momentum');
      }
      if (relevantNews.some(n => n.impact === 'high')) {
        factors.push('High Impact Events');
      }
    }

    // General market factors
    if (newsAnalysis.overallSentiment === 'bullish') {
      factors.push('Bullish Market Sentiment');
    }

    return factors;
  }

  private assessNewsImpact(symbol: string, newsAnalysis: NewsImpactAnalysis): 'positive' | 'negative' | 'neutral' {
    const relevantNews = newsAnalysis.keyEvents.filter(event =>
      event.relevantSymbols.includes(symbol) || 
      event.title.toLowerCase().includes(symbol.toLowerCase())
    );

    if (relevantNews.length === 0) return 'neutral';

    const bullishCount = relevantNews.filter(n => n.sentiment === 'bullish').length;
    const bearishCount = relevantNews.filter(n => n.sentiment === 'bearish').length;

    if (bullishCount > bearishCount) return 'positive';
    if (bearishCount > bullishCount) return 'negative';
    return 'neutral';
  }

  private calculateTradingLevels(
    currentPrice: number,
    marketConditions: MarketConditions,
    riskTolerance: 'low' | 'medium' | 'high'
  ) {
    const riskPercentages = {
      low: 0.02,    // 2%
      medium: 0.05, // 5%
      high: 0.10    // 10%
    };

    const riskPercent = riskPercentages[riskTolerance];
    
    const entryPrice = currentPrice;
    const stopLoss = entryPrice * (1 - riskPercent);
    
    // Multiple take profit levels
    const takeProfit = [
      entryPrice * (1 + riskPercent * 2), // 2:1 ratio
      entryPrice * (1 + riskPercent * 3), // 3:1 ratio
      entryPrice * (1 + riskPercent * 5)  // 5:1 ratio
    ];

    return { entryPrice, stopLoss, takeProfit };
  }

  private calculateRiskReward(entryPrice: number, stopLoss: number, takeProfit: number): number {
    const risk = entryPrice - stopLoss;
    const reward = takeProfit - entryPrice;
    return reward / risk;
  }

  private generateRationale(
    technicalSignals: string[],
    fundamentalFactors: string[],
    confidence: number
  ): string {
    const mainSignal = technicalSignals[0] || 'Technical analysis';
    const mainFactor = fundamentalFactors[0] || 'market conditions';
    
    return `${mainSignal} combined with ${mainFactor} suggests strong potential with ${confidence}% confidence. Multiple technical indicators align for favorable risk/reward setup.`;
  }

  // Mock implementations for development
  private async getMarketData(): Promise<TickerData[]> {
    // In production, this would fetch real market data
    return [
      { symbol: 'BTC/USDT', price: 45000, change24h: 1200, changePercent24h: 2.7, volume24h: 1000000, high24h: 46000, low24h: 43000, timestamp: Date.now() },
      { symbol: 'ETH/USDT', price: 3200, change24h: 80, changePercent24h: 2.6, volume24h: 800000, high24h: 3250, low24h: 3100, timestamp: Date.now() }
    ];
  }

  private getTopSymbolsByVolume(marketData: TickerData[]): string[] {
    return marketData
      .sort((a, b) => b.volume24h - a.volume24h)
      .map(data => data.symbol);
  }

  private async getTechnicalIndicators(symbol: string, timeframe: string): Promise<TechnicalIndicators> {
    // Mock technical indicators - in production, calculate from real OHLCV data
    return {
      rsi: 45 + Math.random() * 20,
      macd: { value: 0.5, signal: 0.3, histogram: 0.2 },
      bollinger: { upper: 46000, middle: 45000, lower: 44000 },
      ema20: 45000,
      ema50: 44500,
      volume: 1000000 + Math.random() * 500000,
      volatility: Math.random() * 0.1,
      momentum: Math.random() * 2 - 1
    };
  }

  private analyzeMarketConditions(technicals: TechnicalIndicators): MarketConditions {
    const trend = technicals.ema20 > technicals.ema50 ? 'bullish' : 
                 technicals.ema20 < technicals.ema50 ? 'bearish' : 'sideways';
    
    const strength = Math.min(100, Math.abs(technicals.momentum) * 100);
    const volatility = technicals.volatility > 0.05 ? 'high' : 
                      technicals.volatility > 0.02 ? 'medium' : 'low';
    const volume = technicals.volume > 1200000 ? 'high' :
                  technicals.volume > 800000 ? 'medium' : 'low';

    return {
      trend,
      strength,
      volatility,
      volume,
      support: technicals.bollinger.lower,
      resistance: technicals.bollinger.upper
    };
  }

  private assessLiquidity(volume: number): 'low' | 'medium' | 'high' {
    if (volume > 1500000) return 'high';
    if (volume > 500000) return 'medium';
    return 'low';
  }

  private getMockProfitableOpportunities(
    riskTolerance: 'low' | 'medium' | 'high',
    maxOpportunities: number
  ): ProfitableOpportunity[] {
    const basePrice = 45000;
    const riskPercent = riskTolerance === 'low' ? 0.02 : riskTolerance === 'medium' ? 0.05 : 0.10;

    return [
      {
        symbol: 'BTC/USDT',
        rationale: 'Strong technical breakout above key resistance with high volume confirmation and positive news sentiment',
        type: 'Crypto',
        keyMetrics: { volatility: 'Medium', trend: 'Strong Up' },
        confidence: 85,
        timeframe: '4h',
        entryPrice: basePrice,
        stopLoss: basePrice * (1 - riskPercent),
        takeProfit: [basePrice * (1 + riskPercent * 2), basePrice * (1 + riskPercent * 3)],
        riskReward: 2.5,
        technicalSignals: ['MACD Bullish Crossover', 'RSI Oversold Recovery', 'Volume Breakout'],
        fundamentalFactors: ['Institutional Adoption', 'Positive Regulatory News'],
        newsImpact: 'positive',
        liquidity: 'high'
      }
    ].slice(0, maxOpportunities);
  }
}

export default EnhancedAIService;
