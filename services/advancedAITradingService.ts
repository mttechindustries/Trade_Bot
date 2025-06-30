import { Trade, MarketOpportunity, TickerData } from '../types';

interface AIConfig {
  provider: 'openai' | 'anthropic' | 'gemini';
  apiKey: string;
  model: string;
}

interface TradingSignal {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-1
  reasoning: string;
  technicalIndicators: {
    rsi: number;
    macd: 'bullish' | 'bearish' | 'neutral';
    trend: 'up' | 'down' | 'sideways';
    support: number;
    resistance: number;
  };
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface MarketAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  volatility: 'low' | 'medium' | 'high';
  trend: 'strong_up' | 'weak_up' | 'sideways' | 'weak_down' | 'strong_down';
  momentum: number; // -1 to 1
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  newsImpact: 'positive' | 'negative' | 'neutral';
  recommendation: string;
}

class AdvancedAITradingService {
  private static instance: AdvancedAITradingService;
  private config: AIConfig;

  private constructor() {
    this.config = {
      provider: 'openai', // Default to OpenAI
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      model: 'gpt-4-turbo-preview'
    };
  }

  static getInstance(): AdvancedAITradingService {
    if (!AdvancedAITradingService.instance) {
      AdvancedAITradingService.instance = new AdvancedAITradingService();
    }
    return AdvancedAITradingService.instance;
  }

  /**
   * Get comprehensive market analysis using advanced AI
   */
  async getMarketAnalysis(
    symbol: string, 
    timeframe: string = '4h',
    marketData?: TickerData
  ): Promise<MarketAnalysis> {
    const prompt = this.createMarketAnalysisPrompt(symbol, timeframe, marketData);
    
    try {
      const response = await this.callAI(prompt, 'market_analysis');
      return this.parseMarketAnalysis(response);
    } catch (error) {
      console.error('Error getting market analysis:', error);
      throw new Error('AI market analysis unavailable - AI service failed');
    }
  }

  /**
   * Generate trading signals with AI analysis
   */
  async generateTradingSignal(
    symbol: string,
    marketData: TickerData,
    userRiskTolerance: 'conservative' | 'moderate' | 'aggressive'
  ): Promise<TradingSignal> {
    const prompt = this.createTradingSignalPrompt(symbol, marketData, userRiskTolerance);
    
    try {
      const response = await this.callAI(prompt, 'trading_signal');
      return this.parseTradingSignal(response);
    } catch (error) {
      console.error('Error generating trading signal:', error);
      throw new Error('AI trading signal unavailable - AI service failed');
    }
  }

  /**
   * Find market opportunities with advanced screening
   */
  async findMarketOpportunities(
    investmentProfile: string,
    budget: number,
    timeHorizon: string
  ): Promise<MarketOpportunity[]> {
    const prompt = this.createOpportunityPrompt(investmentProfile, budget, timeHorizon);
    
    try {
      const response = await this.callAI(prompt, 'market_opportunities');
      return this.parseMarketOpportunities(response);
    } catch (error) {
      console.error('Error finding market opportunities:', error);
      return this.getFallbackOpportunities();
    }
  }

  /**
   * Analyze trade performance and provide insights
   */
  async analyzeTradePerformance(trades: Trade[]): Promise<{
    overallPerformance: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    riskAssessment: string;
  }> {
    const prompt = this.createTradeAnalysisPrompt(trades);
    
    try {
      const response = await this.callAI(prompt, 'trade_analysis');
      return this.parseTradeAnalysis(response);
    } catch (error) {
      console.error('Error analyzing trade performance:', error);
      return this.getFallbackTradeAnalysis();
    }
  }

  /**
   * Risk assessment for portfolio
   */
  async assessPortfolioRisk(
    portfolio: any[],
    marketConditions: any
  ): Promise<{
    riskScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'very_high';
    diversificationScore: number;
    recommendations: string[];
    hedgingStrategies: string[];
  }> {
    const prompt = this.createRiskAssessmentPrompt(portfolio, marketConditions);
    
    try {
      const response = await this.callAI(prompt, 'risk_assessment');
      return this.parseRiskAssessment(response);
    } catch (error) {
      console.error('Error assessing portfolio risk:', error);
      return this.getFallbackRiskAssessment();
    }
  }

  private async callAI(prompt: string, type: string): Promise<string> {
    const systemPrompt = this.getSystemPrompt(type);
    
    if (this.config.provider === 'openai') {
      return await this.callOpenAI(systemPrompt, prompt);
    } else if (this.config.provider === 'anthropic') {
      return await this.callClaude(systemPrompt, prompt);
    } else {
      // Fallback to Gemini
      return await this.callGemini(prompt);
    }
  }

  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2 // Lower temperature for more consistent financial analysis
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async callGemini(_prompt: string): Promise<string> {
    // Fallback to existing Gemini implementation
    throw new Error('Gemini fallback not implemented');
  }

  private getSystemPrompt(type: string): string {
    const basePrompt = `You are an expert quantitative trading analyst with 20+ years of experience in financial markets, algorithmic trading, and risk management. You have deep expertise in:

- Technical analysis and chart patterns
- Fundamental analysis and market microstructure
- Risk management and portfolio optimization
- Market psychology and behavioral finance
- Cryptocurrency and traditional financial markets

Always provide realistic, conservative analysis. Never provide financial advice - only educational analysis.`;

    switch (type) {
      case 'market_analysis':
        return `${basePrompt}

Your task is to analyze market conditions and provide comprehensive market analysis. Always respond with valid JSON format containing sentiment, trend, volatility assessment, and key price levels.`;

      case 'trading_signal':
        return `${basePrompt}

Your task is to generate trading signals based on market data and technical analysis. Provide realistic confidence scores and always include proper risk management levels. Respond in JSON format.`;

      case 'market_opportunities':
        return `${basePrompt}

Your task is to identify potential market opportunities based on user investment profiles. Focus on realistic opportunities with proper risk-reward ratios. Respond in JSON format.`;

      case 'trade_analysis':
        return `${basePrompt}

Your task is to analyze trading performance and provide constructive feedback. Identify patterns, strengths, weaknesses, and improvement opportunities. Respond in JSON format.`;

      case 'risk_assessment':
        return `${basePrompt}

Your task is to assess portfolio risk and provide risk management recommendations. Consider correlation, volatility, and market conditions. Respond in JSON format.`;

      default:
        return basePrompt;
    }
  }

  private createMarketAnalysisPrompt(symbol: string, timeframe: string, marketData?: TickerData): string {
    return `Analyze the market conditions for ${symbol} on ${timeframe} timeframe.

${marketData ? `Current market data:
- Price: $${marketData.price}
- 24h Change: ${marketData.changePercent24h}%
- Volume: ${marketData.volume24h}
- High: $${marketData.high24h}
- Low: $${marketData.low24h}` : ''}

Provide analysis in this JSON format:
{
  "sentiment": "bullish|bearish|neutral",
  "volatility": "low|medium|high",
  "trend": "strong_up|weak_up|sideways|weak_down|strong_down",
  "momentum": <number between -1 and 1>,
  "keyLevels": {
    "support": [<array of support levels>],
    "resistance": [<array of resistance levels>]
  },
  "newsImpact": "positive|negative|neutral",
  "recommendation": "<brief recommendation>"
}`;
  }

  private createTradingSignalPrompt(symbol: string, marketData: TickerData, riskTolerance: string): string {
    return `Generate a trading signal for ${symbol} based on current market conditions.

Current market data:
- Price: $${marketData.price}
- 24h Change: ${marketData.changePercent24h}%
- Volume: ${marketData.volume24h}
- High: $${marketData.high24h}
- Low: $${marketData.low24h}

User risk tolerance: ${riskTolerance}

Provide signal in this JSON format:
{
  "signal": "BUY|SELL|HOLD",
  "confidence": <number between 0 and 1>,
  "reasoning": "<explanation>",
  "technicalIndicators": {
    "rsi": <number>,
    "macd": "bullish|bearish|neutral",
    "trend": "up|down|sideways",
    "support": <number>,
    "resistance": <number>
  },
  "riskLevel": "low|medium|high",
  "timeframe": "<recommended timeframe>",
  "entryPrice": <number>,
  "stopLoss": <number>,
  "takeProfit": <number>
}`;
  }

  private createOpportunityPrompt(profile: string, budget: number, timeHorizon: string): string {
    return `Find market opportunities based on:
- Investment profile: ${profile}
- Budget: $${budget}
- Time horizon: ${timeHorizon}

Identify 3-5 realistic opportunities with proper risk-reward analysis.`;
  }

  private createTradeAnalysisPrompt(trades: Trade[]): string {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.profit.percent > 0).length;
    const winRate = (winningTrades / totalTrades) * 100;
    const avgProfit = trades.reduce((sum, t) => sum + t.profit.percent, 0) / totalTrades;

    return `Analyze trading performance based on ${totalTrades} trades:
- Win rate: ${winRate.toFixed(1)}%
- Average profit: ${avgProfit.toFixed(2)}%

Provide analysis and recommendations for improvement.`;
  }

  private createRiskAssessmentPrompt(portfolio: any[], marketConditions: any): string {
    return `Assess portfolio risk based on current holdings and market conditions.
Portfolio size: ${portfolio.length} positions
Market conditions: ${JSON.stringify(marketConditions)}

Provide comprehensive risk assessment with recommendations.`;
  }

  // Parser methods
  private parseMarketAnalysis(response: string): MarketAnalysis {
    try {
      return JSON.parse(response);
    } catch {
      return this.getFallbackMarketAnalysis('');
    }
  }

  private parseTradingSignal(response: string): TradingSignal {
    try {
      return JSON.parse(response);
    } catch {
      return this.getFallbackTradingSignal('', {} as TickerData);
    }
  }

  private parseMarketOpportunities(response: string): MarketOpportunity[] {
    try {
      return JSON.parse(response);
    } catch {
      return this.getFallbackOpportunities();
    }
  }

  private parseTradeAnalysis(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      return this.getFallbackTradeAnalysis();
    }
  }

  private parseRiskAssessment(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      return this.getFallbackRiskAssessment();
    }
  }

  // Fallback methods
  private getFallbackMarketAnalysis(_symbol: string): MarketAnalysis {
    return {
      sentiment: 'neutral',
      volatility: 'medium',
      trend: 'sideways',
      momentum: 0,
      keyLevels: { support: [], resistance: [] },
      newsImpact: 'neutral',
      recommendation: 'Monitor market conditions before making trading decisions.'
    };
  }

  private getFallbackTradingSignal(_symbol: string, marketData: TickerData): TradingSignal {
    return {
      signal: 'HOLD',
      confidence: 0.5,
      reasoning: 'Insufficient data for reliable signal generation',
      technicalIndicators: {
        rsi: 50,
        macd: 'neutral',
        trend: 'sideways',
        support: marketData.low24h || 0,
        resistance: marketData.high24h || 0
      },
      riskLevel: 'medium',
      timeframe: '4h'
    };
  }

  private getFallbackOpportunities(): MarketOpportunity[] {
    return [
      {
        symbol: 'BTC/USDT',
        rationale: 'Established cryptocurrency with strong market position',
        type: 'Crypto',
        keyMetrics: {
          volatility: 'Medium',
          trend: 'Sideways'
        }
      }
    ];
  }

  private getFallbackTradeAnalysis(): {
    overallPerformance: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    riskAssessment: string;
  } {
    return {
      overallPerformance: "AI analysis unavailable - using fallback analysis",
      strengths: ["Historical data available for review"],
      weaknesses: ["Limited AI insight available"],
      recommendations: ["Consider manual review of trade performance", "Review risk management strategies"],
      riskAssessment: "Risk assessment unavailable - manual review recommended"
    };
  }

  private getFallbackRiskAssessment(): {
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'very_high';
    diversificationScore: number;
    recommendations: string[];
    hedgingStrategies: string[];
  } {
    return {
      riskScore: 50,
      riskLevel: 'medium',
      diversificationScore: 50,
      recommendations: ["Manual risk assessment required", "Review portfolio allocation"],
      hedgingStrategies: ["Consider standard hedging practices", "Review position sizing"]
    };
  }
}

export default AdvancedAITradingService;
