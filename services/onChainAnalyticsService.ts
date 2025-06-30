export interface OnChainMetrics {
  symbol: string;
  activeAddresses: number;
  transactionCount: number;
  networkValue: number;
  hashRate?: number; // For PoW coins
  stakingRatio?: number; // For PoS coins
  totalValueLocked?: number; // For DeFi tokens
  timestamp: number;
}

export interface WhaleActivity {
  address: string;
  action: 'buy' | 'sell' | 'transfer';
  amount: number;
  symbol: string;
  timestamp: number;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface DeFiMetrics {
  protocol: string;
  totalValueLocked: number;
  tvlChange24h: number;
  volume24h: number;
  fees24h: number;
  apy: number;
  token: string;
  riskScore: number;
}

export interface FlowAnalysis {
  symbol: string;
  exchangeInflow: number;
  exchangeOutflow: number;
  netFlow: number;
  flowTrend: 'accumulation' | 'distribution' | 'neutral';
  impact: number; // Expected price impact percentage
}

class OnChainAnalyticsService {
  private static instance: OnChainAnalyticsService;
  private readonly ETHERSCAN_API = 'https://api.etherscan.io/api';
  private readonly GLASSNODE_API = 'https://api.glassnode.com/v1';
  private readonly DEFIPULSE_API = 'https://api.defipulse.com/v1';

  private constructor() {}

  static getInstance(): OnChainAnalyticsService {
    if (!OnChainAnalyticsService.instance) {
      OnChainAnalyticsService.instance = new OnChainAnalyticsService();
    }
    return OnChainAnalyticsService.instance;
  }

  async getOnChainMetrics(symbol: string): Promise<OnChainMetrics> {
    try {
      // Mock implementation - in production, integrate with real APIs
      const baseMetrics = {
        symbol,
        activeAddresses: Math.floor(Math.random() * 1000000) + 100000,
        transactionCount: Math.floor(Math.random() * 500000) + 50000,
        networkValue: Math.random() * 1000000000000 + 100000000000,
        timestamp: Date.now()
      };

      // Add specific metrics based on token type
      if (symbol === 'BTC') {
        return {
          ...baseMetrics,
          hashRate: Math.random() * 200 + 150 // EH/s
        };
      } else if (['ETH', 'ADA', 'DOT', 'SOL'].includes(symbol)) {
        return {
          ...baseMetrics,
          stakingRatio: Math.random() * 0.3 + 0.4 // 40-70%
        };
      } else {
        return {
          ...baseMetrics,
          totalValueLocked: Math.random() * 10000000000 + 1000000000
        };
      }
    } catch (error) {
      console.error('Error fetching on-chain metrics:', error);
      return {
        symbol,
        activeAddresses: 0,
        transactionCount: 0,
        networkValue: 0,
        timestamp: Date.now()
      };
    }
  }

  async getWhaleActivity(symbol: string): Promise<WhaleActivity[]> {
    try {
      const whales = Array.from({ length: 10 }, (_, i) => {
        const actions: ('buy' | 'sell' | 'transfer')[] = ['buy', 'sell', 'transfer'];
        const impacts: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
        
        return {
          address: `0x${Math.random().toString(16).substr(2, 40)}`,
          action: actions[Math.floor(Math.random() * actions.length)],
          amount: Math.random() * 10000 + 100,
          symbol,
          timestamp: Date.now() - Math.random() * 86400000, // Last 24 hours
          impact: impacts[Math.floor(Math.random() * impacts.length)],
          confidence: 0.7 + Math.random() * 0.3
        };
      });

      // Sort by timestamp (most recent first)
      return whales.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error fetching whale activity:', error);
      return [];
    }
  }

  async getDeFiMetrics(): Promise<DeFiMetrics[]> {
    try {
      const protocols = [
        'Uniswap', 'Aave', 'Compound', 'MakerDAO', 'Curve',
        'SushiSwap', 'Yearn', 'Balancer', 'Synthetix', 'dYdX'
      ];

      return protocols.map(protocol => ({
        protocol,
        totalValueLocked: Math.random() * 10000000000 + 1000000000,
        tvlChange24h: (Math.random() - 0.5) * 20, // -10% to +10%
        volume24h: Math.random() * 1000000000 + 100000000,
        fees24h: Math.random() * 10000000 + 1000000,
        apy: Math.random() * 15 + 2, // 2% to 17%
        token: this.getProtocolToken(protocol),
        riskScore: Math.random() * 40 + 30 // 30-70
      })).sort((a, b) => b.totalValueLocked - a.totalValueLocked);
    } catch (error) {
      console.error('Error fetching DeFi metrics:', error);
      return [];
    }
  }

  async getFlowAnalysis(symbol: string): Promise<FlowAnalysis> {
    try {
      const exchangeInflow = Math.random() * 100000 + 10000;
      const exchangeOutflow = Math.random() * 100000 + 10000;
      const netFlow = exchangeOutflow - exchangeInflow;
      
      let flowTrend: 'accumulation' | 'distribution' | 'neutral';
      if (netFlow > 10000) flowTrend = 'accumulation';
      else if (netFlow < -10000) flowTrend = 'distribution';
      else flowTrend = 'neutral';

      return {
        symbol,
        exchangeInflow,
        exchangeOutflow,
        netFlow,
        flowTrend,
        impact: (Math.abs(netFlow) / 100000) * (Math.random() * 5 + 1) // 1-6% max impact
      };
    } catch (error) {
      console.error('Error analyzing flow:', error);
      return {
        symbol,
        exchangeInflow: 0,
        exchangeOutflow: 0,
        netFlow: 0,
        flowTrend: 'neutral',
        impact: 0
      };
    }
  }

  async getNetworkHealth(symbol: string): Promise<{
    healthScore: number;
    factors: { [key: string]: number };
    alerts: string[];
  }> {
    try {
      const metrics = await this.getOnChainMetrics(symbol);
      const whales = await this.getWhaleActivity(symbol);
      const flow = await this.getFlowAnalysis(symbol);

      const factors = {
        'Network Activity': Math.min(100, metrics.activeAddresses / 10000),
        'Transaction Volume': Math.min(100, metrics.transactionCount / 5000),
        'Whale Impact': 100 - (whales.filter(w => w.impact === 'high').length * 20),
        'Flow Balance': 100 - Math.abs(flow.netFlow) / 1000
      };

      const healthScore = Object.values(factors).reduce((sum, v) => sum + v, 0) / Object.keys(factors).length;

      const alerts: string[] = [];
      if (factors['Whale Impact'] < 60) alerts.push('High whale activity detected');
      if (factors['Flow Balance'] < 50) alerts.push('Significant exchange flow imbalance');
      if (factors['Network Activity'] < 40) alerts.push('Low network activity');

      return { healthScore, factors, alerts };
    } catch (error) {
      console.error('Error calculating network health:', error);
      return {
        healthScore: 50,
        factors: {},
        alerts: ['Unable to fetch network data']
      };
    }
  }

  async getMinerStats(symbol: string): Promise<{
    hashRate: number;
    difficulty: number;
    blockTime: number;
    revenue24h: number;
    profitability: number;
  } | null> {
    if (!['BTC', 'ETH', 'LTC', 'BCH'].includes(symbol)) {
      return null; // Only for PoW coins
    }

    try {
      return {
        hashRate: Math.random() * 200 + 100, // EH/s for BTC
        difficulty: Math.random() * 50000000000000 + 20000000000000,
        blockTime: 600 + (Math.random() - 0.5) * 60, // ~10 minutes for BTC
        revenue24h: Math.random() * 1000000 + 500000, // USD
        profitability: 0.1 + Math.random() * 0.4 // 10-50%
      };
    } catch (error) {
      console.error('Error fetching miner stats:', error);
      return null;
    }
  }

  async getStakingMetrics(symbol: string): Promise<{
    totalStaked: number;
    stakingRatio: number;
    validators: number;
    apy: number;
    slashingEvents: number;
  } | null> {
    if (!['ETH', 'ADA', 'DOT', 'SOL', 'ATOM'].includes(symbol)) {
      return null; // Only for PoS coins
    }

    try {
      return {
        totalStaked: Math.random() * 100000000 + 50000000,
        stakingRatio: 0.4 + Math.random() * 0.3, // 40-70%
        validators: Math.floor(Math.random() * 10000) + 1000,
        apy: 3 + Math.random() * 12, // 3-15%
        slashingEvents: Math.floor(Math.random() * 10)
      };
    } catch (error) {
      console.error('Error fetching staking metrics:', error);
      return null;
    }
  }

  private getProtocolToken(protocol: string): string {
    const tokenMap: { [key: string]: string } = {
      'Uniswap': 'UNI',
      'Aave': 'AAVE',
      'Compound': 'COMP',
      'MakerDAO': 'MKR',
      'Curve': 'CRV',
      'SushiSwap': 'SUSHI',
      'Yearn': 'YFI',
      'Balancer': 'BAL',
      'Synthetix': 'SNX',
      'dYdX': 'DYDX'
    };
    return tokenMap[protocol] || 'UNKNOWN';
  }

  // Real-time monitoring
  startOnChainMonitoring(symbol: string, callback: (data: {
    whaleAlert?: WhaleActivity;
    flowUpdate?: FlowAnalysis;
    healthChange?: number;
  }) => void): () => void {
    const interval = setInterval(async () => {
      const [whales, flow, health] = await Promise.all([
        this.getWhaleActivity(symbol),
        this.getFlowAnalysis(symbol),
        this.getNetworkHealth(symbol)
      ]);

      // Check for significant whale activity
      const recentWhale = whales.find(w => 
        Date.now() - w.timestamp < 300000 && w.impact === 'high'
      );

      callback({
        whaleAlert: recentWhale,
        flowUpdate: flow,
        healthChange: health.healthScore
      });
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }
}

export default OnChainAnalyticsService;
