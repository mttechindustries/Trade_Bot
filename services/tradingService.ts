import { Order, Position, Trade, TradingConfig } from '../types';

// Rate limiting utility
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  getRemaining(key: string): number {
    const requests = this.requests.get(key) || [];
    const now = Date.now();
    const validRequests = requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Enhanced trading service with paper and live trading
class TradingService {
  private static instance: TradingService;
  private rateLimiter: RateLimiter;
  private paperTradingMode: boolean = true;
  private apiKey: string = '';
  private apiSecret: string = '';
  private baseUrl: string = 'https://api.binance.com';
  private testnetUrl: string = 'https://testnet.binance.vision';

  private constructor() {
    this.rateLimiter = new RateLimiter(1200, 60000); // Binance limit: 1200 requests per minute
  }

  static getInstance(): TradingService {
    if (!TradingService.instance) {
      TradingService.instance = new TradingService();
    }
    return TradingService.instance;
  }

  // Configuration
  configure(config: {
    apiKey: string;
    apiSecret: string;
    paperTrading?: boolean;
    testnet?: boolean;
  }): void {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.paperTradingMode = config.paperTrading ?? true;
    
    if (config.testnet) {
      this.baseUrl = this.testnetUrl;
    }
  }

  setPaperTradingMode(enabled: boolean): void {
    this.paperTradingMode = enabled;
  }

  isPaperTrading(): boolean {
    return this.paperTradingMode;
  }

  // Rate limiting check
  private async checkRateLimit(endpoint: string): Promise<boolean> {
    const key = `${this.baseUrl}${endpoint}`;
    return this.rateLimiter.canMakeRequest(key);
  }

  // Generate signature for Binance API
  private generateSignature(query: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', this.apiSecret).update(query).digest('hex');
  }

  // Create authenticated request headers
  private createHeaders(): HeadersInit {
    return {
      'X-MBX-APIKEY': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  // Paper trading simulation
  private async executePaperTrade(order: Partial<Order>): Promise<Order> {
    // Simulate realistic execution with slight slippage
    const slippage = 0.001; // 0.1% slippage
    const slippageMultiplier = order.side === 'buy' ? (1 + slippage) : (1 - slippage);
    
    const executedOrder: Order = {
      id: `paper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: order.symbol!,
      side: order.side!,
      type: order.type || 'market',
      amount: order.amount!,
      price: order.price ? order.price * slippageMultiplier : undefined,
      status: 'closed',
      timestamp: Date.now(),
      fees: (order.amount! * (order.price || 0)) * 0.001 // 0.1% fee
    };

    // Add realistic delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    return executedOrder;
  }

  // Live trading execution
  private async executeLiveTrade(order: Partial<Order>): Promise<Order> {
    if (!await this.checkRateLimit('/api/v3/order')) {
      throw new Error('Rate limit exceeded. Please wait before placing another order.');
    }

    const timestamp = Date.now();
    const orderData = {
      symbol: order.symbol,
      side: order.side?.toUpperCase(),
      type: order.type?.toUpperCase(),
      quantity: order.amount,
      price: order.price,
      timeInForce: 'GTC',
      timestamp
    };

    const queryString = new URLSearchParams(orderData as any).toString();
    const signature = this.generateSignature(queryString);
    const finalQuery = `${queryString}&signature=${signature}`;

    try {
      const response = await fetch(`${this.baseUrl}/api/v3/order`, {
        method: 'POST',
        headers: this.createHeaders(),
        body: finalQuery
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Trading error: ${error.msg || 'Unknown error'}`);
      }

      const result = await response.json();
      
      return {
        id: result.orderId.toString(),
        symbol: result.symbol,
        side: result.side.toLowerCase() as 'buy' | 'sell',
        type: result.type.toLowerCase() as Order['type'],
        amount: parseFloat(result.origQty),
        price: parseFloat(result.price),
        status: this.mapBinanceStatus(result.status),
        timestamp: result.transactTime,
        fees: parseFloat(result.fills?.reduce((total: number, fill: any) => 
          total + parseFloat(fill.commission), 0) || '0')
      };
    } catch (error) {
      console.error('Live trading error:', error);
      throw error;
    }
  }

  private mapBinanceStatus(status: string): Order['status'] {
    switch (status) {
      case 'NEW': return 'open';
      case 'FILLED': return 'closed';
      case 'CANCELED': return 'cancelled';
      case 'REJECTED': return 'rejected';
      default: return 'pending';
    }
  }

  // Public trading interface
  async placeOrder(order: Partial<Order>): Promise<Order> {
    try {
      if (this.paperTradingMode) {
        return await this.executePaperTrade(order);
      } else {
        return await this.executeLiveTrade(order);
      }
    } catch (error) {
      console.error('Order placement failed:', error);
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
    if (this.paperTradingMode) {
      // Paper trading - simulate cancellation
      await new Promise(resolve => setTimeout(resolve, 50));
      return true;
    }

    if (!await this.checkRateLimit('/api/v3/order')) {
      throw new Error('Rate limit exceeded');
    }

    const timestamp = Date.now();
    const params = { symbol, orderId, timestamp };
    const queryString = new URLSearchParams(params as any).toString();
    const signature = this.generateSignature(queryString);

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v3/order?${queryString}&signature=${signature}`,
        {
          method: 'DELETE',
          headers: this.createHeaders()
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Order cancellation failed:', error);
      return false;
    }
  }

  // Get account balance
  async getAccountBalance(): Promise<{ [symbol: string]: number }> {
    if (this.paperTradingMode) {
      // Return mock paper trading balance
      return {
        USDT: 10000,
        BTC: 0.1,
        ETH: 1.5,
        ADA: 1000,
        SOL: 10
      };
    }

    if (!await this.checkRateLimit('/api/v3/account')) {
      throw new Error('Rate limit exceeded');
    }

    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = this.generateSignature(queryString);

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v3/account?${queryString}&signature=${signature}`,
        { headers: this.createHeaders() }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch account balance');
      }

      const data = await response.json();
      const balances: { [symbol: string]: number } = {};
      
      data.balances.forEach((balance: any) => {
        const free = parseFloat(balance.free);
        if (free > 0) {
          balances[balance.asset] = free;
        }
      });

      return balances;
    } catch (error) {
      console.error('Failed to get account balance:', error);
      throw error;
    }
  }

  // Get open orders
  async getOpenOrders(symbol?: string): Promise<Order[]> {
    if (this.paperTradingMode) {
      return []; // Paper trading - no persistent orders
    }

    if (!await this.checkRateLimit('/api/v3/openOrders')) {
      throw new Error('Rate limit exceeded');
    }

    const timestamp = Date.now();
    const params: any = { timestamp };
    if (symbol) params.symbol = symbol;
    
    const queryString = new URLSearchParams(params).toString();
    const signature = this.generateSignature(queryString);

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v3/openOrders?${queryString}&signature=${signature}`,
        { headers: this.createHeaders() }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch open orders');
      }

      const orders = await response.json();
      return orders.map((order: any) => ({
        id: order.orderId.toString(),
        symbol: order.symbol,
        side: order.side.toLowerCase(),
        type: order.type.toLowerCase(),
        amount: parseFloat(order.origQty),
        price: parseFloat(order.price),
        status: this.mapBinanceStatus(order.status),
        timestamp: order.time,
        fees: 0
      }));
    } catch (error) {
      console.error('Failed to get open orders:', error);
      throw error;
    }
  }

  // Get real positions from exchange
  async getPositions(): Promise<Position[]> {
    if (this.paperTradingMode) {
      console.log('🧪 Paper trading mode - returning empty positions');
      return [];
    }

    try {
      if (!await this.checkRateLimit('/fapi/v2/positionRisk')) {
        throw new Error('Rate limit exceeded for positions endpoint');
      }

      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);
      
      const url = `${this.isTestnet() ? this.testnetUrl : this.baseUrl}/fapi/v2/positionRisk?${queryString}&signature=${signature}`;
      
      const response = await fetch(url, {
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.statusText}`);
      }

      const positions = await response.json();
      console.log('✅ Retrieved REAL positions from exchange:', positions.length);
      
      // Convert exchange format to our Position type
      return positions
        .filter((pos: any) => parseFloat(pos.positionAmt) !== 0)
        .map((pos: any) => ({
          id: pos.symbol,
          symbol: pos.symbol,
          side: parseFloat(pos.positionAmt) > 0 ? 'long' : 'short',
          size: Math.abs(parseFloat(pos.positionAmt)),
          entryPrice: parseFloat(pos.entryPrice),
          currentPrice: parseFloat(pos.markPrice),
          unrealizedPnL: parseFloat(pos.unRealizedProfit),
          unrealizedPnLPercent: parseFloat(pos.percentage),
          leverage: parseFloat(pos.leverage),
          openTime: new Date().toISOString(), // Exchange doesn't provide this
          exchange: 'Binance',
          status: 'open'
        }));
        
    } catch (error) {
      console.error('❌ Failed to get REAL positions:', error);
      throw error;
    }
  }

  // Get real trade history from exchange
  async getTrades(): Promise<Trade[]> {
    if (this.paperTradingMode) {
      console.log('🧪 Paper trading mode - returning empty trades');
      return [];
    }

    try {
      if (!await this.checkRateLimit('/fapi/v1/userTrades')) {
        throw new Error('Rate limit exceeded for trades endpoint');
      }

      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}&limit=100`;
      const signature = this.generateSignature(queryString);
      
      const url = `${this.isTestnet() ? this.testnetUrl : this.baseUrl}/fapi/v1/userTrades?${queryString}&signature=${signature}`;
      
      const response = await fetch(url, {
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.statusText}`);
      }

      const trades = await response.json();
      console.log('✅ Retrieved REAL trade history from exchange:', trades.length);
      
      // Convert exchange format to our Trade type
      return trades.map((trade: any) => ({
        id: trade.id,
        pair: trade.symbol,
        openTime: new Date(trade.time).toISOString(),
        closeTime: trade.isBuyer ? undefined : new Date(trade.time).toISOString(),
        openRate: parseFloat(trade.price),
        closeRate: trade.isBuyer ? undefined : parseFloat(trade.price),
        currentRate: parseFloat(trade.price),
        stakeAmount: parseFloat(trade.quoteQty),
        profit: {
          amount: parseFloat(trade.realizedPnl || '0'),
          percent: 0 // Calculate if needed
        },
        side: trade.isBuyer ? 'long' : 'short',
        status: trade.isBuyer ? 'open' : 'closed',
        fees: parseFloat(trade.commission),
        exchange: 'Binance'
      }));
        
    } catch (error) {
      console.error('❌ Failed to get REAL trades:', error);
      throw error;
    }
  }

  // Check if using testnet
  private isTestnet(): boolean {
    return import.meta.env.BINANCE_TESTNET === 'true';
  }

  // Advanced order types
  async placeStopLossOrder(symbol: string, amount: number, stopPrice: number, side: 'buy' | 'sell'): Promise<Order> {
    const order: Partial<Order> = {
      symbol,
      side,
      type: 'stop',
      amount,
      stopPrice
    };

    return this.placeOrder(order);
  }

  async placeTakeProfitOrder(symbol: string, amount: number, price: number, side: 'buy' | 'sell'): Promise<Order> {
    const order: Partial<Order> = {
      symbol,
      side,
      type: 'limit',
      amount,
      price
    };

    return this.placeOrder(order);
  }

  // Position management
  async closePosition(position: Position): Promise<Order> {
    const side = position.side === 'long' ? 'sell' : 'buy';
    
    const order: Partial<Order> = {
      symbol: position.symbol,
      side,
      type: 'market',
      amount: position.size
    };

    return this.placeOrder(order);
  }

  // Risk management
  calculatePositionSize(
    accountBalance: number,
    riskPercent: number,
    entryPrice: number,
    stopLoss: number
  ): number {
    const riskAmount = accountBalance * (riskPercent / 100);
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    return riskAmount / riskPerShare;
  }

  // Trading utilities
  getExecutionQuality(order: Order, expectedPrice: number): {
    slippage: number;
    executionQuality: 'excellent' | 'good' | 'poor';
  } {
    if (!order.price) {
      return { slippage: 0, executionQuality: 'excellent' };
    }

    const slippage = Math.abs((order.price - expectedPrice) / expectedPrice) * 100;
    
    let executionQuality: 'excellent' | 'good' | 'poor';
    if (slippage < 0.1) executionQuality = 'excellent';
    else if (slippage < 0.5) executionQuality = 'good';
    else executionQuality = 'poor';

    return { slippage, executionQuality };
  }

  // Error handling and retry logic
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) break;
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, backoffMs * Math.pow(2, attempt))
        );
      }
    }

    throw lastError!;
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    rateLimitRemaining: number;
  }> {
    const start = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/v3/ping`);
      const responseTime = Date.now() - start;
      
      return {
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        rateLimitRemaining: this.rateLimiter.getRemaining(this.baseUrl)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        rateLimitRemaining: 0
      };
    }
  }
}

export default TradingService;
