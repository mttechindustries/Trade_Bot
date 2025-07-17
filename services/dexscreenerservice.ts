import { TickerData, CandlestickData } from '../types';

const API_BASE_URL = 'https://api.dexscreener.com/latest/dex';

class DexScreenerService {
  private static instance: DexScreenerService;

  public static getInstance(): DexScreenerService {
    if (!DexScreenerService.instance) {
      DexScreenerService.instance = new DexScreenerService();
    }
    return DexScreenerService.instance;
  }

  public async getTickerData(pairAddress: string): Promise<TickerData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/pairs/bsc/${pairAddress}`);
      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.pair) {
        return null;
      }
      const pair = data.pair;
      return {
        symbol: `${pair.baseToken.symbol}/${pair.quoteToken.symbol}`,
        price: parseFloat(pair.priceUsd),
        change24h: pair.priceChange.h24,
        changePercent24h: pair.priceChange.h24,
        volume24h: pair.volume.h24,
        high24h: 0, // DexScreener API doesn't provide this in the pair endpoint
        low24h: 0, // DexScreener API doesn't provide this in the pair endpoint
        timestamp: new Date().getTime(),
        lastUpdate: new Date(pair.pairCreatedAt).getTime(),
      };
    } catch (error) {
      console.error('Error fetching data from DexScreener:', error);
      return null;
    }
  }

  public async searchPairs(query: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/search?q=${query}`);
    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.statusText}`);
    }
    return response.json();
  }
}

export default DexScreenerService;
