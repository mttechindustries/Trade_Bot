import { TickerData, CandlestickData } from '../types';
import TradingViewService from './tradingViewService';
import DexScreenerService from './dexscreenerService';

interface MarketDataCache {
  data: TickerData;
  lastUpdate: number;
  ttl: number;
}

class RealTimeMarketDataService {
  private static instance: RealTimeMarketDataService;
  private cache: Map<string, MarketDataCache> = new Map();
  private tradingViewService: TradingViewService;
  private dexScreenerService: DexScreenerService;
  private readonly CACHE_TTL = 1000; // 1 second cache TTL

  private constructor() {
    this.tradingViewService = TradingViewService.getInstance();
    this.dexScreenerService = DexScreenerService.getInstance();
    setInterval(() => this.cleanupCache(), 30000);
  }

  static getInstance(): RealTimeMarketDataService {
    if (!RealTimeMarketDataService.instance) {
      RealTimeMarketDataService.instance = new RealTimeMarketDataService();
    }
    return RealTimeMarketDataService.instance;
  }

  async getRealTimeTickerData(symbols: string[]): Promise<TickerData[]> {
    const results: TickerData[] = [];

    for (const symbol of symbols) {
      try {
        const ticker = await this.getTickerWithCache(symbol);
        if(ticker) {
            results.push(ticker);
        }
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

  async getCandlestickData(
    symbol: string,
    interval: string = '1h',
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
        return await this.tradingViewService.getCandlestickData(symbol, interval, limit);
    } catch (error) {
        console.error('Error fetching candlestick data:', error);
        throw new Error('Failed to fetch candlestick data from all exchanges');
    }
  }


  private async getTickerWithCache(symbol: string): Promise<TickerData | null> {
    const cacheKey = `ticker_${symbol}`;
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.lastUpdate) < this.CACHE_TTL) {
      return cached.data;
    }

    try {
        let ticker: TickerData | null = null;
        if (symbol.includes('/')) { // TradingView format
            ticker = await this.tradingViewService.getTickerData(symbol);
        } else { // Assume it's a pair address for DexScreener
            ticker = await this.dexScreenerService.getTickerData(symbol);
        }

        if(ticker) {
            this.cache.set(cacheKey, {
              data: ticker,
              lastUpdate: Date.now(),
              ttl: this.CACHE_TTL
            });
            return ticker;
        }
        return null;

    } catch (error) {
        console.warn(`Failed to fetch ${symbol}:`, error);
        throw new Error(`Failed to fetch ticker data for ${symbol}`);
    }
  }

  private getCachedTicker(symbol: string): TickerData | null {
    const cached = this.cache.get(`ticker_${symbol}`);
    if (cached && (Date.now() - cached.lastUpdate) < 60000) { // 1 minute max stale data
      return cached.data;
    }
    return null;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cache] of this.cache.entries()) {
      if (now - cache.lastUpdate > cache.ttl * 10) { // Remove after 10x TTL
        this.cache.delete(key);
      }
    }
  }
}

export default RealTimeMarketDataService;
