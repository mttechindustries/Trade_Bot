import { TickerData, CandlestickData } from '../types';
import { TimeService } from './timeService';

interface RealTimeDataConfig {
  apiKey: string;
  baseUrl: string;
  websocketUrl?: string;
}

class RealTimeDataService {
  private static instance: RealTimeDataService;
  private config: RealTimeDataConfig;
  private websocket: WebSocket | null = null;


  private constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_BINANCE_API_KEY || '',
      baseUrl: 'https://api.binance.com/api/v3',
      websocketUrl: 'wss://stream.binance.com:9443/ws'
    };
  }

  static getInstance(): RealTimeDataService {
    if (!RealTimeDataService.instance) {
      RealTimeDataService.instance = new RealTimeDataService();
    }
    return RealTimeDataService.instance;
  }

  /**
   * Get real-time ticker data from Binance
   */
  async getRealTimeTickerData(symbols: string[]): Promise<TickerData[]> {
    try {
      const symbolsParam = symbols.map(s => `"${s.replace('/', '')}"`).join(',');
      const response = await fetch(
        `${this.config.baseUrl}/ticker/24hr?symbols=[${symbolsParam}]`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((ticker: any) => ({
        symbol: this.formatSymbol(ticker.symbol),
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChange),
        changePercent24h: parseFloat(ticker.priceChangePercent),
        volume24h: parseFloat(ticker.volume),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        timestamp: TimeService.now(),
        lastUpdate: TimeService.now()
      }));
    } catch (error) {
      console.error('Error fetching real-time ticker data:', error);
      throw new Error('Failed to fetch real-time market data');
    }
  }

  /**
   * Get candlestick/OHLCV data
   */
  async getCandlestickData(
    symbol: string, 
    interval: string = '1h', 
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
      const binanceSymbol = symbol.replace('/', '');
      const response = await fetch(
        `${this.config.baseUrl}/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((kline: any[]) => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));
    } catch (error) {
      console.error('Error fetching candlestick data:', error);
      throw new Error('Failed to fetch candlestick data');
    }
  }

  /**
   * Subscribe to real-time price updates via WebSocket
   */
  subscribeToRealTimeUpdates(symbols: string[], callback: (data: TickerData) => void): void {
    try {
      const streams = symbols.map(symbol => 
        `${symbol.replace('/', '').toLowerCase()}@ticker`
      ).join('/');

      this.websocket = new WebSocket(`${this.config.websocketUrl}/${streams}`);
      
      this.websocket.onmessage = (event) => {
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
            timestamp: TimeService.now(),
            lastUpdate: TimeService.now()
          };
          callback(tickerData);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.websocket.onclose = () => {
        console.log('WebSocket connection closed');
        // Implement reconnection logic
        setTimeout(() => {
          this.subscribeToRealTimeUpdates(symbols, callback);
        }, 5000);
      };

    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  private formatSymbol(binanceSymbol: string): string {
    // Convert BTCUSDT to BTC/USDT format
    if (binanceSymbol.includes('USDT')) {
      const base = binanceSymbol.replace('USDT', '');
      return `${base}/USDT`;
    }
    return binanceSymbol;
  }

  /**
   * Get order book data
   */
  async getOrderBook(symbol: string, limit: number = 100): Promise<any> {
    try {
      const binanceSymbol = symbol.replace('/', '');
      const response = await fetch(
        `${this.config.baseUrl}/depth?symbol=${binanceSymbol}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order book:', error);
      throw new Error('Failed to fetch order book data');
    }
  }

  /**
   * Get trading fees for a symbol
   */
  async getTradingFees(_symbol: string): Promise<{ makerFee: number; takerFee: number }> {
    try {
      // This would require authenticated API call in real implementation
      // For now, return standard Binance fees
      return {
        makerFee: 0.001, // 0.1%
        takerFee: 0.001  // 0.1%
      };
    } catch (error) {
      console.error('Error fetching trading fees:', error);
      return { makerFee: 0.001, takerFee: 0.001 };
    }
  }
}

export default RealTimeDataService;
