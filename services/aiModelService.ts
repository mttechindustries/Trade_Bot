/*
 * AI Model Service
 * Re-exports AI analysis functionality from Gemini Service
 */

export { 
  getAiAnalysis,
  generateBacktestResult,
  findMarketOpportunities 
} from './geminiService';

// Re-export types that might be needed
export type { AiAnalysisType } from '../types';
