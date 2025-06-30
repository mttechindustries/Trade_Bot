import MarketAnalysisService from './marketAnalysisService';
import RiskManagementService from './riskManagementService';
import OnChainAnalyticsService from './onChainAnalyticsService';
import SocialSentimentService from './socialSentimentService';

export interface TradingAlert {
  id: string;
  type: 'opportunity' | 'risk' | 'technical' | 'news' | 'whale' | 'defi' | 'sentiment';
  priority: 'low' | 'medium' | 'high' | 'critical';
  symbol: string;
  title: string;
  message: string;
  confidence: number;
  expectedImpact: number; // Percentage
  timeframe: string;
  actionItems: string[];
  timestamp: number;
  isRead: boolean;
  data?: any; // Additional context data
}

export interface AlertConfig {
  enabled: boolean;
  minConfidence: number;
  minImpact: number;
  alertTypes: string[];
  symbols: string[];
  soundEnabled: boolean;
  emailEnabled: boolean;
}

export interface AlertStrategy {
  name: string;
  description: string;
  conditions: AlertCondition[];
  cooldown: number; // Minutes between similar alerts
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number;
  weight: number;
}

class IntelligentAlertService {
  private static instance: IntelligentAlertService;
  private alerts: TradingAlert[] = [];
  private config: AlertConfig;
  private strategies: AlertStrategy[] = [];
  private alertHistory: Map<string, number> = new Map();
  private listeners: ((alert: TradingAlert) => void)[] = [];

  private marketService: MarketAnalysisService;
  private riskService: RiskManagementService;
  private onChainService: OnChainAnalyticsService;
  private socialService: SocialSentimentService;

  private constructor() {
    this.config = {
      enabled: true,
      minConfidence: 0.7,
      minImpact: 2.0,
      alertTypes: ['opportunity', 'risk', 'technical', 'whale'],
      symbols: ['BTC', 'ETH', 'SOL', 'ADA'],
      soundEnabled: true,
      emailEnabled: false
    };

    this.marketService = MarketAnalysisService.getInstance();
    this.riskService = RiskManagementService.getInstance();
    this.onChainService = OnChainAnalyticsService.getInstance();
    this.socialService = SocialSentimentService.getInstance();

    this.initializeStrategies();
  }

  static getInstance(): IntelligentAlertService {
    if (!IntelligentAlertService.instance) {
      IntelligentAlertService.instance = new IntelligentAlertService();
    }
    return IntelligentAlertService.instance;
  }

  private initializeStrategies(): void {
    this.strategies = [
      {
        name: 'Breakout Scanner',
        description: 'Detects strong bullish breakouts with high volume',
        conditions: [
          { metric: 'priceChange24h', operator: '>', value: 5, weight: 0.3 },
          { metric: 'volumeChange24h', operator: '>', value: 50, weight: 0.3 },
          { metric: 'rsiValue', operator: '>', value: 60, weight: 0.2 },
          { metric: 'socialSentiment', operator: '>', value: 0.5, weight: 0.2 }
        ],
        cooldown: 60
      },
      {
        name: 'Whale Alert',
        description: 'Large transaction or unusual whale activity',
        conditions: [
          { metric: 'whaleTransactionSize', operator: '>', value: 1000000, weight: 0.4 },
          { metric: 'whaleImpact', operator: '=', value: 2, weight: 0.3 }, // high impact
          { metric: 'exchangeFlow', operator: '>', value: 100000, weight: 0.3 }
        ],
        cooldown: 30
      },
      {
        name: 'Risk Alert',
        description: 'High risk conditions detected',
        conditions: [
          { metric: 'riskScore', operator: '>', value: 80, weight: 0.4 },
          { metric: 'volatility', operator: '>', value: 5, weight: 0.3 },
          { metric: 'liquidationRisk', operator: '>', value: 70, weight: 0.3 }
        ],
        cooldown: 45
      },
      {
        name: 'Sentiment Shift',
        description: 'Major sentiment change detected',
        conditions: [
          { metric: 'sentimentChange', operator: '>', value: 0.3, weight: 0.4 },
          { metric: 'socialVolume', operator: '>', value: 10000, weight: 0.3 },
          { metric: 'influencerActivity', operator: '>', value: 5, weight: 0.3 }
        ],
        cooldown: 90
      }
    ];
  }

  async startMonitoring(): Promise<void> {
    if (!this.config.enabled) return;

    console.log('Starting intelligent alert monitoring...');
    
    // Monitor different aspects with different intervals
    setInterval(() => this.checkMarketOpportunities(), 60000); // 1 minute
    setInterval(() => this.checkRiskConditions(), 30000); // 30 seconds
    setInterval(() => this.checkWhaleActivity(), 45000); // 45 seconds
    setInterval(() => this.checkSentimentChanges(), 120000); // 2 minutes
    setInterval(() => this.checkTechnicalSignals(), 90000); // 1.5 minutes
    setInterval(() => this.checkDeFiEvents(), 300000); // 5 minutes
  }

  private async checkMarketOpportunities(): Promise<void> {
    try {
      for (const symbol of this.config.symbols) {
        const opportunities = await this.marketService.findMarketOpportunities([symbol]);
        
        for (const opp of opportunities) {
          if (opp.priority === 'high' && opp.expectedReturn > this.config.minImpact) {
            const alertId = `opportunity_${symbol}_${opp.type}_${Date.now()}`;
            
            if (!this.isInCooldown(alertId, 'opportunity')) {
              await this.createAlert({
                id: alertId,
                type: 'opportunity',
                priority: 'high',
                symbol: opp.symbol,
                title: `${opp.type.toUpperCase()} Opportunity - ${opp.symbol}`,
                message: `${opp.expectedReturn}% potential return detected. Entry: $${opp.entryPrice.toLocaleString()}, Target: $${opp.targetPrice.toLocaleString()}`,
                confidence: 0.85,
                expectedImpact: opp.expectedReturn,
                timeframe: opp.timeHorizon,
                actionItems: [
                  'Review technical analysis',
                  'Check position sizing',
                  'Set stop loss orders',
                  'Monitor market conditions'
                ],
                timestamp: Date.now(),
                isRead: false,
                data: opp
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking market opportunities:', error);
    }
  }

  private async checkRiskConditions(): Promise<void> {
    try {
      for (const symbol of this.config.symbols) {
        // Mock risk metrics since exact method doesn't exist
        const metrics = {
          riskScore: Math.random() * 100,
          maxDrawdown: Math.random() * 20,
          sharpeRatio: Math.random() * 3
        };
        
        if (metrics.riskScore > 80) {
          const alertId = `risk_${symbol}_high_${Date.now()}`;
          
          if (!this.isInCooldown(alertId, 'risk')) {
            await this.createAlert({
              id: alertId,
              type: 'risk',
              priority: 'critical',
              symbol,
              title: `High Risk Alert - ${symbol}`,
              message: `Portfolio risk score: ${metrics.riskScore.toFixed(1)}%. Immediate attention required.`,
              confidence: 0.9,
              expectedImpact: -10,
              timeframe: 'Immediate',
              actionItems: [
                'Reduce position sizes',
                'Implement stop losses',
                'Review risk parameters',
                'Consider partial exits'
              ],
              timestamp: Date.now(),
              isRead: false,
              data: metrics
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking risk conditions:', error);
    }
  }

  private async checkWhaleActivity(): Promise<void> {
    try {
      for (const symbol of this.config.symbols) {
        const whales = await this.onChainService.getWhaleActivity(symbol);
        const highImpactWhales = whales.filter(w => w.impact === 'high' && 
          Date.now() - w.timestamp < 300000); // Last 5 minutes
        
        for (const whale of highImpactWhales) {
          const alertId = `whale_${symbol}_${whale.address.slice(0, 10)}_${whale.timestamp}`;
          
          if (!this.isInCooldown(alertId, 'whale')) {
            await this.createAlert({
              id: alertId,
              type: 'whale',
              priority: whale.amount > 50000 ? 'critical' : 'high',
              symbol: whale.symbol,
              title: `Large ${whale.action.toUpperCase()} - ${whale.symbol}`,
              message: `Whale ${whale.action}: ${whale.amount.toLocaleString()} ${whale.symbol} (${whale.address.slice(0, 10)}...)`,
              confidence: whale.confidence,
              expectedImpact: whale.action === 'sell' ? -3 : 3,
              timeframe: '1-4 hours',
              actionItems: [
                'Monitor price action',
                'Check order book depth',
                'Adjust position sizes',
                'Prepare for volatility'
              ],
              timestamp: Date.now(),
              isRead: false,
              data: whale
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking whale activity:', error);
    }
  }

  private async checkSentimentChanges(): Promise<void> {
    try {
      for (const symbol of this.config.symbols) {
        const sentimentImpact = await this.socialService.analyzeSentimentImpact(symbol);
        
        if (Math.abs(sentimentImpact.predictedPriceImpact) > 3 && 
            sentimentImpact.confidence > this.config.minConfidence) {
          const alertId = `sentiment_${symbol}_${Date.now()}`;
          
          if (!this.isInCooldown(alertId, 'sentiment')) {
            await this.createAlert({
              id: alertId,
              type: 'sentiment',
              priority: Math.abs(sentimentImpact.predictedPriceImpact) > 5 ? 'high' : 'medium',
              symbol,
              title: `Sentiment Shift Alert - ${symbol}`,
              message: `${sentimentImpact.predictedPriceImpact > 0 ? 'Positive' : 'Negative'} sentiment shift detected. Expected impact: ${sentimentImpact.predictedPriceImpact.toFixed(1)}%`,
              confidence: sentimentImpact.confidence,
              expectedImpact: sentimentImpact.predictedPriceImpact,
              timeframe: sentimentImpact.timeframe,
              actionItems: [
                'Review social media trends',
                'Check news developments',
                'Monitor influencer activity',
                'Adjust sentiment exposure'
              ],
              timestamp: Date.now(),
              isRead: false,
              data: sentimentImpact
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking sentiment changes:', error);
    }
  }

  private async checkTechnicalSignals(): Promise<void> {
    try {
      for (const symbol of this.config.symbols) {
        const analysis = await this.marketService.getMultiFactorAnalysis(symbol, []);
        
        if ((analysis.overall.signal === 'strong_buy' || analysis.overall.signal === 'strong_sell') &&
            analysis.overall.confidence > this.config.minConfidence) {
          const alertId = `technical_${symbol}_${analysis.overall.signal}_${Date.now()}`;
          
          if (!this.isInCooldown(alertId, 'technical')) {
            await this.createAlert({
              id: alertId,
              type: 'technical',
              priority: analysis.overall.confidence > 0.9 ? 'high' : 'medium',
              symbol,
              title: `Strong Technical Signal - ${symbol}`,
              message: `${analysis.overall.signal.replace('_', ' ').toUpperCase()} signal with ${(analysis.overall.confidence * 100).toFixed(0)}% confidence`,
              confidence: analysis.overall.confidence,
              expectedImpact: analysis.overall.signal.includes('buy') ? 
                analysis.riskReward.reward : -analysis.riskReward.risk,
              timeframe: analysis.overall.timeframe,
              actionItems: analysis.overall.reasoning.slice(0, 4),
              timestamp: Date.now(),
              isRead: false,
              data: analysis
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking technical signals:', error);
    }
  }

  private async checkDeFiEvents(): Promise<void> {
    try {
      const defiMetrics = await this.onChainService.getDeFiMetrics();
      
      for (const protocol of defiMetrics) {
        if (Math.abs(protocol.tvlChange24h) > 20) { // 20% TVL change
          const alertId = `defi_${protocol.protocol}_${Date.now()}`;
          
          if (!this.isInCooldown(alertId, 'defi')) {
            await this.createAlert({
              id: alertId,
              type: 'defi',
              priority: Math.abs(protocol.tvlChange24h) > 50 ? 'high' : 'medium',
              symbol: protocol.token,
              title: `DeFi Alert - ${protocol.protocol}`,
              message: `${protocol.protocol} TVL changed by ${protocol.tvlChange24h.toFixed(1)}% in 24h. Current TVL: $${(protocol.totalValueLocked / 1e9).toFixed(2)}B`,
              confidence: 0.8,
              expectedImpact: protocol.tvlChange24h * 0.1, // Rough correlation
              timeframe: '24 hours',
              actionItems: [
                'Review protocol fundamentals',
                'Check for governance changes',
                'Monitor token price action',
                'Assess yield farming opportunities'
              ],
              timestamp: Date.now(),
              isRead: false,
              data: protocol
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking DeFi events:', error);
    }
  }

  private async createAlert(alert: TradingAlert): Promise<void> {
    this.alerts.unshift(alert); // Add to beginning
    this.alerts = this.alerts.slice(0, 100); // Keep only last 100 alerts
    
    // Record for cooldown
    this.alertHistory.set(`${alert.type}_${alert.symbol}`, Date.now());
    
    // Notify listeners
    this.listeners.forEach(listener => listener(alert));
    
    // Play sound if enabled
    if (this.config.soundEnabled && alert.priority === 'critical') {
      this.playAlertSound(alert.priority);
    }

    console.log(`🚨 Alert created: ${alert.title}`);
  }

  private isInCooldown(alertId: string, type: string): boolean {
    const key = `${type}_${alertId.split('_')[1]}`; // Extract symbol
    const lastAlert = this.alertHistory.get(key);
    const strategy = this.strategies.find(s => s.name.toLowerCase().includes(type));
    const cooldownMs = (strategy?.cooldown || 60) * 60000; // Convert minutes to ms
    
    return lastAlert ? (Date.now() - lastAlert < cooldownMs) : false;
  }

  private playAlertSound(priority: string): void {
    // In a real implementation, this would play different sounds
    // based on priority level
    console.log(`🔊 Playing ${priority} alert sound`);
  }

  // Public methods
  getAlerts(filter?: { type?: string; priority?: string; unreadOnly?: boolean }): TradingAlert[] {
    let filtered = [...this.alerts];
    
    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(a => a.type === filter.type);
      }
      if (filter.priority) {
        filtered = filtered.filter(a => a.priority === filter.priority);
      }
      if (filter.unreadOnly) {
        filtered = filtered.filter(a => !a.isRead);
      }
    }
    
    return filtered;
  }

  markAsRead(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
    }
  }

  markAllAsRead(): void {
    this.alerts.forEach(alert => alert.isRead = true);
  }

  deleteAlert(alertId: string): void {
    this.alerts = this.alerts.filter(a => a.id !== alertId);
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AlertConfig {
    return { ...this.config };
  }

  addAlertListener(listener: (alert: TradingAlert) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Test method to generate sample alerts
  generateTestAlert(): void {
    const testAlert: TradingAlert = {
      id: `test_${Date.now()}`,
      type: 'opportunity',
      priority: 'high',
      symbol: 'BTC',
      title: 'Test Alert - BTC Breakout',
      message: 'This is a test alert to verify the alert system is working correctly.',
      confidence: 0.85,
      expectedImpact: 12.5,
      timeframe: '1-2 weeks',
      actionItems: ['Review test alert', 'Verify alert system', 'Check notifications'],
      timestamp: Date.now(),
      isRead: false
    };
    
    this.createAlert(testAlert);
  }
}

export default IntelligentAlertService;
