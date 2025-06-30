import { GoogleGenerativeAI } from "@google/generative-ai";
import { MomentumSignal, MomentumFilter, HunterConfig } from '../types';

class MomentumHunterService {
  private static instance: MomentumHunterService;
  private config: HunterConfig;
  private ai: GoogleGenerativeAI;

  private constructor() {
    this.config = {
      maxPositions: 5,
      maxAllocation: 10,
      quickProfitTarget: 50,
      maxHoldTime: 24,
      stopLossPercent: 15,
      enableSocialSignals: true,
      enableOnChainSignals: true,
      enableVolumeSignals: true,
      riskTolerance: 'AGGRESSIVE'
    };
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    console.log('🔑 API Key status:', apiKey ? `Key loaded (${apiKey.substring(0, 10)}...)` : 'No API key found!');
    
    this.ai = new GoogleGenerativeAI(apiKey);
  }

  static getInstance(): MomentumHunterService {
    if (!MomentumHunterService.instance) {
      MomentumHunterService.instance = new MomentumHunterService();
    }
    return MomentumHunterService.instance;
  }

  private constructPrompt(filter: MomentumFilter): string {
    const currentDate = new Date().toISOString();
    return `
You are Momentum Hunter AI, a world-class cryptocurrency market analysis engine. Your task is to scan the market and identify assets with extremely high short-term momentum. Generate a list of the top 5 most promising momentum signals right now based on the provided configuration and filters.

**CURRENT ANALYSIS TIME:** ${currentDate}
**MARKET SESSION:** ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

**Analysis Configuration:**
- **Risk Tolerance:** ${this.config.riskTolerance}
- **Enabled Signals:**
  - Volume Signals: ${this.config.enableVolumeSignals}
  - Social Signals: ${this.config.enableSocialSignals}
  - On-Chain Signals: ${this.config.enableOnChainSignals}

**Current Scan Filter:**
- **Timeframe:** ${filter.timeframe}
- **Min 24h Volume Increase:** ${filter.minVolumeIncrease}%
- **Min 24h Price Change:** ${filter.minPriceChange}%
- **Market Cap Range:** $${(filter.minMarketCap || 0).toLocaleString()} - $${(filter.maxMarketCap || 0).toLocaleString()}
- **Min Liquidity Score:** ${filter.minLiquidityScore}/100
- **Target Exchanges:** ${filter.exchanges.join(', ')}
- **Exclude Stablecoins:** ${filter.excludeStablecoins}

Based on this, provide a JSON array of 5 "MomentumSignal" objects. The data should be realistic and reflect a volatile crypto market, but the coin symbols can be fictional. All fields in the JSON object are mandatory unless specified as optional.

The JSON object structure MUST be an array of objects matching this TypeScript interface:
\`\`\`typescript
interface MomentumSignal {
  symbol: string; // e.g., "BLAST/WETH"
  exchange: string; // e.g., "uniswap"
  signalType: 'VOLUME_SPIKE' | 'SOCIAL_BUZZ' | 'WHALE_ACTIVITY' | 'NEW_LISTING' | 'BREAKOUT' | 'INSIDER_FLOW';
  strength: number; // 0-100, overall signal power
  confidence: number; // 0-100, confidence in the signal's accuracy
  timeDetected: string; // ISO 8601 format - MUST be current time: ${currentDate}
  price: number;
  volume24h: number;
  volumeIncrease: number; // Percentage increase, e.g., 2500 for 2500%
  priceChange24h: number;
  marketCap?: number;
  liquidityScore: number; // 0-100
  riskLevel: 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW';
  potentialGainEstimate: number; // Estimated gain potential %
  recommendedAction: 'BUY_IMMEDIATELY' | 'WAIT_FOR_DIP' | 'MONITOR' | 'AVOID';
  entryPrice: number;
  stopLoss: number;
  takeProfitLevels: number[]; // Array of 3-4 price levels
  reasoning: string[]; // Array of 3 short strings explaining the signal
  socialMetrics?: {
    twitterMentions: number;
    redditPosts: number;
    telegramMessages: number;
    sentimentScore: number; // 0-100
    influencerMentions: number;
  };
  onChainMetrics?: {
    uniqueHolders: number;
    holderIncrease24h: number;
    whaleTransactions: number;
    liquidityAdded: number; // in USD
    burnEvents: number;
  };
}
\`\`\`

Generate varied signals. For signals of type 'SOCIAL_BUZZ', the 'socialMetrics' object is required. For 'WHALE_ACTIVITY', the 'onChainMetrics' object is required. For other signal types, they are optional but good to have if relevant. Ensure the generated data is diverse and interesting. The price, entryPrice, stopLoss and takeProfitLevels should have realistic precision. Do not include any explanation outside of the JSON array.
`;
  }

  async scanForMomentumOpportunities(filter?: Partial<MomentumFilter>): Promise<MomentumSignal[]> {
    const defaultFilter: MomentumFilter = {
      minVolumeIncrease: 300,
      minPriceChange: 20,
      minMarketCap: 100000,
      maxMarketCap: 50000000,
      minLiquidityScore: 60,
      exchanges: ['binance', 'coinbase', 'uniswap', 'pancakeswap'],
      excludeStablecoins: true,
      minSocialMentions: 50,
      timeframe: '1h'
    };

    const activeFilter = { ...defaultFilter, ...filter };

    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('🚨 NO API KEY FOUND! Check your .env file for VITE_GEMINI_API_KEY');
        }
        
        console.log('🚀 Starting momentum scan with real Gemini AI...');
        console.log('📊 Filter:', activeFilter);
        
        const prompt = this.constructPrompt(activeFilter);
        console.log('📝 Generated prompt length:', prompt.length);
        
        const model = this.ai.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.8
          }
        });

        console.log('⏳ Calling Gemini API...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonStr = response.text().trim();
        
        console.log('✅ Received response from Gemini API');
        console.log('📄 Raw response length:', jsonStr.length);
        
        // Remove code fences if present
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        if (!jsonStr) {
            console.warn("❌ Gemini returned an empty response.");
            throw new Error('Gemini API returned empty response');
        }

        console.log('🔍 Parsing JSON response...');
        const signals: MomentumSignal[] = JSON.parse(jsonStr);
        console.log(`🎯 Successfully generated ${signals.length} REAL momentum signals from Gemini AI`);
        
        return signals;

    } catch (error) {
        console.error('❌ MOMENTUM SCAN FAILED:', error);
        console.error('🔧 This is NOT using fake/mock data - the API call failed');
        
        // Re-throw the original error to preserve details like status codes for the UI to handle.
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Momentum scan failed: ' + String(error));
    }
  }

  
  updateConfig(newConfig: Partial<HunterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  getConfig(): HunterConfig {
    return { ...this.config };
  }
}

export default MomentumHunterService;
