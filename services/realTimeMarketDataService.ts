import { TickerData, CandlestickData } from '../types';

interface ExchangeConfig {
  name: string;
  restApiBase: string;
  websocketBase: string;
  rateLimitPerSecond: number;
}

interface MarketDataCache {
  data: TickerData;
  lastUpdate: number;
  ttl: number;
}

class RealTimeMarketDataService {
  private static instance: RealTimeMarketDataService;
  private cache: Map<string, MarketDataCache> = new Map();
  private websockets: Map<string, WebSocket> = new Map();
  private subscribers: Map<string, Set<(data: TickerData) => void>> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private readonly CACHE_TTL = 1000; // 1 second cache TTL
  
  private exchanges: Record<string, ExchangeConfig> = {
    binance: {
      name: 'Binance',
      restApiBase: import.meta.env.DEV ? '/api/binance' : 'https://api.binance.com/api/v3',
      websocketBase: 'wss://stream.binance.com:9443/ws',
      rateLimitPerSecond: 10
    },
    coinbase: {
      name: 'Coinbase Pro',
      restApiBase: import.meta.env.DEV ? '/api/coinbase' : 'https://api.exchange.coinbase.com',
      websocketBase: 'wss://ws-feed.exchange.coinbase.com',
      rateLimitPerSecond: 10
    },
    kraken: {
      name: 'Kraken',
      restApiBase: 'https://api.kraken.com/0/public',
      websocketBase: 'wss://ws.kraken.com',
      rateLimitPerSecond: 1
    }
  };

  private constructor() {
    // Clean up cache every 30 seconds
    setInterval(() => this.cleanupCache(), 30000);
    // Reset rate limit counters every second
    setInterval(() => this.resetRateLimits(), 1000);
  }

  static getInstance(): RealTimeMarketDataService {
    if (!RealTimeMarketDataService.instance) {
      RealTimeMarketDataService.instance = new RealTimeMarketDataService();
    }
    return RealTimeMarketDataService.instance;
  }

  /**
   * Get real-time ticker data with automatic failover between exchanges
   */
  async getRealTimeTickerData(symbols: string[]): Promise<TickerData[]> {
    const results: TickerData[] = [];
    
    for (const symbol of symbols) {
      try {
        const ticker = await this.getTickerWithCache(symbol);
        results.push(ticker);
      } catch (error) {
        console.error(`Failed to get ticker for ${symbol}:`, error);
        // Try to get cached data
        const cached = this.getCachedTicker(symbol);
        if (cached) {
          results.push(cached);
        }
      }
    }
    
    return results;
  }

  /**
   * Get ticker data from multiple exchanges with caching and error handling
   */
  async getTickerData(symbols: string[]): Promise<TickerData[]> {
    try {
      const results = await this.getRealTimeTickerData(symbols);
      
      // Log successful data retrieval
      console.log(`✅ Retrieved REAL ticker data for ${symbols.length} symbols:`, 
                  symbols.map(s => s.split('/')[0]).join(', '));
      
      return results;
    } catch (error) {
      console.error(`❌ FAILED to get REAL ticker data for: ${symbols.join(', ')}`, error);
      
      // NO FALLBACK DATA - throw error to force proper error handling
      throw new Error(`Real-time market data unavailable for ${symbols.join(', ')}. Please check your internet connection and try again.`);
    }
  }

  /**
   * Get ticker with cache and exchange failover
   */
  private async getTickerWithCache(symbol: string): Promise<TickerData> {
    const cacheKey = `ticker_${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && (Date.now() - cached.lastUpdate) < this.CACHE_TTL) {
      return cached.data;
    }

    // Try exchanges in order of preference
    const exchanges = ['binance', 'coinbase', 'kraken'];
    
    for (const exchangeName of exchanges) {
      try {
        if (this.canMakeRequest(exchangeName)) {
          const ticker = await this.fetchTickerFromExchange(symbol, exchangeName);
          
          // Cache the result
          this.cache.set(cacheKey, {
            data: ticker,
            lastUpdate: Date.now(),
            ttl: this.CACHE_TTL
          });
          
          this.incrementRequestCount(exchangeName);
          return ticker;
        }
      } catch (error) {
        console.warn(`Failed to fetch ${symbol} from ${exchangeName}:`, error);
        continue;
      }
    }
    
    throw new Error(`Failed to fetch ticker data for ${symbol} from all exchanges`);
  }

  /**
   * Fetch ticker from specific exchange
   */
  private async fetchTickerFromExchange(symbol: string, exchangeName: string): Promise<TickerData> {
    const exchange = this.exchanges[exchangeName];
    
    switch (exchangeName) {
      case 'binance':
        return this.fetchBinanceTicker(symbol, exchange);
      case 'coinbase':
        return this.fetchCoinbaseTicker(symbol, exchange);
      case 'kraken':
        return this.fetchKrakenTicker(symbol, exchange);
      default:
        throw new Error(`Unknown exchange: ${exchangeName}`);
    }
  }

  /**
   * Fetch ticker from Binance
   */
  private async fetchBinanceTicker(symbol: string, exchange: ExchangeConfig): Promise<TickerData> {
    const binanceSymbol = symbol.replace('/', '');
    const url = `${exchange.restApiBase}/ticker/24hr?symbol=${binanceSymbol}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      symbol: this.formatSymbol(data.symbol),
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChange),
      changePercent24h: parseFloat(data.priceChangePercent),
      volume24h: parseFloat(data.volume),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      bid: parseFloat(data.bidPrice),
      ask: parseFloat(data.askPrice),
      timestamp: Date.now(),
      lastUpdate: Date.now()
    };
  }

  /**
   * Fetch ticker from Coinbase Pro
   */
  private async fetchCoinbaseTicker(symbol: string, exchange: ExchangeConfig): Promise<TickerData> {
    const coinbaseSymbol = symbol.replace('/', '-');
    const [tickerUrl, statsUrl] = [
      `${exchange.restApiBase}/products/${coinbaseSymbol}/ticker`,
      `${exchange.restApiBase}/products/${coinbaseSymbol}/stats`
    ];
    
    const [tickerResponse, statsResponse] = await Promise.all([
      fetch(tickerUrl),
      fetch(statsUrl)
    ]);
    
    if (!tickerResponse.ok || !statsResponse.ok) {
      throw new Error(`Coinbase API error: ${tickerResponse.status} or ${statsResponse.status}`);
    }
    
    const [ticker, stats] = await Promise.all([
      tickerResponse.json(),
      statsResponse.json()
    ]);
    
    const price = parseFloat(ticker.price);
    const change24h = parseFloat(stats.last) - parseFloat(stats.open);
    
    return {
      symbol,
      price,
      change24h,
      changePercent24h: (change24h / parseFloat(stats.open)) * 100,
      volume24h: parseFloat(stats.volume),
      high24h: parseFloat(stats.high),
      low24h: parseFloat(stats.low),
      bid: parseFloat(ticker.bid),
      ask: parseFloat(ticker.ask),
      timestamp: Date.now(),
      lastUpdate: Date.now()
    };
  }

  /**
   * Fetch ticker from Kraken
   */
  private async fetchKrakenTicker(symbol: string, exchange: ExchangeConfig): Promise<TickerData> {
    // Kraken uses different symbol format
    const krakenSymbol = this.toKrakenSymbol(symbol);
    const url = `${exchange.restApiBase}/Ticker?pair=${krakenSymbol}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Kraken API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error && data.error.length > 0) {
      throw new Error(`Kraken API error: ${data.error.join(', ')}`);
    }
    
    const tickerData = data.result[Object.keys(data.result)[0]];
    const price = parseFloat(tickerData.c[0]);
    const high24h = parseFloat(tickerData.h[1]);
    const low24h = parseFloat(tickerData.l[1]);
    const volume24h = parseFloat(tickerData.v[1]);
    
    return {
      symbol,
      price,
      change24h: 0, // Kraken doesn't provide direct 24h change
      changePercent24h: 0,
      volume24h,
      high24h,
      low24h,
      bid: parseFloat(tickerData.b[0]),
      ask: parseFloat(tickerData.a[0]),
      timestamp: Date.now(),
      lastUpdate: Date.now()
    };
  }

  /**
   * Get historical candlestick data
   */
  async getCandlestickData(
    symbol: string,
    interval: string = '1h',
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
      return await this.fetchBinanceCandlesticks(symbol, interval, limit);
    } catch (error) {
      console.error('Error fetching candlestick data:', error);
      try {
        return await this.fetchCoinbaseCandlesticks(symbol, interval, limit);
      } catch (fallbackError) {
        throw new Error('Failed to fetch candlestick data from all exchanges');
      }
    }
  }

  /**
   * Fetch candlesticks from Binance
   */
  private async fetchBinanceCandlesticks(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<CandlestickData[]> {
    const binanceSymbol = symbol.replace('/', '');
    const url = `${this.exchanges.binance.restApiBase}/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance klines API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.map((kline: any[]) => ({
      symbol,
      timestamp: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5])
    }));
  }

  /**
   * Fetch candlesticks from Coinbase
   */
  private async fetchCoinbaseCandlesticks(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<CandlestickData[]> {
    const coinbaseSymbol = symbol.replace('/', '-');
    const granularity = this.coinbaseIntervalToGranularity(interval);
    const end = Math.floor(Date.now() / 1000);
    const start = end - (granularity * limit);
    
    const url = `${this.exchanges.coinbase.restApiBase}/products/${coinbaseSymbol}/candles?start=${start}&end=${end}&granularity=${granularity}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Coinbase candles API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.map((candle: number[]) => ({
      symbol,
      timestamp: candle[0] * 1000,
      low: candle[1],
      high: candle[2],
      open: candle[3],
      close: candle[4],
      volume: candle[5]
    })).reverse(); // Coinbase returns newest first
  }

  /**
   * Subscribe to real-time WebSocket updates
   */
  subscribeToRealTime(symbols: string[], callback: (data: TickerData) => void): () => void {
    return this.subscribeToRealTimeUpdates(symbols, callback);
  }

  subscribeToRealTimeUpdates(symbols: string[], callback: (data: TickerData) => void): () => void {
    const unsubscribeFunctions: (() => void)[] = [];
    
    symbols.forEach(symbol => {
      const key = `ws_${symbol}`;
      
      if (!this.subscribers.has(key)) {
        this.subscribers.set(key, new Set());
      }
      
      this.subscribers.get(key)!.add(callback);
      
      // Create WebSocket connection if not exists
      if (!this.websockets.has(key)) {
        this.createWebSocketConnection(symbol);
      }
      
      unsubscribeFunctions.push(() => {
        this.subscribers.get(key)?.delete(callback);
        if (this.subscribers.get(key)?.size === 0) {
          this.closeWebSocketConnection(key);
        }
      });
    });
    
    // Return combined unsubscribe function
    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }

  /**
   * Create WebSocket connection for real-time updates
   */
  private createWebSocketConnection(symbol: string): void {
    const key = `ws_${symbol}`;
    const binanceSymbol = symbol.replace('/', '').toLowerCase();
    const wsUrl = `${this.exchanges.binance.websocketBase}/${binanceSymbol}@ticker`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`✅ WebSocket connected for ${symbol}`);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const tickerData: TickerData = {
            symbol: this.formatSymbol(data.s),
            price: parseFloat(data.c),
            change24h: parseFloat(data.P),
            changePercent24h: parseFloat(data.P),
            volume24h: parseFloat(data.v),
            high24h: parseFloat(data.h),
            low24h: parseFloat(data.l),
            timestamp: Date.now(),
            lastUpdate: Date.now()
          };
          
          // Update cache
          this.cache.set(`ticker_${symbol}`, {
            data: tickerData,
            lastUpdate: Date.now(),
            ttl: this.CACHE_TTL
          });
          
          // Notify subscribers
          this.subscribers.get(key)?.forEach(callback => {
            try {
              callback(tickerData);
            } catch (error) {
              console.error('Error in WebSocket callback:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };
      
      ws.onclose = () => {
        console.log(`❌ WebSocket closed for ${symbol}`);
        // Attempt reconnection after 5 seconds
        setTimeout(() => {
          if (this.subscribers.get(key)?.size || 0 > 0) {
            this.createWebSocketConnection(symbol);
          }
        }, 5000);
      };
      
      ws.onerror = (error) => {
        console.error(`WebSocket error for ${symbol}:`, error);
      };
      
      this.websockets.set(key, ws);
    } catch (error) {
      console.error(`Failed to create WebSocket connection for ${symbol}:`, error);
    }
  }

  /**
   * Close WebSocket connection
   */
  private closeWebSocketConnection(key: string): void {
    const ws = this.websockets.get(key);
    if (ws) {
      ws.close();
      this.websockets.delete(key);
    }
  }

  /**
   * Get cached ticker data
   */
  private getCachedTicker(symbol: string): TickerData | null {
    const cached = this.cache.get(`ticker_${symbol}`);
    if (cached && (Date.now() - cached.lastUpdate) < 60000) { // 1 minute max stale data
      return cached.data;
    }
    return null;
  }

  /**
   * Rate limiting helpers
   */
  private canMakeRequest(exchangeName: string): boolean {
    const count = this.requestCounts.get(exchangeName) || 0;
    const limit = this.exchanges[exchangeName].rateLimitPerSecond;
    return count < limit;
  }

  private incrementRequestCount(exchangeName: string): void {
    const current = this.requestCounts.get(exchangeName) || 0;
    this.requestCounts.set(exchangeName, current + 1);
  }

  private resetRateLimits(): void {
    this.requestCounts.clear();
  }

  /**
   * Cache cleanup
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cache] of this.cache.entries()) {
      if (now - cache.lastUpdate > cache.ttl * 10) { // Remove after 10x TTL
        this.cache.delete(key);
      }
    }
  }

  /**
   * Symbol format utilities
   */
  private formatSymbol(exchangeSymbol: string): string {
    // Convert exchange-specific symbol to standard format (BASE/QUOTE)
    if (exchangeSymbol.includes('USDT')) {
      const base = exchangeSymbol.replace('USDT', '');
      return `${base}/USDT`;
    }
    if (exchangeSymbol.includes('USD') && !exchangeSymbol.includes('USDT')) {
      const base = exchangeSymbol.replace('USD', '');
      return `${base}/USD`;
    }
    return exchangeSymbol;
  }

  private toKrakenSymbol(symbol: string): string {
    // Convert standard symbol to Kraken format
    const [base, quote] = symbol.split('/');
    const krakenMap: Record<string, string> = {
      'BTC': 'XBT',
      'USDT': 'USDT',
      'USD': 'USD'
    };
    
    const krakenBase = krakenMap[base] || base;
    const krakenQuote = krakenMap[quote] || quote;
    
    return `${krakenBase}${krakenQuote}`;
  }

  private coinbaseIntervalToGranularity(interval: string): number {
    const granularityMap: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '6h': 21600,
      '1d': 86400
    };
    
    return granularityMap[interval] || 3600;
  }

  /**
   * Disconnect all WebSocket connections
   */
  disconnect(): void {
    this.websockets.forEach((ws) => {
      ws.close();
    });
    this.websockets.clear();
    this.subscribers.clear();
  }
}

export default RealTimeMarketDataService;
