export interface Trade {
  id: string | number;  // Support both string and number IDs
  pair: string;
  openTime: string;
  closeTime?: string;
  openRate: number;
  closeRate?: number;
  currentRate: number;
  stakeAmount: number;
  profit: ProfitLoss;
  stopLoss?: number;  // Make optional for compatibility
  takeProfit?: number;
  leverage?: number;
  side: 'long' | 'short';
  status: 'open' | 'closed' | 'cancelled';
  fees: number;
  exchange: string;
  orderId?: string;
  strategy?: string;
  volume?: number;  // Added for backward compatibility
}

export interface ProfitLoss {
  amount?: number;     // Make optional for backward compatibility
  absolute?: number;   // Alternative field name 
  percent: number;     // Only percent is required
}

export enum BotStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
}

export enum AiAnalysisType {
  MARKET_SENTIMENT = 'MARKET_SENTIMENT',
  TRADE_EXPLANATION = 'TRADE_EXPLANATION',
}

export interface BacktestTrade {
  pair: string;
  openTime: string;
  closeTime: string;
  openRate: number;
  closeRate: number;
  profit: {
    percent: number;
  };
}

export interface BacktestSummary {
  totalProfitPercent: number;
  winRatePercent: number;
  totalTrades: number;
  sharpeRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  avgTradeTime: number;
}

export interface BacktestResult {
  summary: BacktestSummary;
  trades: BacktestTrade[];
}

export interface MarketOpportunity {
  symbol: string;
  rationale: string;
  type: 'Crypto' | 'Stock';
  keyMetrics: {
    volatility: string;
    trend: string;
  };
}

export interface PortfolioHistoryPoint {
  date: string;
  value: number;
}

// Real-time market data interfaces
export interface TickerData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h?: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  lastUpdate: number;
}

export interface OrderBookData {
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
  timestamp: number;
}

export interface CandlestickData {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Trading interfaces
export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop-limit';
  amount: number;
  price?: number;
  stopPrice?: number;
  status: 'pending' | 'open' | 'closed' | 'cancelled' | 'rejected';
  timestamp: number;
  fees: number;
}

// Enhanced Position interface for advanced risk management
export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  leverage?: number;
  margin?: number;
  stopLoss?: number;
  takeProfit?: number;
  openTime: string;
  exchange: string;
  status: 'open' | 'closing' | 'closed';
}

// Configuration interfaces
export interface TradingConfig {
  maxPositions: number;
  riskPerTrade: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  enableTrailing: boolean;
  trailingPercent: number;
  minTradeAmount: number;
  maxTradeAmount: number;
  allowedPairs: string[];
  strategies: string[];
}

export interface ExchangeConfig {
  name: string;
  apiKey: string;
  apiSecret: string;
  sandbox: boolean;
  testnet: boolean;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  notifications: {
    trades: boolean;
    priceAlerts: boolean;
    email: boolean;
    sound: boolean;
  };
  charts: {
    defaultTimeframe: string;
    indicators: string[];
  };
}

// Alert and notification interfaces
export interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  price: number;
  isActive: boolean;
  triggered: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// Risk management interfaces
export interface RiskMetrics {
  totalPnl: number;
  totalPnlPercent: number;
  dailyPnl: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  var95: number; // Value at Risk
  exposure: number;
}

// Technical analysis interfaces
export interface TechnicalIndicator {
  name: string;
  values: number[];
  signals: 'buy' | 'sell' | 'neutral';
  timestamp: number;
}

export interface MarketAnalysis {
  symbol: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  support: number[];
  resistance: number[];
  indicators: TechnicalIndicator[];
  confidence: number;
  timestamp: number;
}

// News and sentiment analysis types
export type MarketSentiment = 'bullish' | 'bearish' | 'neutral';

export interface NewsEvent {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: Date;
  sentiment: MarketSentiment;
  relevantSymbols: string[];
  impact: 'low' | 'medium' | 'high';
  url: string;
}

export interface NewsImpactAnalysis {
  overallSentiment: MarketSentiment;
  sentimentScore: number; // -1 to 1
  newsCount: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  highImpactEvents: NewsEvent[];
  keyEvents: NewsEvent[];
  lastUpdated: Date;
}

// Momentum Hunter Types
export interface MomentumSignal {
  symbol: string;
  exchange: string;
  signalType: 'VOLUME_SPIKE' | 'SOCIAL_BUZZ' | 'WHALE_ACTIVITY' | 'NEW_LISTING' | 'BREAKOUT' | 'INSIDER_FLOW';
  strength: number; // 0-100
  confidence: number; // 0-100
  timeDetected: string;
  price: number;
  volume24h: number;
  volumeIncrease: number; // Percentage increase
  priceChange24h: number;
  marketCap?: number;
  liquidityScore: number;
  riskLevel: 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW';
  potentialGainEstimate: number; // Estimated gain potential %
  recommendedAction: 'BUY_IMMEDIATELY' | 'WAIT_FOR_DIP' | 'MONITOR' | 'AVOID';
  entryPrice: number;
  stopLoss: number;
  takeProfitLevels: number[];
  reasoning: string[];
  socialMetrics?: {
    twitterMentions: number;
    redditPosts: number;
    telegramMessages: number;
    sentimentScore: number;
    influencerMentions: number;
  };
  onChainMetrics?: {
    uniqueHolders: number;
    holderIncrease24h: number;
    whaleTransactions: number;
    liquidityAdded: number;
    burnEvents: number;
  };
}

export interface MomentumFilter {
  minVolumeIncrease: number;
  minPriceChange: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minLiquidityScore: number;
  exchanges: string[];
  excludeStablecoins: boolean;
  minSocialMentions?: number;
  timeframe: '5m' | '15m' | '1h' | '4h' | '24h';
}

export interface HunterConfig {
  maxPositions: number;
  maxAllocation: number; // % of portfolio for momentum plays
  quickProfitTarget: number; // % for quick profit taking
  maxHoldTime: number; // Hours
  stopLossPercent: number;
  enableSocialSignals: boolean;
  enableOnChainSignals: boolean;
  enableVolumeSignals: boolean;
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'EXTREME';
}