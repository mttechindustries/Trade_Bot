import { TickerData, OrderBookData, CandlestickData } from '../types';

class MarketDataService {
  private static instance: MarketDataService;
  private websockets: Map<string, WebSocket> = new Map();
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private constructor() {}

  static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  // Subscribe to real-time ticker data from Binance WebSocket
  subscribeToTicker(symbol: string, callback: (data: TickerData) => void): () => void {
    const key = `ticker_${symbol}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);

    // Create WebSocket connection if it doesn't exist
    if (!this.websockets.has(key)) {
      this.createTickerConnection(symbol);
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback);
      if (this.subscribers.get(key)?.size === 0) {
        this.closeConnection(key);
      }
    };
  }

  // Subscribe to order book data
  subscribeToOrderBook(symbol: string, callback: (data: OrderBookData) => void): () => void {
    const key = `orderbook_${symbol}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);

    if (!this.websockets.has(key)) {
      this.createOrderBookConnection(symbol);
    }

    return () => {
      this.subscribers.get(key)?.delete(callback);
      if (this.subscribers.get(key)?.size === 0) {
        this.closeConnection(key);
      }
    };
  }

  // Subscribe to candlestick data
  subscribeToCandlesticks(symbol: string, interval: string, callback: (data: CandlestickData) => void): () => void {
    const key = `kline_${symbol}_${interval}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);

    if (!this.websockets.has(key)) {
      this.createCandlestickConnection(symbol, interval);
    }

    return () => {
      this.subscribers.get(key)?.delete(callback);
      if (this.subscribers.get(key)?.size === 0) {
        this.closeConnection(key);
      }
    };
  }

  private createTickerConnection(symbol: string): void {
    const key = `ticker_${symbol}`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`Connected to ticker stream for ${symbol}`);
        this.reconnectAttempts.set(key, 0);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const tickerData: TickerData = {
            symbol: data.s,
            price: parseFloat(data.c),
            change24h: parseFloat(data.P),
            changePercent24h: parseFloat(data.P),
            volume24h: parseFloat(data.v),
            high24h: parseFloat(data.h),
            low24h: parseFloat(data.l),
            timestamp: Date.now()
          };

          this.notifySubscribers(key, tickerData);
        } catch (error) {
          console.error('Error parsing ticker data:', error);
        }
      };

      ws.onclose = () => {
        console.log(`Ticker connection closed for ${symbol}`);
        this.handleReconnection(key, () => this.createTickerConnection(symbol));
      };

      ws.onerror = (error) => {
        console.error(`Ticker WebSocket error for ${symbol}:`, error);
      };

      this.websockets.set(key, ws);
    } catch (error) {
      console.error(`Failed to create ticker connection for ${symbol}:`, error);
    }
  }

  private createOrderBookConnection(symbol: string): void {
    const key = `orderbook_${symbol}`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20@100ms`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`Connected to order book stream for ${symbol}`);
        this.reconnectAttempts.set(key, 0);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const orderBookData: OrderBookData = {
            symbol: data.s,
            bids: data.bids.map((bid: string[]) => [parseFloat(bid[0]), parseFloat(bid[1])]),
            asks: data.asks.map((ask: string[]) => [parseFloat(ask[0]), parseFloat(ask[1])]),
            timestamp: Date.now()
          };

          this.notifySubscribers(key, orderBookData);
        } catch (error) {
          console.error('Error parsing order book data:', error);
        }
      };

      ws.onclose = () => {
        console.log(`Order book connection closed for ${symbol}`);
        this.handleReconnection(key, () => this.createOrderBookConnection(symbol));
      };

      ws.onerror = (error) => {
        console.error(`Order book WebSocket error for ${symbol}:`, error);
      };

      this.websockets.set(key, ws);
    } catch (error) {
      console.error(`Failed to create order book connection for ${symbol}:`, error);
    }
  }

  private createCandlestickConnection(symbol: string, interval: string): void {
    const key = `kline_${symbol}_${interval}`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`Connected to candlestick stream for ${symbol} ${interval}`);
        this.reconnectAttempts.set(key, 0);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const kline = data.k;
          const candlestickData: CandlestickData = {
            symbol: kline.s,
            timestamp: kline.t,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v)
          };

          this.notifySubscribers(key, candlestickData);
        } catch (error) {
          console.error('Error parsing candlestick data:', error);
        }
      };

      ws.onclose = () => {
        console.log(`Candlestick connection closed for ${symbol} ${interval}`);
        this.handleReconnection(key, () => this.createCandlestickConnection(symbol, interval));
      };

      ws.onerror = (error) => {
        console.error(`Candlestick WebSocket error for ${symbol} ${interval}:`, error);
      };

      this.websockets.set(key, ws);
    } catch (error) {
      console.error(`Failed to create candlestick connection for ${symbol} ${interval}:`, error);
    }
  }

  private notifySubscribers(key: string, data: any): void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  private handleReconnection(key: string, reconnectFn: () => void): void {
    const attempts = this.reconnectAttempts.get(key) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(key, attempts + 1);
      setTimeout(() => {
        if (this.subscribers.get(key)?.size || 0 > 0) {
          reconnectFn();
        }
      }, this.reconnectDelay * Math.pow(2, attempts));
    } else {
      console.error(`Max reconnection attempts reached for ${key}`);
    }
  }

  private closeConnection(key: string): void {
    const ws = this.websockets.get(key);
    if (ws) {
      ws.close();
      this.websockets.delete(key);
      this.subscribers.delete(key);
      this.reconnectAttempts.delete(key);
    }
  }

  // Clean up all connections
  disconnectAll(): void {
    this.websockets.forEach((ws) => {
      ws.close();
    });
    this.websockets.clear();
    this.subscribers.clear();
    this.reconnectAttempts.clear();
  }

  // Fetch historical data using REST API
  async fetchHistoricalData(symbol: string, interval: string, limit: number = 100): Promise<CandlestickData[]> {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  // Fetch current market data for multiple symbols
  async fetchMultipleTickerData(symbols: string[]): Promise<TickerData[]> {
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data
        .filter((ticker: any) => symbols.includes(ticker.symbol))
        .map((ticker: any) => ({
          symbol: ticker.symbol,
          price: parseFloat(ticker.lastPrice),
          change24h: parseFloat(ticker.priceChange),
          changePercent24h: parseFloat(ticker.priceChangePercent),
          volume24h: parseFloat(ticker.volume),
          high24h: parseFloat(ticker.highPrice),
          low24h: parseFloat(ticker.lowPrice),
          timestamp: Date.now()
        }));
    } catch (error) {
      console.error('Error fetching ticker data:', error);
      throw error;
    }
  }
}

export default MarketDataService;
