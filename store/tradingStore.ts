import { 
  Trade, 
  BotStatus, 
  TickerData, 
  Position, 
  Order, 
  TradingConfig, 
  RiskMetrics, 
  Notification,
  PriceAlert,
  UserPreferences
} from '../types';

// Simple event emitter for state management
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event: string, data?: any) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }

  off(event: string, callback: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
}

interface TradingState {
  // Bot status
  botStatus: BotStatus;
  
  // Trades
  openTrades: Trade[];
  closedTrades: Trade[];
  
  // Market data
  tickers: Map<string, TickerData>;
  
  // Positions and orders
  positions: Position[];
  orders: Order[];
  
  // Configuration
  tradingConfig: TradingConfig;
  
  // Risk metrics
  riskMetrics: RiskMetrics;
  
  // Notifications and alerts
  notifications: Notification[];
  priceAlerts: PriceAlert[];
  
  // User preferences
  userPreferences: UserPreferences;
  
  // UI state
  isConnected: boolean;
  selectedSymbol: string;
}

// Default values
const defaultTradingConfig: TradingConfig = {
  maxPositions: 5,
  riskPerTrade: 2,
  stopLossPercent: 2,
  takeProfitPercent: 6,
  enableTrailing: false,
  trailingPercent: 1,
  minTradeAmount: 10,
  maxTradeAmount: 1000,
  allowedPairs: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT'],
  strategies: ['MA_CROSSOVER', 'RSI_OVERSOLD', 'BREAKOUT']
};

const defaultRiskMetrics: RiskMetrics = {
  totalPnl: 0,
  totalPnlPercent: 0,
  dailyPnl: 0,
  maxDrawdown: 0,
  sharpeRatio: 0,
  winRate: 0,
  avgWin: 0,
  avgLoss: 0,
  profitFactor: 0,
  var95: 0,
  exposure: 0
};

const defaultUserPreferences: UserPreferences = {
  theme: 'dark',
  notifications: {
    trades: true,
    priceAlerts: true,
    email: false,
    sound: true
  },
  charts: {
    defaultTimeframe: '1h',
    indicators: ['MA', 'RSI', 'MACD']
  }
};

class TradingStore extends EventEmitter {
  private state: TradingState;

  constructor() {
    super();
    this.state = {
      botStatus: BotStatus.STOPPED,
      openTrades: [],
      closedTrades: [],
      tickers: new Map(),
      positions: [],
      orders: [],
      tradingConfig: defaultTradingConfig,
      riskMetrics: defaultRiskMetrics,
      notifications: [],
      priceAlerts: [],
      userPreferences: defaultUserPreferences,
      isConnected: false,
      selectedSymbol: 'BTCUSDT'
    };
  }

  // State getters
  getState(): TradingState {
    return { ...this.state };
  }

  getBotStatus(): BotStatus {
    return this.state.botStatus;
  }

  getOpenTrades(): Trade[] {
    return [...this.state.openTrades];
  }

  getClosedTrades(): Trade[] {
    return [...this.state.closedTrades];
  }

  getTickers(): Map<string, TickerData> {
    return new Map(this.state.tickers);
  }

  getPositions(): Position[] {
    return [...this.state.positions];
  }

  getOrders(): Order[] {
    return [...this.state.orders];
  }

  getRiskMetrics(): RiskMetrics {
    return { ...this.state.riskMetrics };
  }

  getNotifications(): Notification[] {
    return [...this.state.notifications];
  }

  getPriceAlerts(): PriceAlert[] {
    return [...this.state.priceAlerts];
  }

  // State setters
  setBotStatus(status: BotStatus): void {
    this.state.botStatus = status;
    this.emit('botStatusChanged', status);
  }

  addTrade(trade: Trade): void {
    this.state.openTrades.push(trade);
    this.emit('tradeAdded', trade);
    this.emit('openTradesChanged', this.state.openTrades);
  }

  updateTrade(id: number, updates: Partial<Trade>): void {
    const index = this.state.openTrades.findIndex(trade => trade.id === id);
    if (index >= 0) {
      this.state.openTrades[index] = { ...this.state.openTrades[index], ...updates };
      this.emit('tradeUpdated', { id, updates });
      this.emit('openTradesChanged', this.state.openTrades);
    }
  }

  closeTrade(id: number, closeRate: number, closeTime: string): void {
    const tradeIndex = this.state.openTrades.findIndex(t => t.id === id);
    if (tradeIndex === -1) return;

    const trade = this.state.openTrades[tradeIndex];
    const closedTrade: Trade = {
      ...trade,
      closeRate,
      closeTime,
      status: 'closed',
      profit: {
        amount: closeRate - trade.openRate,
        percent: ((closeRate - trade.openRate) / trade.openRate) * 100
      }
    };

    this.state.openTrades.splice(tradeIndex, 1);
    this.state.closedTrades.push(closedTrade);
    
    this.emit('tradeClosed', closedTrade);
    this.emit('openTradesChanged', this.state.openTrades);
    this.emit('closedTradesChanged', this.state.closedTrades);
  }

  updateTicker(symbol: string, data: TickerData): void {
    this.state.tickers.set(symbol, data);
    this.emit('tickerUpdated', { symbol, data });
  }

  updatePosition(position: Position): void {
    const index = this.state.positions.findIndex(p => p.symbol === position.symbol);
    if (index >= 0) {
      this.state.positions[index] = position;
    } else {
      this.state.positions.push(position);
    }
    this.emit('positionUpdated', position);
  }

  addOrder(order: Order): void {
    this.state.orders.push(order);
    this.emit('orderAdded', order);
  }

  updateOrder(id: string, updates: Partial<Order>): void {
    const index = this.state.orders.findIndex(order => order.id === id);
    if (index >= 0) {
      this.state.orders[index] = { ...this.state.orders[index], ...updates };
      this.emit('orderUpdated', { id, updates });
    }
  }

  updateTradingConfig(config: Partial<TradingConfig>): void {
    this.state.tradingConfig = { ...this.state.tradingConfig, ...config };
    this.emit('tradingConfigUpdated', this.state.tradingConfig);
  }

  updateRiskMetrics(metrics: RiskMetrics): void {
    this.state.riskMetrics = metrics;
    this.emit('riskMetricsUpdated', metrics);
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      read: false
    };
    this.state.notifications.unshift(newNotification);
    this.emit('notificationAdded', newNotification);
  }

  markNotificationAsRead(id: string): void {
    const index = this.state.notifications.findIndex(notif => notif.id === id);
    if (index >= 0) {
      this.state.notifications[index].read = true;
      this.emit('notificationRead', id);
    }
  }

  addPriceAlert(alert: Omit<PriceAlert, 'id' | 'createdAt'>): void {
    const newAlert: PriceAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random()}`,
      createdAt: new Date().toISOString()
    };
    this.state.priceAlerts.push(newAlert);
    this.emit('priceAlertAdded', newAlert);
  }

  updatePriceAlert(id: string, updates: Partial<PriceAlert>): void {
    const index = this.state.priceAlerts.findIndex(alert => alert.id === id);
    if (index >= 0) {
      this.state.priceAlerts[index] = { ...this.state.priceAlerts[index], ...updates };
      this.emit('priceAlertUpdated', { id, updates });
    }
  }

  updateUserPreferences(preferences: Partial<UserPreferences>): void {
    this.state.userPreferences = { ...this.state.userPreferences, ...preferences };
    this.emit('userPreferencesUpdated', this.state.userPreferences);
  }

  setIsConnected(connected: boolean): void {
    this.state.isConnected = connected;
    this.emit('connectionStatusChanged', connected);
  }

  setSelectedSymbol(symbol: string): void {
    this.state.selectedSymbol = symbol;
    this.emit('selectedSymbolChanged', symbol);
  }

  // Computed values
  getTotalPnL(): number {
    return this.state.closedTrades.reduce((total, trade) => total + trade.profit.amount, 0);
  }

  getWinRate(): number {
    const closedTrades = this.state.closedTrades;
    if (closedTrades.length === 0) return 0;
    const wins = closedTrades.filter(trade => trade.profit.percent > 0).length;
    return (wins / closedTrades.length) * 100;
  }

  getUnreadNotificationsCount(): number {
    return this.state.notifications.filter(n => !n.read).length;
  }

  getActiveAlertsCount(): number {
    return this.state.priceAlerts.filter(a => a.isActive && !a.triggered).length;
  }
}

// Create singleton instance
export const tradingStore = new TradingStore();

// React hooks for store integration
import React from 'react';

export function useTradingStore<T>(selector: (state: TradingState) => T): T {
  const [value, setValue] = React.useState(() => selector(tradingStore.getState()));

  React.useEffect(() => {
    const updateValue = () => setValue(selector(tradingStore.getState()));
    
    // Listen to all relevant events
    const events = [
      'botStatusChanged', 'tradeAdded', 'tradeUpdated', 'tradeClosed',
      'openTradesChanged', 'closedTradesChanged', 'tickerUpdated',
      'positionUpdated', 'orderAdded', 'orderUpdated', 'tradingConfigUpdated',
      'riskMetricsUpdated', 'notificationAdded', 'notificationRead',
      'priceAlertAdded', 'priceAlertUpdated', 'userPreferencesUpdated',
      'connectionStatusChanged', 'selectedSymbolChanged'
    ];

    events.forEach(event => {
      tradingStore.on(event, updateValue);
    });

    return () => {
      events.forEach(event => {
        tradingStore.off(event, updateValue);
      });
    };
  }, [selector]);

  return value;
}

// Convenient hooks
export const useOpenTradesCount = () => useTradingStore(state => state.openTrades.length);
export const useClosedTradesCount = () => useTradingStore(state => state.closedTrades.length);
export const useTotalPnL = () => useTradingStore(() => tradingStore.getTotalPnL());
export const useWinRate = () => useTradingStore(() => tradingStore.getWinRate());
export const useUnreadNotificationsCount = () => useTradingStore(() => tradingStore.getUnreadNotificationsCount());
export const useActiveAlertsCount = () => useTradingStore(() => tradingStore.getActiveAlertsCount());
