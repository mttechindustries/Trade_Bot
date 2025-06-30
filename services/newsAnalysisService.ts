import { NewsEvent, MarketSentiment, NewsImpactAnalysis } from '../types';

interface NewsSource {
  url: string;
  apiKey?: string;
  name: string;
}

class NewsAnalysisService {
  private static instance: NewsAnalysisService;
  private newsSources: NewsSource[] = [
    {
      url: 'https://newsapi.org/v2/everything',
      apiKey: import.meta.env?.VITE_NEWS_API_KEY,
      name: 'NewsAPI'
    },
    {
      url: 'https://cryptopanic.com/api/v1/posts/',
      apiKey: import.meta.env?.VITE_CRYPTO_PANIC_API_KEY,
      name: 'CryptoPanic'
    }
  ];

  private constructor() {}

  static getInstance(): NewsAnalysisService {
    if (!NewsAnalysisService.instance) {
      NewsAnalysisService.instance = new NewsAnalysisService();
    }
    return NewsAnalysisService.instance;
  }

  async fetchCryptoNews(symbols: string[] = []): Promise<NewsEvent[]> {
    try {
      const newsEvents: NewsEvent[] = [];
      
      // Fetch from CryptoPanic API
      const cryptoPanicApiKey = this.newsSources[1].apiKey;
      if (cryptoPanicApiKey) {
        const response = await fetch(
          `https://cryptopanic.com/api/v1/posts/?auth_token=${cryptoPanicApiKey}&kind=news&filter=hot`
        );
        const data = await response.json();
        
        if (data.results) {
          newsEvents.push(...data.results.map((item: any) => ({
            id: item.id.toString(),
            title: item.title,
            summary: item.title, // CryptoPanic doesn't provide summary
            source: item.source?.title || 'CryptoPanic',
            publishedAt: new Date(item.published_at),
            sentiment: this.analyzeSentiment(item.title),
            relevantSymbols: this.extractSymbols(item.title, symbols),
            impact: this.estimateImpact(item.title),
            url: item.url
          })));
        }
      }

      // Fetch from NewsAPI for traditional finance
      const newsApiKey = this.newsSources[0].apiKey;
      if (newsApiKey) {
        const query = symbols.length > 0 ? symbols.join(' OR ') : 'cryptocurrency bitcoin ethereum';
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=20&apiKey=${newsApiKey}`
        );
        const data = await response.json();
        
        if (data.articles) {
          newsEvents.push(...data.articles.map((article: any) => ({
            id: article.url,
            title: article.title,
            summary: article.description || article.title,
            source: article.source?.name || 'NewsAPI',
            publishedAt: new Date(article.publishedAt),
            sentiment: this.analyzeSentiment(article.title + ' ' + (article.description || '')),
            relevantSymbols: this.extractSymbols(article.title + ' ' + (article.description || ''), symbols),
            impact: this.estimateImpact(article.title + ' ' + (article.description || '')),
            url: article.url
          })));
        }
      }

      // Sort by published date (newest first)
      return newsEvents
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, 50); // Limit to 50 most recent

    } catch (error) {
      console.error('Error fetching crypto news:', error);
      // Fetch real news data instead of mock data
      return await this.fetchRealNews();
    }
  }

  async analyzeNewsImpact(symbols: string[]): Promise<NewsImpactAnalysis> {
    const news = await this.fetchCryptoNews(symbols);
    
    const bullishNews = news.filter(n => n.sentiment === 'bullish').length;
    const bearishNews = news.filter(n => n.sentiment === 'bearish').length;
    const neutralNews = news.filter(n => n.sentiment === 'neutral').length;
    
    const overallSentiment: MarketSentiment = 
      bullishNews > bearishNews * 1.5 ? 'bullish' :
      bearishNews > bullishNews * 1.5 ? 'bearish' : 'neutral';

    const highImpactEvents = news.filter(n => n.impact === 'high');
    const mediumImpactEvents = news.filter(n => n.impact === 'medium');

    return {
      overallSentiment,
      sentimentScore: (bullishNews - bearishNews) / Math.max(news.length, 1),
      newsCount: news.length,
      bullishCount: bullishNews,
      bearishCount: bearishNews,
      neutralCount: neutralNews,
      highImpactEvents: highImpactEvents.slice(0, 5),
      keyEvents: [...highImpactEvents, ...mediumImpactEvents].slice(0, 10),
      lastUpdated: new Date()
    };
  }

  private analyzeSentiment(text: string): MarketSentiment {
    const lowerText = text.toLowerCase();
    
    const bullishKeywords = [
      'bullish', 'rise', 'surge', 'rally', 'pump', 'moon', 'gains', 'profit',
      'adoption', 'breakthrough', 'partnership', 'positive', 'growth', 'soar',
      'breakout', 'all-time high', 'ath', 'institutional', 'upgrade'
    ];
    
    const bearishKeywords = [
      'bearish', 'fall', 'crash', 'dump', 'decline', 'drop', 'loss', 'sell-off',
      'regulation', 'ban', 'hack', 'scam', 'negative', 'warning', 'risk',
      'correction', 'liquidation', 'fear', 'uncertainty', 'debt'
    ];

    const bullishScore = bullishKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const bearishScore = bearishKeywords.filter(keyword => lowerText.includes(keyword)).length;

    if (bullishScore > bearishScore) return 'bullish';
    if (bearishScore > bullishScore) return 'bearish';
    return 'neutral';
  }

  private extractSymbols(text: string, watchedSymbols: string[]): string[] {
    const lowerText = text.toLowerCase();
    const found: string[] = [];

    // Check for watched symbols
    watchedSymbols.forEach(symbol => {
      const cleanSymbol = symbol.replace(/[\/\-]/g, '').toLowerCase();
      if (lowerText.includes(cleanSymbol) || lowerText.includes(symbol.toLowerCase())) {
        found.push(symbol);
      }
    });

    // Check for common crypto symbols
    const commonSymbols = ['BTC', 'ETH', 'ADA', 'SOL', 'MATIC', 'DOT', 'LINK', 'UNI'];
    commonSymbols.forEach(symbol => {
      if (lowerText.includes(symbol.toLowerCase()) && !found.includes(symbol)) {
        found.push(symbol);
      }
    });

    return found;
  }

  private estimateImpact(text: string): 'low' | 'medium' | 'high' {
    const lowerText = text.toLowerCase();
    
    const highImpactKeywords = [
      'regulation', 'ban', 'sec', 'fed', 'central bank', 'institutional',
      'etf', 'adoption', 'partnership', 'major', 'breakthrough', 'hack',
      'all-time high', 'crash', 'halving', 'upgrade', 'fork'
    ];

    const mediumImpactKeywords = [
      'trend', 'analysis', 'prediction', 'technical', 'support', 'resistance',
      'whale', 'volume', 'market cap', 'price target'
    ];

    const highCount = highImpactKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const mediumCount = mediumImpactKeywords.filter(keyword => lowerText.includes(keyword)).length;

    if (highCount > 0) return 'high';
    if (mediumCount > 0) return 'medium';
    return 'low';
  }

  private async fetchRealNews(): Promise<NewsEvent[]> {
    try {
      // Use real news API - CoinDesk API for crypto news
      const response = await fetch('https://api.coindesk.com/v1/news.json');
      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.articles?.slice(0, 10).map((article: any, index: number) => ({
        id: `news-${index}`,
        title: article.title || 'Market Update',
        summary: article.description || article.content?.substring(0, 200) || 'News summary not available',
        source: 'CoinDesk',
        publishedAt: new Date(article.publishedAt || Date.now()),
        sentiment: this.analyzeSentimentFromText(article.title + ' ' + article.description),
        relevantSymbols: this.extractSymbolsFromText(article.title + ' ' + article.description),
        impact: 'medium' as const,
        url: article.url || '#'
      })) || [];
    } catch (error) {
      console.error('Failed to fetch real news data:', error);
      throw new Error('News service unavailable - real-time news data could not be retrieved');
    }
  }

  private analyzeSentimentFromText(text: string): 'bullish' | 'bearish' | 'neutral' {
    const bullishWords = ['surge', 'rise', 'bull', 'positive', 'growth', 'gain', 'up', 'higher'];
    const bearishWords = ['fall', 'drop', 'bear', 'negative', 'crash', 'decline', 'down', 'lower'];
    
    const lowerText = text.toLowerCase();
    const bullishCount = bullishWords.filter(word => lowerText.includes(word)).length;
    const bearishCount = bearishWords.filter(word => lowerText.includes(word)).length;
    
    if (bullishCount > bearishCount) return 'bullish';
    if (bearishCount > bullishCount) return 'bearish';
    return 'neutral';
  }

  private extractSymbolsFromText(text: string): string[] {
    const cryptoSymbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'DOT/USDT'];
    const lowerText = text.toLowerCase();
    
    return cryptoSymbols.filter(symbol => {
      const baseCurrency = symbol.split('/')[0].toLowerCase();
      return lowerText.includes(baseCurrency) || 
             (lowerText.includes('bitcoin') && baseCurrency === 'btc') || 
             (lowerText.includes('ethereum') && baseCurrency === 'eth');
    });
  }
}

export default NewsAnalysisService;
