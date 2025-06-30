
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Trade, AiAnalysisType, BacktestResult, MarketOpportunity } from '../types';

// Check for API key in browser environment
const getApiKey = (): string => {
  // In a real application, this should come from your backend for security
  // Never expose API keys in frontend code in production
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    console.error("Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file.");
  }
  return apiKey;
};

const ai = new GoogleGenerativeAI(getApiKey());

const handleApiError = (error: any, context: string): Error => {
    console.error(`Error in Gemini API call (${context}):`, error);
    if (error.message && (error.message.toLowerCase().includes('quota') || error.message.toLowerCase().includes('rate limit'))) {
         return new Error("API quota exceeded. Please wait a while before trying again.");
    }
    if (error.message && error.message.toLowerCase().includes('api key not valid')) {
        return new Error("Invalid API Key. Please ensure your API_KEY environment variable is set correctly.");
    }
    return new Error(`An unexpected error occurred during ${context}. Please try again later.`);
}

const parseJsonResponse = <T>(text: string): T => {
    let jsonStr = text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    try {
        return JSON.parse(jsonStr) as T;
    } catch (e) {
        console.error("Failed to parse JSON response:", jsonStr, e);
        throw new Error("The AI model returned a response that could not be understood. Please try again.");
    }
}


const generateMarketSentimentPrompt = (trade: Trade): string => {
  return `
    You are a professional crypto market analyst for a trading bot UI.
    Analyze the following trading pair: **${trade.pair}**.
    The current price is **${trade.currentRate.toFixed(4)}**.

    Provide the following in a concise summary:
    1.  **Market Sentiment:** (e.g., Bullish, Bearish, Neutral).
    2.  **Key Support Level:** A plausible support price based on the current rate.
    3.  **Key Resistance Level:** A plausible resistance price based on the current rate.
    4.  **Brief Rationale:** A short explanation for your analysis (2-3 sentences max).
    
    Keep the language clear, direct, and suitable for a trading dashboard.
  `;
};

const generateTradeExplanationPrompt = (trade: Trade): string => {
  return `
    You are a trading strategy expert analyzing a closed trade for a user.
    The trade for **${trade.pair}** was:
    -   **Opened at:** ${trade.openRate.toFixed(4)}
    -   **Closed at:** ${trade.closeRate?.toFixed(4)}
    -   **Resulting in a profit of:** ${trade.profit.percent.toFixed(2)}%

    Based on common technical analysis strategies, provide a plausible, hypothetical reason for this trade. 
    Describe what technical indicators or chart patterns could have signaled the **entry** and **exit** points.

    Structure your response as follows:
    -   **Entry Signal:** [Your plausible explanation]
    -   **Exit Signal:** [Your plausible explanation]

    Be creative, sound knowledgeable, and keep the explanation concise.
  `;
}

export const getAiAnalysis = async (trade: Trade, type: AiAnalysisType): Promise<string> => {
  const prompt = type === AiAnalysisType.MARKET_SENTIMENT 
    ? generateMarketSentimentPrompt(trade)
    : generateTradeExplanationPrompt(trade);

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    throw handleApiError(error, 'AI analysis');
  }
};

export const generateBacktestResult = async (pair: string, strategy: string): Promise<BacktestResult> => {
  const prompt = `
    You are a quantitative trading analyst running a historical simulation for a trading bot UI.
    Your task is to analyze the provided trading strategy against fictional historical data for the pair **${pair}** over the last 90 days.

    **Strategy Description:**
    ${strategy}

    **Your Response MUST be a single, valid JSON object and nothing else. Do not include any text, explanations, or markdown ticks like \`\`\`json \`\`\` before or after the JSON.**
    
    The JSON object must conform to the following structure:
    {
      "summary": {
        "totalProfitPercent": number,
        "winRatePercent": number,
        "totalTrades": number,
        "sharpeRatio": number
      },
      "trades": [
        {
          "pair": string,
          "openTime": string (ISO 8601 format, within the last 90 days),
          "closeTime": string (ISO 8601 format, after openTime),
          "openRate": number,
          "closeRate": number,
          "profit": {
            "percent": number
          }
        }
      ]
    }

    **Instructions for Generation:**
    1. Generate a realistic but fictional result for the given strategy.
    2. The 'summary' object's values should be plausible for the strategy. \`totalProfitPercent\` can be positive or negative. \`winRatePercent\` should be between 0 and 100. \`sharpeRatio\` should be between -2 and 2.
    3. The 'trades' array must contain exactly 5 example trades.
    4. All trade data must be consistent (e.g., profit percent should correctly reflect open and close rates).
  `;

  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return parseJsonResponse<BacktestResult>(response.text());

  } catch (error) {
    throw handleApiError(error, 'backtest generation');
  }
};


export const findMarketOpportunities = async (profile: string): Promise<MarketOpportunity[]> => {
    const prompt = `
        You are a market analyst AI for a sophisticated trading UI. Your task is to identify potential market opportunities based on a user-defined profile. 
        **IMPORTANT:** Your analysis is hypothetical and for informational purposes only. It is NOT financial advice.

        **User Profile:** "${profile}"

        **Your Response MUST be a single, valid JSON array object and nothing else. Do not include any text, explanations, or markdown ticks like \`\`\`json \`\`\` before or after the JSON.**
        
        The JSON object must be an array of 3-5 items conforming to the following structure:
        [
          {
            "symbol": string, // e.g., "BTC/USDT" or "NVDA"
            "rationale": string, // A 2-3 sentence explanation of why this asset fits the profile.
            "type": "Crypto" | "Stock",
            "keyMetrics": {
                "volatility": "Low" | "Medium" | "High" | "Very High",
                "trend": "Strong Up" | "Weak Up" | "Sideways" | "Weak Down" | "Strong Down"
            }
          }
        ]

        **Instructions for Generation:**
        1. Identify 3 to 5 assets (a mix of crypto and stocks) that plausibly fit the user's profile.
        2. For each asset, provide a concise, professional rationale. Focus on technical or market structure reasons.
        3. Assign realistic 'keyMetrics' for each asset.
        4. Ensure the entire output is a single, clean JSON array.
    `;

    try {
        const model = ai.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
          }
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
    
        return parseJsonResponse<MarketOpportunity[]>(response.text());
    
      } catch (error) {
        throw handleApiError(error, 'market screening');
      }
}
