// Test file to verify the AI fallback system works
import { getAiAnalysis } from './services/aiModelService';
import { Trade, AiAnalysisType } from './types';

const testTrade: Trade = {
  id: 1,
  pair: 'BTC/USDT',
  openTime: new Date().toISOString(),
  openRate: 45000,
  currentRate: 46500,
  stakeAmount: 1000,
  profit: {
    percent: 3.33,
    amount: 333
  },
  side: 'long',
  status: 'open',
  fees: 10,
  exchange: 'binance'
};

// Test the AI service with fallback
export const testAiFallback = async () => {
  console.log('🧪 Testing AI Fallback System...');
  
  try {
    const analysis = await getAiAnalysis(testTrade, AiAnalysisType.MARKET_SENTIMENT);
    console.log('✅ AI Analysis Success:', analysis);
    return analysis;
  } catch (error) {
    console.error('❌ AI Analysis Failed:', error);
    throw error;
  }
};

// Test from browser console by calling: testAiFallback()
(window as any).testAiFallback = testAiFallback;
