import { TickerData } from '../types';

export interface ArbitrageOpportunity {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercent: number;
  volume: number;
  estimatedProfit: number;
  estimatedCosts: number;
  netProfit: number;
  profitPercent: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeWindow: number; // seconds to execute
  confidence: number; // 0-100
}

export interface ExchangeData {
  name: string;
  ticker: TickerData;
  fees: {
    maker: number;
    taker: number;
    withdrawal: number;
  };
  liquidity: number;
  reliability: number; // 0-100
  latency: number; // milliseconds
}

export interface ArbitrageExecution {
  opportunity: ArbitrageOpportunity;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  buyOrderId?: string;
  sellOrderId?: string;
  actualProfit?: number;
  executionTime: number;
  slippage: number;
}

class ArbitrageService {
  private static instance: ArbitrageService;
  private exchanges: Map<string, ExchangeData> = new Map();
  private priceCache: Map<string, { data: TickerData; timestamp: number }> = new Map();
  private activeOpportunities: Map<string, ArbitrageOpportunity> = new Map();
  private executionHistory: ArbitrageExecution[] = [];

  private constructor() {
    this.initializeExchanges();
  }

  static getInstance(): ArbitrageService {
    if (!ArbitrageService.instance) {
      ArbitrageService.instance = new ArbitrageService();
    }
    return ArbitrageService.instance;
  }

  /**
   * Initialize exchange configurations
   */
  private initializeExchanges(): void {
    // Mock exchange data - in production, use real exchange APIs
    const exchanges = [
      {
        name: 'Binance',
        fees: { maker: 0.001, taker: 0.001, withdrawal: 0.0005 },
        reliability: 95,
        latency: 50
      },
      {
        name: 'Coinbase',
        fees: { maker: 0.005, taker: 0.005, withdrawal: 0.001 },
        reliability: 90,
        latency: 100
      },
      {
        name: 'Kraken',
        fees: { maker: 0.0016, taker: 0.0026, withdrawal: 0.0015 },
        reliability: 88,
        latency: 80
      },
      {
        name: 'KuCoin',
        fees: { maker: 0.001, taker: 0.001, withdrawal: 0.0008 },
        reliability: 85,
        latency: 120
      },
      {
        name: 'Bybit',
        fees: { maker: 0.001, taker: 0.001, withdrawal: 0.0005 },
        reliability: 90,
        latency: 60
      }
    ];

    exchanges.forEach(exchange => {
      this.exchanges.set(exchange.name, {
        name: exchange.name,
        ticker: this.generateMockTicker('BTC/USDT'),
        fees: exchange.fees,
        liquidity: Math.random() * 1000000 + 500000,
        reliability: exchange.reliability,
        latency: exchange.latency
      });
    });
  }

  /**
   * Scan for arbitrage opportunities across exchanges
   */
  async scanArbitrageOpportunities(
    symbols: string[] = ['BTC/USDT', 'ETH/USDT', 'ADA/USDT'],
    minProfitPercent: number = 0.5,
    maxRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
  ): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const symbol of symbols) {
      await this.updatePriceData(symbol);
      
      const exchangePrices = this.getExchangePrices(symbol);
      const arbitrageOps = this.findArbitrageOpportunities(
        symbol,
        exchangePrices,
        minProfitPercent
      );

      opportunities.push(...arbitrageOps.filter(op => 
        this.isRiskAcceptable(op.riskLevel, maxRiskLevel)
      ));
    }

    // Sort by profit potential
    opportunities.sort((a, b) => b.profitPercent - a.profitPercent);
    
    // Update active opportunities
    opportunities.forEach(op => {
      const key = `${op.symbol}-${op.buyExchange}-${op.sellExchange}`;
      this.activeOpportunities.set(key, op);
    });

    return opportunities.slice(0, 20); // Return top 20 opportunities
  }

  /**
   * Execute arbitrage opportunity
   */
  async executeArbitrage(
    opportunity: ArbitrageOpportunity,
    amount: number,
    autoExecute: boolean = false
  ): Promise<ArbitrageExecution> {
    const execution: ArbitrageExecution = {
      opportunity,
      status: 'PENDING',
      executionTime: Date.now(),
      slippage: 0
    };

    try {
      if (autoExecute) {
        execution.status = 'EXECUTING';
        
        // Validate opportunity is still valid
        const isValid = await this.validateOpportunity(opportunity);
        if (!isValid) {
          execution.status = 'CANCELLED';
          return execution;
        }

        // Calculate optimal execution size
        const optimalSize = this.calculateOptimalSize(opportunity, amount);
        
        // Execute buy and sell orders simultaneously
        const [buyResult, sellResult] = await Promise.all([
          this.executeBuyOrder(opportunity.buyExchange, opportunity.symbol, optimalSize),
          this.executeSellOrder(opportunity.sellExchange, opportunity.symbol, optimalSize)
        ]);

        execution.buyOrderId = buyResult.orderId;
        execution.sellOrderId = sellResult.orderId;
        execution.actualProfit = this.calculateActualProfit(buyResult, sellResult, opportunity);
        execution.slippage = this.calculateSlippage(opportunity, buyResult, sellResult);
        execution.status = 'COMPLETED';

      } else {
        // Manual execution - just track the opportunity
        execution.status = 'PENDING';
      }

    } catch (error) {
      console.error('Arbitrage execution failed:', error);
      execution.status = 'FAILED';
    }

    this.executionHistory.push(execution);
    return execution;
  }

  /**
   * Monitor and update active arbitrage opportunities
   */
  async monitorOpportunities(): Promise<void> {
    const symbols = Array.from(new Set(
      Array.from(this.activeOpportunities.values()).map(op => op.symbol)
    ));

    for (const symbol of symbols) {
      await this.updatePriceData(symbol);
    }

    // Re-evaluate active opportunities
    for (const [key, opportunity] of this.activeOpportunities.entries()) {
      const updatedOp = await this.updateOpportunity(opportunity);
      
      if (updatedOp.profitPercent < 0.1 || updatedOp.confidence < 50) {
        // Remove low-profit or low-confidence opportunities
        this.activeOpportunities.delete(key);
      } else {
        this.activeOpportunities.set(key, updatedOp);
      }
    }
  }

  /**
   * Get arbitrage statistics and performance
   */
  getArbitrageStats(): {
    totalOpportunities: number;
    successfulExecutions: number;
    averageProfit: number;
    totalProfit: number;
    successRate: number;
    averageSlippage: number;
  } {
    const completed = this.executionHistory.filter(e => e.status === 'COMPLETED');
    const totalProfit = completed.reduce((sum, e) => sum + (e.actualProfit || 0), 0);
    const averageProfit = completed.length > 0 ? totalProfit / completed.length : 0;
    const averageSlippage = completed.length > 0 
      ? completed.reduce((sum, e) => sum + e.slippage, 0) / completed.length 
      : 0;

    return {
      totalOpportunities: this.executionHistory.length,
      successfulExecutions: completed.length,
      averageProfit,
      totalProfit,
      successRate: this.executionHistory.length > 0 
        ? completed.length / this.executionHistory.length 
        : 0,
      averageSlippage
    };
  }

  // Private methods
  private async updatePriceData(symbol: string): Promise<void> {
    // Mock price updates - in production, fetch from real APIs
    for (const [exchangeName, exchangeData] of this.exchanges.entries()) {
      const ticker = this.generateMockTicker(symbol, exchangeData.ticker.price);
      this.exchanges.set(exchangeName, {
        ...exchangeData,
        ticker
      });
      
      const cacheKey = `${exchangeName}-${symbol}`;
      this.priceCache.set(cacheKey, {
        data: ticker,
        timestamp: Date.now()
      });
    }
  }

  private getExchangePrices(symbol: string): { exchange: string; data: TickerData; fees: any }[] {
    const prices = [];
    
    for (const [exchangeName, exchangeData] of this.exchanges.entries()) {
      prices.push({
        exchange: exchangeName,
        data: exchangeData.ticker,
        fees: exchangeData.fees
      });
    }
    
    return prices;
  }

  private findArbitrageOpportunities(
    symbol: string,
    exchangePrices: { exchange: string; data: TickerData; fees: any }[],
    minProfitPercent: number
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    for (let i = 0; i < exchangePrices.length; i++) {
      for (let j = 0; j < exchangePrices.length; j++) {
        if (i === j) continue;

        const buyExchange = exchangePrices[i];
        const sellExchange = exchangePrices[j];

        if (sellExchange.data.price > buyExchange.data.price) {
          const spread = sellExchange.data.price - buyExchange.data.price;
          const spreadPercent = (spread / buyExchange.data.price) * 100;

          if (spreadPercent >= minProfitPercent) {
            const opportunity = this.calculateOpportunityMetrics(
              symbol,
              buyExchange,
              sellExchange,
              spread,
              spreadPercent
            );

            if (opportunity.netProfit > 0) {
              opportunities.push(opportunity);
            }
          }
        }
      }
    }

    return opportunities;
  }

  private calculateOpportunityMetrics(
    symbol: string,
    buyExchange: any,
    sellExchange: any,
    spread: number,
    spreadPercent: number
  ): ArbitrageOpportunity {
    const volume = Math.min(buyExchange.data.volume24h, sellExchange.data.volume24h) * 0.01; // 1% of daily volume
    const tradeAmount = Math.min(volume, 10000); // Max $10k per trade
    
    const buyFees = tradeAmount * buyExchange.fees.taker;
    const sellFees = tradeAmount * sellExchange.fees.taker;
    const withdrawalFees = tradeAmount * Math.max(buyExchange.fees.withdrawal, sellExchange.fees.withdrawal);
    
    const totalCosts = buyFees + sellFees + withdrawalFees;
    const grossProfit = tradeAmount * (spreadPercent / 100);
    const netProfit = grossProfit - totalCosts;
    const profitPercent = (netProfit / tradeAmount) * 100;

    // Calculate risk level
    const buyReliability = this.exchanges.get(buyExchange.exchange)?.reliability || 80;
    const sellReliability = this.exchanges.get(sellExchange.exchange)?.reliability || 80;
    const avgReliability = (buyReliability + sellReliability) / 2;
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (avgReliability > 90 && spreadPercent < 2) riskLevel = 'LOW';
    else if (avgReliability > 85 && spreadPercent < 5) riskLevel = 'MEDIUM';
    else riskLevel = 'HIGH';

    // Calculate confidence based on spread stability and exchange reliability
    const confidence = Math.min(100, avgReliability * 0.7 + Math.min(30, spreadPercent * 6));

    // Estimate time window (lower for higher spreads)
    const timeWindow = Math.max(10, 60 - spreadPercent * 10);

    return {
      symbol,
      buyExchange: buyExchange.exchange,
      sellExchange: sellExchange.exchange,
      buyPrice: buyExchange.data.price,
      sellPrice: sellExchange.data.price,
      spread,
      spreadPercent,
      volume: tradeAmount,
      estimatedProfit: grossProfit,
      estimatedCosts: totalCosts,
      netProfit,
      profitPercent,
      riskLevel,
      timeWindow,
      confidence
    };
  }

  private isRiskAcceptable(
    opportunityRisk: 'LOW' | 'MEDIUM' | 'HIGH',
    maxRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  ): boolean {
    const riskLevels = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
    return riskLevels[opportunityRisk] <= riskLevels[maxRisk];
  }

  private async validateOpportunity(opportunity: ArbitrageOpportunity): Promise<boolean> {
    // Mock validation - check if prices are still valid
    await this.updatePriceData(opportunity.symbol);
    
    const buyExchange = this.exchanges.get(opportunity.buyExchange);
    const sellExchange = this.exchanges.get(opportunity.sellExchange);
    
    if (!buyExchange || !sellExchange) return false;
    
    const currentSpread = sellExchange.ticker.price - buyExchange.ticker.price;
    const currentSpreadPercent = (currentSpread / buyExchange.ticker.price) * 100;
    
    // Opportunity is valid if spread is still at least 80% of original
    return currentSpreadPercent >= opportunity.spreadPercent * 0.8;
  }

  private calculateOptimalSize(opportunity: ArbitrageOpportunity, requestedAmount: number): number {
    // Calculate optimal size based on liquidity and risk
    const maxLiquidity = opportunity.volume * 0.1; // 10% of available volume
    const riskAdjustedSize = requestedAmount * (opportunity.confidence / 100);
    
    return Math.min(requestedAmount, maxLiquidity, riskAdjustedSize);
  }

  private async executeBuyOrder(exchange: string, symbol: string, amount: number): Promise<{ orderId: string; price: number; size: number }> {
    // Mock order execution
    const exchangeData = this.exchanges.get(exchange);
    if (!exchangeData) throw new Error(`Exchange ${exchange} not found`);
    
    const slippage = Math.random() * 0.002; // 0-0.2% slippage
    const executionPrice = exchangeData.ticker.price * (1 + slippage);
    
    return {
      orderId: `buy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      price: executionPrice,
      size: amount / executionPrice
    };
  }

  private async executeSellOrder(exchange: string, symbol: string, amount: number): Promise<{ orderId: string; price: number; size: number }> {
    // Mock order execution
    const exchangeData = this.exchanges.get(exchange);
    if (!exchangeData) throw new Error(`Exchange ${exchange} not found`);
    
    const slippage = Math.random() * 0.002; // 0-0.2% slippage
    const executionPrice = exchangeData.ticker.price * (1 - slippage);
    
    return {
      orderId: `sell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      price: executionPrice,
      size: amount / executionPrice
    };
  }

  private calculateActualProfit(
    buyResult: { orderId: string; price: number; size: number },
    sellResult: { orderId: string; price: number; size: number },
    opportunity: ArbitrageOpportunity
  ): number {
    const buyValue = buyResult.price * buyResult.size;
    const sellValue = sellResult.price * sellResult.size;
    const grossProfit = sellValue - buyValue;
    
    return grossProfit - opportunity.estimatedCosts;
  }

  private calculateSlippage(
    opportunity: ArbitrageOpportunity,
    buyResult: { orderId: string; price: number; size: number },
    sellResult: { orderId: string; price: number; size: number }
  ): number {
    const buySlippage = Math.abs(buyResult.price - opportunity.buyPrice) / opportunity.buyPrice;
    const sellSlippage = Math.abs(sellResult.price - opportunity.sellPrice) / opportunity.sellPrice;
    
    return ((buySlippage + sellSlippage) / 2) * 100; // Average slippage as percentage
  }

  private async updateOpportunity(opportunity: ArbitrageOpportunity): Promise<ArbitrageOpportunity> {
    const buyExchange = this.exchanges.get(opportunity.buyExchange);
    const sellExchange = this.exchanges.get(opportunity.sellExchange);
    
    if (!buyExchange || !sellExchange) return opportunity;
    
    const newSpread = sellExchange.ticker.price - buyExchange.ticker.price;
    const newSpreadPercent = (newSpread / buyExchange.ticker.price) * 100;
    
    return {
      ...opportunity,
      buyPrice: buyExchange.ticker.price,
      sellPrice: sellExchange.ticker.price,
      spread: newSpread,
      spreadPercent: newSpreadPercent,
      netProfit: opportunity.volume * (newSpreadPercent / 100) - opportunity.estimatedCosts,
      profitPercent: ((opportunity.volume * (newSpreadPercent / 100) - opportunity.estimatedCosts) / opportunity.volume) * 100,
      confidence: Math.max(20, opportunity.confidence - 5) // Decrease confidence over time
    };
  }

  private generateMockTicker(symbol: string, basePrice?: number): TickerData {
    const price = basePrice || (symbol.includes('BTC') ? 45000 : symbol.includes('ETH') ? 3000 : 1.5);
    const variation = price * (Math.random() * 0.02 - 0.01); // ±1% variation
    
    return {
      symbol,
      price: price + variation,
      change24h: price * (Math.random() * 0.1 - 0.05),
      changePercent24h: Math.random() * 10 - 5,
      volume24h: Math.random() * 1000000 + 100000,
      high24h: price * (1 + Math.random() * 0.05),
      low24h: price * (1 - Math.random() * 0.05),
      timestamp: Date.now()
    };
  }

  /**
   * Get current active opportunities
   */
  getActiveOpportunities(): ArbitrageOpportunity[] {
    return Array.from(this.activeOpportunities.values());
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): ArbitrageExecution[] {
    return [...this.executionHistory];
  }

  /**
   * Clean up old cache and history
   */
  cleanup(): void {
    const oneHourAgo = Date.now() - 3600000;
    
    // Clean price cache
    for (const [key, value] of this.priceCache.entries()) {
      if (value.timestamp < oneHourAgo) {
        this.priceCache.delete(key);
      }
    }
    
    // Keep only last 100 executions
    if (this.executionHistory.length > 100) {
      this.executionHistory = this.executionHistory.slice(-100);
    }
  }
}

export default ArbitrageService;
