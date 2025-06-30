import { MomentumSignal } from './momentumHunterService';
import { Position, Trade } from '../types';

export interface QuickTradeConfig {
  enableAutoExecution: boolean;
  maxSlippage: number; // Percentage
  executionTimeout: number; // Seconds
  partialFillThreshold: number; // Percentage
  enableDCAOnDips: boolean;
  dcaLevels: number[];
  enableTrailingStop: boolean;
  trailingStopPercent: number;
  enableSmartOrderRouting: boolean;
}

export interface QuickTradeResult {
  success: boolean;
  tradeId?: string;
  executedPrice?: number;
  executedQuantity?: number;
  slippage?: number;
  executionTime?: number;
  errors?: string[];
  warnings?: string[];
}

export interface OrderBook {
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
  spread: number;
  liquidityScore: number;
}

class QuickExecutionService {
  private static instance: QuickExecutionService;
  private config: QuickTradeConfig;
  private activeOrders: Map<string, any> = new Map();
  private executionHistory: any[] = [];

  private constructor() {
    this.config = {
      enableAutoExecution: true,
      maxSlippage: 3, // 3% max slippage
      executionTimeout: 10, // 10 seconds
      partialFillThreshold: 80, // Accept 80% fill
      enableDCAOnDips: true,
      dcaLevels: [0.95, 0.90, 0.85], // DCA at -5%, -10%, -15%
      enableTrailingStop: true,
      trailingStopPercent: 8, // 8% trailing stop
      enableSmartOrderRouting: true
    };
  }

  static getInstance(): QuickExecutionService {
    if (!QuickExecutionService.instance) {
      QuickExecutionService.instance = new QuickExecutionService();
    }
    return QuickExecutionService.instance;
  }

  /**
   * Execute momentum trade with speed optimization
   */
  async executeQuickTrade(
    signal: MomentumSignal,
    positionSize: number,
    portfolioValue: number
  ): Promise<QuickTradeResult> {
    const startTime = Date.now();
    
    try {
      console.log(`⚡ Quick execution started for ${signal.symbol}`);
      
      // 1. Pre-execution checks
      const preCheck = await this.preExecutionChecks(signal, positionSize, portfolioValue);
      if (!preCheck.passed) {
        return {
          success: false,
          errors: preCheck.errors
        };
      }

      // 2. Get optimal execution strategy
      const strategy = await this.getOptimalExecutionStrategy(signal, positionSize);
      
      // 3. Execute trade with speed optimization
      const result = await this.executeWithSpeedOptimization(signal, positionSize, strategy);
      
      // 4. Post-execution setup (stop losses, take profits)
      if (result.success) {
        await this.setupPostExecutionOrders(signal, result);
      }

      const executionTime = Date.now() - startTime;
      result.executionTime = executionTime;
      
      // Record execution
      this.recordExecution(signal, result);
      
      console.log(`✅ Trade executed in ${executionTime}ms`);
      return result;

    } catch (error) {
      console.error('Quick execution error:', error);
      return {
        success: false,
        errors: [`Execution failed: ${error.message}`],
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Pre-execution validation checks
   */
  private async preExecutionChecks(
    signal: MomentumSignal,
    positionSize: number,
    portfolioValue: number
  ): Promise<{ passed: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Balance check
    if (positionSize > portfolioValue * 0.8) {
      errors.push('Position size exceeds 80% of portfolio');
    }

    // Market hours check (for some exchanges)
    const isMarketOpen = await this.checkMarketHours(signal.exchange);
    if (!isMarketOpen && signal.exchange !== 'crypto') {
      errors.push('Market is closed');
    }

    // Liquidity check
    const orderBook = await this.getOrderBook(signal.symbol, signal.exchange);
    if (orderBook.liquidityScore < 60) {
      errors.push('Insufficient liquidity');
    }

    // Volatility check
    if (signal.riskLevel === 'EXTREME' && signal.priceChange24h > 1000) {
      errors.push('Extreme volatility - manual review required');
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Get optimal execution strategy
   */
  private async getOptimalExecutionStrategy(
    signal: MomentumSignal,
    positionSize: number
  ): Promise<{
    orderType: 'MARKET' | 'LIMIT' | 'ICEBERG' | 'TWAP';
    chunks: number;
    timeSpacing: number;
    limitPrice?: number;
  }> {
    const orderBook = await this.getOrderBook(signal.symbol, signal.exchange);
    
    // For high-momentum signals, use market orders for speed
    if (signal.recommendedAction === 'BUY_IMMEDIATELY' && 
        signal.confidence > 85 && 
        orderBook.liquidityScore > 70) {
      return {
        orderType: 'MARKET',
        chunks: 1,
        timeSpacing: 0
      };
    }

    // For large positions, use iceberg orders
    if (positionSize > 10000) {
      return {
        orderType: 'ICEBERG',
        chunks: Math.ceil(positionSize / 5000),
        timeSpacing: 2000 // 2 seconds between chunks
      };
    }

    // Default to limit orders with slight premium for speed
    return {
      orderType: 'LIMIT',
      chunks: 1,
      timeSpacing: 0,
      limitPrice: signal.price * 1.015 // 1.5% above market for quick fill
    };
  }

  /**
   * Execute trade with speed optimization
   */
  private async executeWithSpeedOptimization(
    signal: MomentumSignal,
    positionSize: number,
    strategy: any
  ): Promise<QuickTradeResult> {
    
    // Mock execution with realistic timing
    const executionDelay = strategy.orderType === 'MARKET' ? 200 : 500;
    await new Promise(resolve => setTimeout(resolve, executionDelay));

    // Simulate market impact and slippage
    const slippage = this.calculateSlippage(positionSize, signal);
    const executedPrice = signal.price * (1 + slippage / 100);
    const executedQuantity = positionSize / executedPrice;

    // Check if execution is within acceptable parameters
    if (slippage > this.config.maxSlippage) {
      return {
        success: false,
        errors: [`Slippage ${slippage.toFixed(2)}% exceeds maximum ${this.config.maxSlippage}%`]
      };
    }

    const tradeId = `quick_${Date.now()}_${signal.symbol}`;
    
    // Store active order for monitoring
    this.activeOrders.set(tradeId, {
      signal,
      positionSize,
      executedPrice,
      executedQuantity,
      timestamp: Date.now(),
      status: 'FILLED'
    });

    return {
      success: true,
      tradeId,
      executedPrice,
      executedQuantity,
      slippage
    };
  }

  /**
   * Calculate expected slippage
   */
  private calculateSlippage(positionSize: number, signal: MomentumSignal): number {
    // Base slippage from spread
    let slippage = 0.1; // 0.1% base
    
    // Add slippage based on position size
    if (positionSize > 50000) slippage += 0.5;
    else if (positionSize > 20000) slippage += 0.3;
    else if (positionSize > 10000) slippage += 0.2;
    
    // Add slippage based on volatility
    if (signal.priceChange24h > 100) slippage += 0.5;
    else if (signal.priceChange24h > 50) slippage += 0.3;
    
    // Add slippage based on volume
    if (signal.volumeIncrease > 1000) slippage += 0.2;
    
    return Math.min(slippage, 3); // Cap at 3%
  }

  /**
   * Setup post-execution orders (stop loss, take profit, trailing stop)
   */
  private async setupPostExecutionOrders(
    signal: MomentumSignal,
    result: QuickTradeResult
  ): Promise<void> {
    if (!result.tradeId || !result.executedPrice) return;

    try {
      // Set stop loss
      await this.setStopLoss(result.tradeId, signal.stopLoss);
      
      // Set take profit levels
      for (const [index, level] of signal.takeProfitLevels.entries()) {
        await this.setTakeProfit(result.tradeId, level, 25); // 25% of position per level
      }
      
      // Enable trailing stop if configured
      if (this.config.enableTrailingStop) {
        await this.enableTrailingStop(result.tradeId, this.config.trailingStopPercent);
      }
      
      // Setup DCA orders if enabled
      if (this.config.enableDCAOnDips) {
        await this.setupDCAOrders(result.tradeId, signal, result.executedPrice!);
      }

      console.log(`🛡️ Protective orders set for ${signal.symbol}`);

    } catch (error) {
      console.error('Error setting up post-execution orders:', error);
    }
  }

  /**
   * Set stop loss order
   */
  private async setStopLoss(tradeId: string, stopPrice: number): Promise<void> {
    // Mock implementation
    console.log(`🛑 Stop loss set at $${stopPrice.toFixed(4)} for trade ${tradeId}`);
  }

  /**
   * Set take profit order
   */
  private async setTakeProfit(tradeId: string, price: number, percentage: number): Promise<void> {
    // Mock implementation
    console.log(`🎯 Take profit set at $${price.toFixed(4)} (${percentage}%) for trade ${tradeId}`);
  }

  /**
   * Enable trailing stop
   */
  private async enableTrailingStop(tradeId: string, percent: number): Promise<void> {
    // Mock implementation
    console.log(`📈 Trailing stop enabled at ${percent}% for trade ${tradeId}`);
  }

  /**
   * Setup DCA orders
   */
  private async setupDCAOrders(tradeId: string, signal: MomentumSignal, avgPrice: number): Promise<void> {
    for (const level of this.config.dcaLevels) {
      const dcaPrice = avgPrice * level;
      console.log(`💰 DCA order set at $${dcaPrice.toFixed(4)} (${((level - 1) * 100).toFixed(1)}%)`);
    }
  }

  /**
   * Get order book data
   */
  private async getOrderBook(symbol: string, exchange: string): Promise<OrderBook> {
    // Mock order book data
    const mockOrderBook: OrderBook = {
      bids: [
        { price: 0.0998, quantity: 10000 },
        { price: 0.0995, quantity: 15000 },
        { price: 0.0992, quantity: 20000 }
      ],
      asks: [
        { price: 0.1002, quantity: 8000 },
        { price: 0.1005, quantity: 12000 },
        { price: 0.1008, quantity: 18000 }
      ],
      spread: 0.4, // 0.4%
      liquidityScore: 75
    };

    return mockOrderBook;
  }

  /**
   * Check if market is open
   */
  private async checkMarketHours(exchange: string): Promise<boolean> {
    // Crypto markets are always open
    if (exchange.toLowerCase().includes('binance') || 
        exchange.toLowerCase().includes('crypto') ||
        exchange.toLowerCase().includes('uniswap')) {
      return true;
    }
    
    // For traditional markets, check hours (mock)
    const now = new Date();
    const hour = now.getUTCHours();
    return hour >= 13 && hour <= 21; // Rough NYSE hours in UTC
  }

  /**
   * Record execution for analysis
   */
  private recordExecution(signal: MomentumSignal, result: QuickTradeResult): void {
    const record = {
      timestamp: new Date().toISOString(),
      symbol: signal.symbol,
      signalType: signal.signalType,
      confidence: signal.confidence,
      potentialGain: signal.potentialGainEstimate,
      executionTime: result.executionTime,
      slippage: result.slippage,
      success: result.success,
      errors: result.errors || []
    };

    this.executionHistory.push(record);
    
    // Keep only last 1000 records
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-1000);
    }
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    averageSlippage: number;
    fastestExecution: number;
    slowestExecution: number;
  } {
    const total = this.executionHistory.length;
    if (total === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        averageSlippage: 0,
        fastestExecution: 0,
        slowestExecution: 0
      };
    }

    const successful = this.executionHistory.filter(e => e.success).length;
    const executionTimes = this.executionHistory
      .filter(e => e.executionTime)
      .map(e => e.executionTime!);
    const slippages = this.executionHistory
      .filter(e => e.slippage)
      .map(e => e.slippage!);

    return {
      totalExecutions: total,
      successRate: (successful / total) * 100,
      averageExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length || 0,
      averageSlippage: slippages.reduce((a, b) => a + b, 0) / slippages.length || 0,
      fastestExecution: Math.min(...executionTimes) || 0,
      slowestExecution: Math.max(...executionTimes) || 0
    };
  }

  /**
   * Monitor active positions and adjust stops/targets
   */
  async monitorActivePositions(): Promise<void> {
    for (const [tradeId, order] of this.activeOrders) {
      // Get current price
      const currentPrice = await this.getCurrentPrice(order.signal.symbol);
      
      // Calculate current P&L
      const pnlPercent = ((currentPrice - order.executedPrice) / order.executedPrice) * 100;
      
      // Check for quick profit taking opportunities
      if (pnlPercent > this.config.trailingStopPercent * 2) {
        console.log(`🚀 ${order.signal.symbol} up ${pnlPercent.toFixed(1)}% - Consider taking profits`);
      }
      
      // Update trailing stops
      if (this.config.enableTrailingStop) {
        await this.updateTrailingStop(tradeId, currentPrice, pnlPercent);
      }
    }
  }

  /**
   * Get current price (mock)
   */
  private async getCurrentPrice(symbol: string): Promise<number> {
    // Mock price with some random movement
    const basePrice = 0.1;
    const movement = (Math.random() - 0.5) * 0.2; // ±20% movement
    return basePrice * (1 + movement);
  }

  /**
   * Update trailing stop
   */
  private async updateTrailingStop(tradeId: string, currentPrice: number, pnlPercent: number): Promise<void> {
    // Mock trailing stop update
    if (pnlPercent > 10) {
      console.log(`📈 Updating trailing stop for ${tradeId} - P&L: ${pnlPercent.toFixed(1)}%`);
    }
  }

  /**
   * Cancel all orders for a trade
   */
  async cancelAllOrders(tradeId: string): Promise<boolean> {
    try {
      console.log(`❌ Cancelling all orders for trade ${tradeId}`);
      this.activeOrders.delete(tradeId);
      return true;
    } catch (error) {
      console.error('Error cancelling orders:', error);
      return false;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<QuickTradeConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get configuration
   */
  getConfig(): QuickTradeConfig {
    return { ...this.config };
  }
}

export default QuickExecutionService;
