import { Trade, Position, BotStatus } from '../types';
import { TimeService } from './timeService';
import RealTimeMarketDataService from './realTimeMarketDataService';

interface PaperAccount {
  balance: number;
  equity: number;
  marginUsed: number;
  marginAvailable: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
}

interface PaperTrade extends Omit<Trade, 'id'> {
  id: string;
  timestamp: number;
  status: 'pending' | 'open' | 'closed' | 'cancelled';
  realPrice?: number; // Actual execution price from real-time data
  slippage?: number; // Difference between expected and actual price
}

interface OrderRequest {
  symbol: string;
  side: 'buy' | 'sell' | 'long' | 'short';
  type: 'market' | 'limit' | 'stop';
  amount: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  leverage?: number;
  strategy?: string;
}

interface ExecutionReport {
  orderId: string;
  status: 'filled' | 'partial' | 'rejected' | 'cancelled';
  executedPrice: number;
  executedQuantity: number;
  commission: number;
  timestamp: number;
  message?: string;
}

class PaperTradingService {
  private static instance: PaperTradingService;
  private marketDataService: RealTimeMarketDataService;
  private account: PaperAccount;
  private openTrades: Map<string, PaperTrade> = new Map();
  private closedTrades: PaperTrade[] = [];
  private pendingOrders: Map<string, OrderRequest> = new Map();
  private tradeId = 1;
  private isActive = false;

  // Trading settings
  private readonly INITIAL_BALANCE = 10000; // $10,000 starting balance
  private readonly MAX_LEVERAGE = 10;
  private readonly COMMISSION_RATE = 0.001; // 0.1% commission
  private readonly SLIPPAGE_RANGE = [0.001, 0.005]; // 0.1% - 0.5% slippage simulation

  private constructor() {
    this.marketDataService = RealTimeMarketDataService.getInstance();
    this.account = {
      balance: this.INITIAL_BALANCE,
      equity: this.INITIAL_BALANCE,
      marginUsed: 0,
      marginAvailable: this.INITIAL_BALANCE,
      unrealizedPnL: 0,
      realizedPnL: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0
    };

    this.initializePaperTrading();
  }

  static getInstance(): PaperTradingService {
    if (!PaperTradingService.instance) {
      PaperTradingService.instance = new PaperTradingService();
    }
    return PaperTradingService.instance;
  }

  private initializePaperTrading(): void {
    // Update account metrics every 5 seconds using real-time prices
    setInterval(() => {
      this.updateAccountMetrics();
    }, 5000);

    // Check for stop loss and take profit triggers every second
    setInterval(() => {
      this.checkStopLossAndTakeProfit();
    }, 1000);

    console.log('✅ Paper Trading Service initialized with $' + this.INITIAL_BALANCE + ' virtual balance');
  }

  /**
   * Place a paper trade order
   */
  public async placeOrder(orderRequest: OrderRequest): Promise<ExecutionReport> {
    if (!this.isActive) {
      return {
        orderId: '',
        status: 'rejected',
        executedPrice: 0,
        executedQuantity: 0,
        commission: 0,
        timestamp: TimeService.now(),
        message: 'Paper trading is not active'
      };
    }

    try {
      // Get current market price
      const ticker = await this.marketDataService.getLatestPrice(orderRequest.symbol);
      if (!ticker) {
        return {
          orderId: '',
          status: 'rejected',
          executedPrice: 0,
          executedQuantity: 0,
          commission: 0,
          timestamp: TimeService.now(),
          message: 'Unable to get market price for ' + orderRequest.symbol
        };
      }

      // Simulate order execution
      const executionPrice = this.simulateExecution(ticker.price, orderRequest);
      const commission = orderRequest.amount * executionPrice * this.COMMISSION_RATE;
      const leverage = orderRequest.leverage || 1;
      const marginRequired = (orderRequest.amount * executionPrice) / leverage;

      // Check if sufficient margin available
      if (marginRequired > this.account.marginAvailable) {
        return {
          orderId: '',
          status: 'rejected',
          executedPrice: 0,
          executedQuantity: 0,
          commission: 0,
          timestamp: TimeService.now(),
          message: 'Insufficient margin. Required: $' + marginRequired.toFixed(2) + ', Available: $' + this.account.marginAvailable.toFixed(2)
        };
      }

      // Create paper trade
      const tradeId = `PT_${this.tradeId++}`;
      const trade: PaperTrade = {
        id: tradeId,
        pair: orderRequest.symbol,
        openTime: TimeService.getCurrentTime().toISOString(),
        openRate: executionPrice,
        currentRate: executionPrice,
        stakeAmount: orderRequest.amount,
        profit: { amount: 0, percent: 0 },
        stopLoss: orderRequest.stopLoss,
        takeProfit: orderRequest.takeProfit,
        leverage: leverage,
        side: orderRequest.side,
        status: 'open',
        fees: commission,
        exchange: 'Paper Trading',
        orderId: tradeId,
        strategy: orderRequest.strategy || 'Manual',
        timestamp: TimeService.now(),
        realPrice: executionPrice,
        slippage: Math.abs(executionPrice - ticker.price) / ticker.price
      };

      // Update account
      this.account.marginUsed += marginRequired;
      this.account.marginAvailable -= marginRequired;
      this.account.balance -= commission; // Deduct commission
      this.account.totalTrades++;

      // Store trade
      this.openTrades.set(tradeId, trade);

      console.log(`✅ Paper trade executed: ${orderRequest.side.toUpperCase()} ${orderRequest.amount} ${orderRequest.symbol} @ $${executionPrice.toFixed(2)}`);

      return {
        orderId: tradeId,
        status: 'filled',
        executedPrice: executionPrice,
        executedQuantity: orderRequest.amount,
        commission,
        timestamp: TimeService.now()
      };

    } catch (error) {
      console.error('Error placing paper trade:', error);
      return {
        orderId: '',
        status: 'rejected',
        executedPrice: 0,
        executedQuantity: 0,
        commission: 0,
        timestamp: TimeService.now(),
        message: 'Internal error: ' + (error as Error).message
      };
    }
  }

  /**
   * Close a paper trade
   */
  public async closeTrade(tradeId: string): Promise<ExecutionReport> {
    const trade = this.openTrades.get(tradeId);
    if (!trade) {
      return {
        orderId: tradeId,
        status: 'rejected',
        executedPrice: 0,
        executedQuantity: 0,
        commission: 0,
        timestamp: TimeService.now(),
        message: 'Trade not found'
      };
    }

    try {
      // Get current market price
      const ticker = await this.marketDataService.getLatestPrice(trade.pair);
      if (!ticker) {
        return {
          orderId: tradeId,
          status: 'rejected',
          executedPrice: 0,
          executedQuantity: 0,
          commission: 0,
          timestamp: TimeService.now(),
          message: 'Unable to get market price for ' + trade.pair
        };
      }

      const closePrice = this.simulateExecution(ticker.price, {
        symbol: trade.pair,
        side: trade.side === 'long' ? 'sell' : 'buy',
        type: 'market',
        amount: trade.stakeAmount
      });

      const commission = trade.stakeAmount * closePrice * this.COMMISSION_RATE;
      
      // Calculate P&L
      const profitPercent = trade.side === 'long' 
        ? ((closePrice - trade.openRate) / trade.openRate) * 100 * (trade.leverage || 1)
        : ((trade.openRate - closePrice) / trade.openRate) * 100 * (trade.leverage || 1);
      
      const profitAmount = (trade.stakeAmount * profitPercent) / 100;
      
      // Update trade
      trade.currentRate = closePrice;
      trade.closeTime = TimeService.getCurrentTime().toISOString();
      trade.profit = { amount: profitAmount, percent: profitPercent };
      trade.status = 'closed';
      trade.fees += commission;

      // Update account
      const marginUsed = (trade.stakeAmount * trade.openRate) / (trade.leverage || 1);
      this.account.marginUsed -= marginUsed;
      this.account.marginAvailable += marginUsed;
      this.account.balance += profitAmount - commission;
      this.account.realizedPnL += profitAmount;

      if (profitAmount > 0) {
        this.account.winningTrades++;
      } else {
        this.account.losingTrades++;
      }

      // Move to closed trades
      this.openTrades.delete(tradeId);
      this.closedTrades.push(trade);

      console.log(`✅ Paper trade closed: ${trade.pair} P&L: ${profitPercent > 0 ? '+' : ''}${profitPercent.toFixed(2)}% ($${profitAmount.toFixed(2)})`);

      return {
        orderId: tradeId,
        status: 'filled',
        executedPrice: closePrice,
        executedQuantity: trade.stakeAmount,
        commission,
        timestamp: TimeService.now()
      };

    } catch (error) {
      console.error('Error closing paper trade:', error);
      return {
        orderId: tradeId,
        status: 'rejected',
        executedPrice: 0,
        executedQuantity: 0,
        commission: 0,
        timestamp: TimeService.now(),
        message: 'Internal error: ' + (error as Error).message
      };
    }
  }

  private simulateExecution(marketPrice: number, order: OrderRequest): number {
    // Simulate realistic slippage based on order type and market conditions
    const slippage = Math.random() * (this.SLIPPAGE_RANGE[1] - this.SLIPPAGE_RANGE[0]) + this.SLIPPAGE_RANGE[0];
    
    if (order.type === 'market') {
      // Market orders get slippage against the trader
      const slippageDirection = (order.side === 'buy' || order.side === 'long') ? 1 : -1;
      return marketPrice * (1 + (slippage * slippageDirection));
    } else {
      // Limit orders execute at the requested price if market reaches it
      return order.price || marketPrice;
    }
  }

  private async updateAccountMetrics(): Promise<void> {
    let totalUnrealizedPnL = 0;

    for (const [tradeId, trade] of this.openTrades) {
      try {
        const ticker = await this.marketDataService.getLatestPrice(trade.pair);
        if (ticker) {
          trade.currentRate = ticker.price;
          
          // Calculate unrealized P&L
          const profitPercent = trade.side === 'long' 
            ? ((ticker.price - trade.openRate) / trade.openRate) * 100 * (trade.leverage || 1)
            : ((trade.openRate - ticker.price) / trade.openRate) * 100 * (trade.leverage || 1);
          
          const profitAmount = (trade.stakeAmount * profitPercent) / 100;
          trade.profit = { amount: profitAmount, percent: profitPercent };
          
          totalUnrealizedPnL += profitAmount;
        }
      } catch (error) {
        console.error(`Error updating trade ${tradeId}:`, error);
      }
    }

    this.account.unrealizedPnL = totalUnrealizedPnL;
    this.account.equity = this.account.balance + totalUnrealizedPnL;
  }

  private async checkStopLossAndTakeProfit(): Promise<void> {
    for (const [tradeId, trade] of this.openTrades) {
      try {
        const ticker = await this.marketDataService.getLatestPrice(trade.pair);
        if (!ticker) continue;

        const currentPrice = ticker.price;
        let shouldClose = false;
        let reason = '';

        // Check stop loss
        if (trade.stopLoss) {
          if (trade.side === 'long' && currentPrice <= trade.stopLoss) {
            shouldClose = true;
            reason = 'Stop Loss';
          } else if (trade.side === 'short' && currentPrice >= trade.stopLoss) {
            shouldClose = true;
            reason = 'Stop Loss';
          }
        }

        // Check take profit
        if (trade.takeProfit && !shouldClose) {
          if (trade.side === 'long' && currentPrice >= trade.takeProfit) {
            shouldClose = true;
            reason = 'Take Profit';
          } else if (trade.side === 'short' && currentPrice <= trade.takeProfit) {
            shouldClose = true;
            reason = 'Take Profit';
          }
        }

        if (shouldClose) {
          console.log(`🎯 Auto-closing trade ${tradeId} (${reason}): ${trade.pair} @ $${currentPrice.toFixed(2)}`);
          await this.closeTrade(tradeId);
        }

      } catch (error) {
        console.error(`Error checking SL/TP for trade ${tradeId}:`, error);
      }
    }
  }

  // Public API methods
  public startPaperTrading(): void {
    this.isActive = true;
    console.log('✅ Paper Trading activated');
  }

  public stopPaperTrading(): void {
    this.isActive = false;
    console.log('⏸️ Paper Trading stopped');
  }

  public getAccount(): PaperAccount {
    return { ...this.account };
  }

  public getOpenTrades(): Trade[] {
    return Array.from(this.openTrades.values()).map(this.convertToTrade);
  }

  public getClosedTrades(): Trade[] {
    return this.closedTrades.map(this.convertToTrade);
  }

  public getTradingStatus(): {
    isActive: boolean;
    connectionStatus: boolean;
    account: PaperAccount;
    openTradesCount: number;
    totalTradesCount: number;
  } {
    return {
      isActive: this.isActive,
      connectionStatus: this.marketDataService.isConnectedToRealTimeData(),
      account: this.getAccount(),
      openTradesCount: this.openTrades.size,
      totalTradesCount: this.account.totalTrades
    };
  }

  public resetAccount(): void {
    this.openTrades.clear();
    this.closedTrades = [];
    this.account = {
      balance: this.INITIAL_BALANCE,
      equity: this.INITIAL_BALANCE,
      marginUsed: 0,
      marginAvailable: this.INITIAL_BALANCE,
      unrealizedPnL: 0,
      realizedPnL: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0
    };
    this.tradeId = 1;
    console.log('🔄 Paper trading account reset');
  }

  private convertToTrade(paperTrade: PaperTrade): Trade {
    return {
      id: parseInt(paperTrade.id.replace('PT_', '')),
      pair: paperTrade.pair,
      openTime: paperTrade.openTime,
      closeTime: paperTrade.closeTime,
      openRate: paperTrade.openRate,
      currentRate: paperTrade.currentRate,
      stakeAmount: paperTrade.stakeAmount,
      profit: paperTrade.profit,
      stopLoss: paperTrade.stopLoss,
      takeProfit: paperTrade.takeProfit,
      leverage: paperTrade.leverage,
      side: paperTrade.side,
      status: paperTrade.status,
      fees: paperTrade.fees,
      exchange: paperTrade.exchange,
      orderId: paperTrade.orderId,
      strategy: paperTrade.strategy
    };
  }
}

export default PaperTradingService;
