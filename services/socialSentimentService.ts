export interface SocialSentiment {
  platform: 'twitter' | 'reddit' | 'telegram' | 'discord';
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number; // -1 to 1
  volume: number; // Number of mentions
  timestamp: number;
  keywords: string[];
  influencerMentions: number;
}

export interface SocialTrend {
  symbol: string;
  trendingScore: number;
  sentimentShift: number;
  volumeChange: number;
  riskLevel: 'low' | 'medium' | 'high';
  actionRecommendation: 'buy' | 'sell' | 'hold' | 'monitor';
}

export interface InfluencerSignal {
  influencer: string;
  platform: string;
  signal: 'buy' | 'sell' | 'bullish' | 'bearish';
  reliability: number; // 0 to 1 based on historical accuracy
  timestamp: number;
  symbol: string;
  impact: number;
}

class SocialSentimentService {
  private static instance: SocialSentimentService;
  private readonly API_BASE = 'https://api.lunarcrush.com/v2';
  private readonly REDDIT_API = 'https://api.reddit.com';
  private readonly TWITTER_API = 'https://api.twitter.com/2';

  private constructor() {}

  static getInstance(): SocialSentimentService {
    if (!SocialSentimentService.instance) {
      SocialSentimentService.instance = new SocialSentimentService();
    }
    return SocialSentimentService.instance;
  }

  async getSocialSentiment(symbol: string): Promise<SocialSentiment[]> {
    try {
      // Mock implementation - in production, integrate with real APIs
      const platforms = ['twitter', 'reddit', 'telegram', 'discord'] as const;
      
      return platforms.map(platform => ({
        platform,
        symbol,
        sentiment: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral',
        score: (Math.random() - 0.5) * 2, // -1 to 1
        volume: Math.floor(Math.random() * 10000) + 1000,
        timestamp: Date.now(),
        keywords: this.generateKeywords(symbol),
        influencerMentions: Math.floor(Math.random() * 50)
      }));
    } catch (error) {
      console.error('Error fetching social sentiment:', error);
      return [];
    }
  }

  async getTrendingTokens(): Promise<SocialTrend[]> {
    try {
      // Mock trending analysis
      const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK', 'UNI', 'AAVE'];
      
      return symbols.map(symbol => ({
        symbol,
        trendingScore: Math.random() * 100,
        sentimentShift: (Math.random() - 0.5) * 20,
        volumeChange: (Math.random() - 0.5) * 100,
        riskLevel: (Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        actionRecommendation: this.getActionRecommendation()
      })).sort((a, b) => b.trendingScore - a.trendingScore);
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      return [];
    }
  }

  async getInfluencerSignals(symbol?: string): Promise<InfluencerSignal[]> {
    try {
      const influencers = [
        'ElonMusk', 'VitalikButerin', 'aantonop', 'CoinbaseV', 'binance',
        'saylor', 'cz_binance', 'naval', 'balajis'
      ];
      
      const symbols = symbol ? [symbol] : ['BTC', 'ETH', 'SOL', 'ADA'];
      
      return influencers.slice(0, 5).map(influencer => ({
        influencer,
        platform: Math.random() > 0.5 ? 'twitter' : 'telegram',
        signal: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'buy',
        reliability: 0.6 + Math.random() * 0.4, // 0.6 to 1.0
        timestamp: Date.now() - Math.random() * 86400000, // Last 24 hours
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        impact: Math.random() * 10 + 1
      }));
    } catch (error) {
      console.error('Error fetching influencer signals:', error);
      return [];
    }
  }

  async analyzeSentimentImpact(symbol: string): Promise<{
    predictedPriceImpact: number;
    confidence: number;
    timeframe: string;
    signals: string[];
  }> {
    try {
      const sentiments = await this.getSocialSentiment(symbol);
      const avgSentiment = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
      const totalVolume = sentiments.reduce((sum, s) => sum + s.volume, 0);
      
      return {
        predictedPriceImpact: avgSentiment * 5 + (totalVolume / 10000) * 2, // Percentage
        confidence: Math.min(0.95, 0.5 + Math.abs(avgSentiment) * 0.3 + (totalVolume / 50000)),
        timeframe: '4-12 hours',
        signals: [
          `Average sentiment: ${avgSentiment > 0 ? 'Positive' : avgSentiment < 0 ? 'Negative' : 'Neutral'}`,
          `Social volume: ${totalVolume > 5000 ? 'High' : totalVolume > 2000 ? 'Medium' : 'Low'}`,
          `Influencer activity: ${sentiments.reduce((sum, s) => sum + s.influencerMentions, 0) > 10 ? 'Active' : 'Low'}`
        ]
      };
    } catch (error) {
      console.error('Error analyzing sentiment impact:', error);
      return {
        predictedPriceImpact: 0,
        confidence: 0,
        timeframe: 'Unknown',
        signals: []
      };
    }
  }

  private generateKeywords(symbol: string): string[] {
    const baseKeywords = [symbol, `$${symbol}`, symbol.toLowerCase()];
    const contextKeywords = [
      'bullish', 'bearish', 'moon', 'dip', 'hodl', 'buy', 'sell',
      'rally', 'breakout', 'resistance', 'support', 'pump', 'dump'
    ];
    
    return [
      ...baseKeywords,
      ...contextKeywords.slice(0, Math.floor(Math.random() * 5) + 3)
    ];
  }

  private getActionRecommendation(): 'buy' | 'sell' | 'hold' | 'monitor' {
    const rand = Math.random();
    if (rand > 0.7) return 'buy';
    if (rand > 0.5) return 'hold';
    if (rand > 0.3) return 'monitor';
    return 'sell';
  }

  // Real-time sentiment monitoring
  startSentimentMonitoring(symbol: string, callback: (sentiment: SocialSentiment) => void): () => void {
    const interval = setInterval(async () => {
      const sentiments = await this.getSocialSentiment(symbol);
      if (sentiments.length > 0) {
        callback(sentiments[0]); // Send the most recent sentiment
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }

  // Fear & Greed Index based on social sentiment
  async getFearGreedIndex(): Promise<{
    value: number;
    classification: string;
    factors: { [key: string]: number };
  }> {
    try {
      const btcSentiment = await this.getSocialSentiment('BTC');
      const trendingTokens = await this.getTrendingTokens();
      
      const sentimentScore = btcSentiment.reduce((sum, s) => sum + s.score, 0) / btcSentiment.length;
      const trendingScore = trendingTokens.slice(0, 5).reduce((sum, t) => sum + t.trendingScore, 0) / 5;
      
      const factors = {
        'Social Volume': Math.min(100, btcSentiment.reduce((sum, s) => sum + s.volume, 0) / 1000),
        'Sentiment Score': (sentimentScore + 1) * 50, // Convert -1,1 to 0,100
        'Trending Activity': trendingScore,
        'Influencer Activity': Math.min(100, btcSentiment.reduce((sum, s) => sum + s.influencerMentions, 0) * 2)
      };
      
      const value = Object.values(factors).reduce((sum, v) => sum + v, 0) / Object.keys(factors).length;
      
      let classification: string;
      if (value >= 75) classification = 'Extreme Greed';
      else if (value >= 55) classification = 'Greed';
      else if (value >= 45) classification = 'Neutral';
      else if (value >= 25) classification = 'Fear';
      else classification = 'Extreme Fear';
      
      return { value, classification, factors };
    } catch (error) {
      console.error('Error calculating fear & greed index:', error);
      return {
        value: 50,
        classification: 'Neutral',
        factors: {}
      };
    }
  }
}

export default SocialSentimentService;
