import { CandlestickData } from '../types';

export interface TechnicalIndicatorResult {
  value: number;
  signal?: 'BUY' | 'SELL' | 'HOLD';
  timestamp: number;
}

export interface AdvancedIndicators {
  // Trend Indicators
  sma: { [period: number]: number };
  ema: { [period: number]: number };
  macd: { value: number; signal: number; histogram: number; divergence: boolean };
  
  // Momentum Indicators
  rsi: { value: number; oversold: boolean; overbought: boolean };
  stochastic: { k: number; d: number; signal: 'BUY' | 'SELL' | 'HOLD' };
  williams: number;
  cci: number;
  
  // Volatility Indicators
  bollinger: { upper: number; middle: number; lower: number; squeeze: boolean };
  atr: number;
  keltner: { upper: number; middle: number; lower: number };
  
  // Volume Indicators
  obv: number;
  vwap: number;
  mfi: number;
  ad: number;
  
  // Support/Resistance
  pivotPoints: {
    pivot: number;
    r1: number; r2: number; r3: number;
    s1: number; s2: number; s3: number;
  };
  
  // Advanced Patterns
  ichimoku: {
    tenkan: number;
    kijun: number;
    senkouA: number;
    senkouB: number;
    chikou: number;
    signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  
  // Composite Scores
  trendStrength: number; // 0-100
  momentum: number; // -100 to 100
  volatility: number; // 0-100
  overallSignal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number; // 0-100
}

class TechnicalAnalysisService {
  private static instance: TechnicalAnalysisService;

  private constructor() {}

  static getInstance(): TechnicalAnalysisService {
    if (!TechnicalAnalysisService.instance) {
      TechnicalAnalysisService.instance = new TechnicalAnalysisService();
    }
    return TechnicalAnalysisService.instance;
  }

  /**
   * Calculate comprehensive technical indicators for a given dataset
   */
  calculateIndicators(data: CandlestickData[], period: number = 14): AdvancedIndicators {
    if (data.length < 50) {
      throw new Error('Insufficient data for technical analysis. Need at least 50 data points.');
    }

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);

    return {
      sma: this.calculateSMA(closes),
      ema: this.calculateEMA(closes),
      macd: this.calculateMACD(closes),
      rsi: this.calculateRSI(closes, period),
      stochastic: this.calculateStochastic(highs, lows, closes, period),
      williams: this.calculateWilliamsR(highs, lows, closes, period),
      cci: this.calculateCCI(highs, lows, closes, period),
      bollinger: this.calculateBollingerBands(closes, 20, 2),
      atr: this.calculateATR(highs, lows, closes, period),
      keltner: this.calculateKeltnerChannels(highs, lows, closes, 20),
      obv: this.calculateOBV(closes, volumes),
      vwap: this.calculateVWAP(data),
      mfi: this.calculateMFI(highs, lows, closes, volumes, period),
      ad: this.calculateAD(highs, lows, closes, volumes),
      pivotPoints: this.calculatePivotPoints(data[data.length - 1]),
      ichimoku: this.calculateIchimoku(highs, lows, closes),
      trendStrength: this.calculateTrendStrength(closes),
      momentum: this.calculateMomentum(closes),
      volatility: this.calculateVolatility(closes),
      overallSignal: 'HOLD', // Will be calculated below
      confidence: 0 // Will be calculated below
    };
  }

  // Trend Indicators
  private calculateSMA(closes: number[]): { [period: number]: number } {
    const periods = [5, 10, 20, 50, 100, 200];
    const sma: { [period: number]: number } = {};
    
    periods.forEach(period => {
      if (closes.length >= period) {
        const sum = closes.slice(-period).reduce((a, b) => a + b, 0);
        sma[period] = sum / period;
      }
    });
    
    return sma;
  }

  private calculateEMA(closes: number[]): { [period: number]: number } {
    const periods = [5, 10, 20, 50, 100, 200];
    const ema: { [period: number]: number } = {};
    
    periods.forEach(period => {
      if (closes.length >= period) {
        const multiplier = 2 / (period + 1);
        let emaValue = closes[closes.length - period];
        
        for (let i = closes.length - period + 1; i < closes.length; i++) {
          emaValue = (closes[i] * multiplier) + (emaValue * (1 - multiplier));
        }
        
        ema[period] = emaValue;
      }
    });
    
    return ema;
  }

  private calculateMACD(closes: number[]): { value: number; signal: number; histogram: number; divergence: boolean } {
    const ema12 = this.calculateEMAForPeriod(closes, 12);
    const ema26 = this.calculateEMAForPeriod(closes, 26);
    const macdLine = ema12 - ema26;
    
    // Calculate signal line (9-period EMA of MACD)
    const macdValues = [];
    for (let i = 26; i < closes.length; i++) {
      const ema12Val = this.calculateEMAForPeriod(closes.slice(0, i + 1), 12);
      const ema26Val = this.calculateEMAForPeriod(closes.slice(0, i + 1), 26);
      macdValues.push(ema12Val - ema26Val);
    }
    
    const signalLine = this.calculateEMAForPeriod(macdValues, 9);
    const histogram = macdLine - signalLine;
    
    // Simple divergence detection
    const divergence = this.detectMACDDivergence(closes, macdValues);
    
    return {
      value: macdLine,
      signal: signalLine,
      histogram,
      divergence
    };
  }

  private calculateEMAForPeriod(values: number[], period: number): number {
    if (values.length < period) return values[values.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = values[values.length - period];
    
    for (let i = values.length - period + 1; i < values.length; i++) {
      ema = (values[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  // Momentum Indicators
  private calculateRSI(closes: number[], period: number): { value: number; oversold: boolean; overbought: boolean } {
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return {
      value: rsi,
      oversold: rsi < 30,
      overbought: rsi > 70
    };
  }

  private calculateStochastic(highs: number[], lows: number[], closes: number[], period: number): { k: number; d: number; signal: 'BUY' | 'SELL' | 'HOLD' } {
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    
    // Calculate %D (3-period SMA of %K)
    const kValues = [];
    for (let i = period; i < closes.length; i++) {
      const periodHighs = highs.slice(i - period, i);
      const periodLows = lows.slice(i - period, i);
      const periodHigh = Math.max(...periodHighs);
      const periodLow = Math.min(...periodLows);
      kValues.push(((closes[i] - periodLow) / (periodHigh - periodLow)) * 100);
    }
    
    const d = kValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
    
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (k < 20 && d < 20) signal = 'BUY';
    else if (k > 80 && d > 80) signal = 'SELL';
    
    return { k, d, signal };
  }

  private calculateWilliamsR(highs: number[], lows: number[], closes: number[], period: number): number {
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    
    return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
  }

  private calculateCCI(highs: number[], lows: number[], closes: number[], period: number): number {
    const typicalPrices = [];
    for (let i = 0; i < closes.length; i++) {
      typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3);
    }
    
    const recentTypical = typicalPrices.slice(-period);
    const sma = recentTypical.reduce((a, b) => a + b, 0) / period;
    
    const meanDeviation = recentTypical.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;
    
    const currentTypical = typicalPrices[typicalPrices.length - 1];
    return (currentTypical - sma) / (0.015 * meanDeviation);
  }

  // Volatility Indicators
  private calculateBollingerBands(closes: number[], period: number, stdDev: number): { upper: number; middle: number; lower: number; squeeze: boolean } {
    const recentCloses = closes.slice(-period);
    const sma = recentCloses.reduce((a, b) => a + b, 0) / period;
    
    const variance = recentCloses.reduce((sum, close) => sum + Math.pow(close - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    const upper = sma + (standardDeviation * stdDev);
    const lower = sma - (standardDeviation * stdDev);
    
    // Bollinger Band squeeze detection
    const atr = this.calculateATR(closes.map(() => upper), closes.map(() => lower), closes, 20);
    const squeeze = (upper - lower) / sma < 0.1; // Squeeze when bands are tight
    
    return {
      upper,
      middle: sma,
      lower,
      squeeze
    };
  }

  private calculateATR(highs: number[], lows: number[], closes: number[], period: number): number {
    const trueRanges = [];
    
    for (let i = 1; i < closes.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    return trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  }

  private calculateKeltnerChannels(highs: number[], lows: number[], closes: number[], period: number): { upper: number; middle: number; lower: number } {
    const ema = this.calculateEMAForPeriod(closes, period);
    const atr = this.calculateATR(highs, lows, closes, period);
    
    return {
      upper: ema + (2 * atr),
      middle: ema,
      lower: ema - (2 * atr)
    };
  }

  // Volume Indicators
  private calculateOBV(closes: number[], volumes: number[]): number {
    let obv = 0;
    
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) {
        obv += volumes[i];
      } else if (closes[i] < closes[i - 1]) {
        obv -= volumes[i];
      }
    }
    
    return obv;
  }

  private calculateVWAP(data: CandlestickData[]): number {
    let totalVolume = 0;
    let totalVolumePrice = 0;
    
    data.forEach(candle => {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      totalVolumePrice += typicalPrice * candle.volume;
      totalVolume += candle.volume;
    });
    
    return totalVolumePrice / totalVolume;
  }

  private calculateMFI(highs: number[], lows: number[], closes: number[], volumes: number[], period: number): number {
    const typicalPrices = [];
    const rawMoneyFlow = [];
    
    for (let i = 0; i < closes.length; i++) {
      const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
      typicalPrices.push(typicalPrice);
      rawMoneyFlow.push(typicalPrice * volumes[i]);
    }
    
    let positiveFlow = 0;
    let negativeFlow = 0;
    
    for (let i = 1; i <= period; i++) {
      const idx = typicalPrices.length - i;
      if (typicalPrices[idx] > typicalPrices[idx - 1]) {
        positiveFlow += rawMoneyFlow[idx];
      } else {
        negativeFlow += rawMoneyFlow[idx];
      }
    }
    
    const moneyFlowRatio = positiveFlow / negativeFlow;
    return 100 - (100 / (1 + moneyFlowRatio));
  }

  private calculateAD(highs: number[], lows: number[], closes: number[], volumes: number[]): number {
    let ad = 0;
    
    for (let i = 0; i < closes.length; i++) {
      const clv = ((closes[i] - lows[i]) - (highs[i] - closes[i])) / (highs[i] - lows[i]);
      ad += clv * volumes[i];
    }
    
    return ad;
  }

  // Support/Resistance
  private calculatePivotPoints(lastCandle: CandlestickData): { pivot: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number } {
    const { high, low, close } = lastCandle;
    const pivot = (high + low + close) / 3;
    
    return {
      pivot,
      r1: (2 * pivot) - low,
      r2: pivot + (high - low),
      r3: high + 2 * (pivot - low),
      s1: (2 * pivot) - high,
      s2: pivot - (high - low),
      s3: low - 2 * (high - pivot)
    };
  }

  // Advanced Indicators
  private calculateIchimoku(highs: number[], lows: number[], closes: number[]): { tenkan: number; kijun: number; senkouA: number; senkouB: number; chikou: number; signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' } {
    const tenkanPeriod = 9;
    const kijunPeriod = 26;
    const senkouBPeriod = 52;
    
    // Tenkan-sen (Conversion Line)
    const tenkanHighs = highs.slice(-tenkanPeriod);
    const tenkanLows = lows.slice(-tenkanPeriod);
    const tenkan = (Math.max(...tenkanHighs) + Math.min(...tenkanLows)) / 2;
    
    // Kijun-sen (Base Line)
    const kijunHighs = highs.slice(-kijunPeriod);
    const kijunLows = lows.slice(-kijunPeriod);
    const kijun = (Math.max(...kijunHighs) + Math.min(...kijunLows)) / 2;
    
    // Senkou Span A
    const senkouA = (tenkan + kijun) / 2;
    
    // Senkou Span B
    const senkouBHighs = highs.slice(-senkouBPeriod);
    const senkouBLows = lows.slice(-senkouBPeriod);
    const senkouB = (Math.max(...senkouBHighs) + Math.min(...senkouBLows)) / 2;
    
    // Chikou Span (Lagging Span)
    const chikou = closes[closes.length - 26] || closes[closes.length - 1];
    
    // Signal determination
    const currentPrice = closes[closes.length - 1];
    let signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    
    if (currentPrice > Math.max(senkouA, senkouB) && tenkan > kijun) {
      signal = 'BULLISH';
    } else if (currentPrice < Math.min(senkouA, senkouB) && tenkan < kijun) {
      signal = 'BEARISH';
    }
    
    return { tenkan, kijun, senkouA, senkouB, chikou, signal };
  }

  // Composite Scores
  private calculateTrendStrength(closes: number[]): number {
    const ema20 = this.calculateEMAForPeriod(closes, 20);
    const ema50 = this.calculateEMAForPeriod(closes, 50);
    const currentPrice = closes[closes.length - 1];
    
    const trendScore = ((currentPrice - ema50) / ema50) * 100;
    const emaAlignment = ema20 > ema50 ? 25 : -25;
    
    return Math.max(0, Math.min(100, 50 + trendScore + emaAlignment));
  }

  private calculateMomentum(closes: number[]): number {
    const roc10 = ((closes[closes.length - 1] / closes[closes.length - 11]) - 1) * 100;
    return Math.max(-100, Math.min(100, roc10));
  }

  private calculateVolatility(closes: number[]): number {
    const returns = [];
    for (let i = 1; i < closes.length; i++) {
      returns.push(Math.log(closes[i] / closes[i - 1]));
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized
    
    return Math.min(100, volatility);
  }

  // Helper methods
  private detectMACDDivergence(closes: number[], macdValues: number[]): boolean {
    if (macdValues.length < 10) return false;
    
    const recentPrices = closes.slice(-10);
    const recentMACD = macdValues.slice(-10);
    
    const priceDirection = recentPrices[recentPrices.length - 1] - recentPrices[0];
    const macdDirection = recentMACD[recentMACD.length - 1] - recentMACD[0];
    
    // Bullish divergence: price down, MACD up
    // Bearish divergence: price up, MACD down
    return (priceDirection > 0 && macdDirection < 0) || (priceDirection < 0 && macdDirection > 0);
  }

  /**
   * Generate trading signals based on multiple indicators
   */
  generateTradingSignals(indicators: AdvancedIndicators): {
    signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    confidence: number;
    reasons: string[];
  } {
    const signals: Array<{ signal: string; weight: number; reason: string }> = [];
    
    // RSI signals
    if (indicators.rsi.oversold) {
      signals.push({ signal: 'BUY', weight: 0.8, reason: 'RSI oversold condition' });
    } else if (indicators.rsi.overbought) {
      signals.push({ signal: 'SELL', weight: 0.8, reason: 'RSI overbought condition' });
    }
    
    // MACD signals
    if (indicators.macd.value > indicators.macd.signal && indicators.macd.histogram > 0) {
      signals.push({ signal: 'BUY', weight: 0.9, reason: 'MACD bullish crossover' });
    } else if (indicators.macd.value < indicators.macd.signal && indicators.macd.histogram < 0) {
      signals.push({ signal: 'SELL', weight: 0.9, reason: 'MACD bearish crossover' });
    }
    
    // Bollinger Bands signals
    if (indicators.bollinger.squeeze) {
      signals.push({ signal: 'HOLD', weight: 0.6, reason: 'Bollinger Band squeeze - volatility expansion expected' });
    }
    
    // Ichimoku signals
    if (indicators.ichimoku.signal === 'BULLISH') {
      signals.push({ signal: 'BUY', weight: 1.0, reason: 'Ichimoku cloud bullish signal' });
    } else if (indicators.ichimoku.signal === 'BEARISH') {
      signals.push({ signal: 'SELL', weight: 1.0, reason: 'Ichimoku cloud bearish signal' });
    }
    
    // Calculate weighted signal
    const buySignals = signals.filter(s => s.signal === 'BUY');
    const sellSignals = signals.filter(s => s.signal === 'SELL');
    
    const buyWeight = buySignals.reduce((sum, s) => sum + s.weight, 0);
    const sellWeight = sellSignals.reduce((sum, s) => sum + s.weight, 0);
    
    let finalSignal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    let confidence: number;
    
    if (buyWeight > sellWeight + 1.5) {
      finalSignal = 'STRONG_BUY';
      confidence = Math.min(95, (buyWeight / (buyWeight + sellWeight)) * 100);
    } else if (buyWeight > sellWeight) {
      finalSignal = 'BUY';
      confidence = Math.min(80, (buyWeight / (buyWeight + sellWeight)) * 100);
    } else if (sellWeight > buyWeight + 1.5) {
      finalSignal = 'STRONG_SELL';
      confidence = Math.min(95, (sellWeight / (buyWeight + sellWeight)) * 100);
    } else if (sellWeight > buyWeight) {
      finalSignal = 'SELL';
      confidence = Math.min(80, (sellWeight / (buyWeight + sellWeight)) * 100);
    } else {
      finalSignal = 'HOLD';
      confidence = 50;
    }
    
    const reasons = signals.map(s => s.reason);
    
    return { signal: finalSignal, confidence, reasons };
  }
}

export default TechnicalAnalysisService;
