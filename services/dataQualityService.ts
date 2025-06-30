// Data Quality Assurance Service
import { CandlestickData } from '../types';
import EnhancedLoggingService from './enhancedLoggingService';

export interface DataQualityMetrics {
  completeness: number; // 0-100%
  accuracy: number; // 0-100%
  consistency: number; // 0-100%
  timeliness: number; // 0-100%
  overall: number; // 0-100%
  issues: DataQualityIssue[];
}

export interface DataQualityIssue {
  type: 'MISSING_DATA' | 'OUTLIER' | 'INCONSISTENT' | 'DELAYED' | 'DUPLICATE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  timestamp: string;
  symbol?: string;
  field?: string;
  value?: any;
  expectedValue?: any;
}

export interface DataSource {
  name: string;
  type: 'PRICE_FEED' | 'NEWS_FEED' | 'ECONOMIC_DATA' | 'SOCIAL_SENTIMENT';
  url?: string;
  lastUpdate: string;
  status: 'ONLINE' | 'DELAYED' | 'OFFLINE';
  latency: number;
  errorRate: number;
  qualityScore: number;
}

class DataQualityService {
  private static instance: DataQualityService;
  private logger: EnhancedLoggingService;
  private dataSources: Map<string, DataSource> = new Map();
  private qualityHistory: Array<{ timestamp: string; source: string; metrics: DataQualityMetrics }> = [];
  private priceHistory: Map<string, CandlestickData[]> = new Map();

  private constructor() {
    this.logger = EnhancedLoggingService.getInstance();
    this.initializeDataSources();
    this.startQualityMonitoring();
  }

  static getInstance(): DataQualityService {
    if (!DataQualityService.instance) {
      DataQualityService.instance = new DataQualityService();
    }
    return DataQualityService.instance;
  }

  /**
   * Validate incoming price data
   */
  validatePriceData(symbol: string, data: CandlestickData[]): DataQualityMetrics {
    const issues: DataQualityIssue[] = [];
    const timestamp = new Date().toISOString();

    // Check data completeness
    const completeness = this.checkCompleteness(data, issues);
    
    // Check for outliers
    const accuracy = this.checkAccuracy(symbol, data, issues);
    
    // Check consistency
    const consistency = this.checkConsistency(data, issues);
    
    // Check timeliness
    const timeliness = this.checkTimeliness(data, issues);

    const overall = (completeness + accuracy + consistency + timeliness) / 4;

    const metrics: DataQualityMetrics = {
      completeness,
      accuracy,
      consistency,
      timeliness,
      overall,
      issues
    };

    // Log quality metrics
    this.logger.logDataQuality(
      `PRICE_${symbol}`,
      overall,
      issues.map(issue => issue.description)
    );

    // Store for trending
    this.qualityHistory.push({
      timestamp,
      source: symbol,
      metrics
    });

    // Keep only recent history
    if (this.qualityHistory.length > 1000) {
      this.qualityHistory = this.qualityHistory.slice(-1000);
    }

    return metrics;
  }

  /**
   * Check data completeness
   */
  private checkCompleteness(data: CandlestickData[], issues: DataQualityIssue[]): number {
    let score = 100;
    let missingFields = 0;
    const totalFields = data.length * 6; // open, high, low, close, volume, timestamp

    data.forEach((candle, index) => {
      const requiredFields = ['open', 'high', 'low', 'close', 'volume', 'timestamp'];
      requiredFields.forEach(field => {
        if (candle[field as keyof CandlestickData] === undefined || 
            candle[field as keyof CandlestickData] === null) {
          missingFields++;
          issues.push({
            type: 'MISSING_DATA',
            severity: 'HIGH',
            description: `Missing ${field} in candle ${index}`,
            timestamp: new Date().toISOString(),
            field
          });
        }
      });
    });

    score = Math.max(0, 100 - (missingFields / totalFields) * 100);
    return score;
  }

  /**
   * Check data accuracy (outlier detection)
   */
  private checkAccuracy(symbol: string, data: CandlestickData[], issues: DataQualityIssue[]): number {
    let score = 100;
    const outliers = this.detectOutliers(data);

    outliers.forEach(outlier => {
      score -= 5; // Reduce score for each outlier
      issues.push({
        type: 'OUTLIER',
        severity: outlier.severity,
        description: `Outlier detected in ${outlier.field}: ${outlier.value}`,
        timestamp: new Date().toISOString(),
        symbol,
        field: outlier.field,
        value: outlier.value,
        expectedValue: outlier.expectedRange
      });
    });

    return Math.max(0, score);
  }

  /**
   * Check data consistency
   */
  private checkConsistency(data: CandlestickData[], issues: DataQualityIssue[]): number {
    let score = 100;
    let inconsistencies = 0;

    data.forEach((candle, index) => {
      // Check OHLC relationships
      if (candle.high < candle.low) {
        inconsistencies++;
        issues.push({
          type: 'INCONSISTENT',
          severity: 'CRITICAL',
          description: `High price lower than low price in candle ${index}`,
          timestamp: new Date().toISOString()
        });
      }

      if (candle.open > candle.high || candle.open < candle.low) {
        inconsistencies++;
        issues.push({
          type: 'INCONSISTENT',
          severity: 'HIGH',
          description: `Open price outside high-low range in candle ${index}`,
          timestamp: new Date().toISOString()
        });
      }

      if (candle.close > candle.high || candle.close < candle.low) {
        inconsistencies++;
        issues.push({
          type: 'INCONSISTENT',
          severity: 'HIGH',
          description: `Close price outside high-low range in candle ${index}`,
          timestamp: new Date().toISOString()
        });
      }

      // Check timestamp ordering
      if (index > 0 && candle.timestamp <= data[index - 1].timestamp) {
        inconsistencies++;
        issues.push({
          type: 'INCONSISTENT',
          severity: 'MEDIUM',
          description: `Timestamp not in ascending order at candle ${index}`,
          timestamp: new Date().toISOString()
        });
      }
    });

    score = Math.max(0, 100 - (inconsistencies / data.length) * 20);
    return score;
  }

  /**
   * Check data timeliness
   */
  private checkTimeliness(data: CandlestickData[], issues: DataQualityIssue[]): number {
    if (data.length === 0) return 0;

    const latestTimestamp = Math.max(...data.map(d => d.timestamp));
    const now = Date.now();
    const ageMinutes = (now - latestTimestamp) / 60000;

    let score = 100;
    if (ageMinutes > 60) { // More than 1 hour old
      score = 0;
      issues.push({
        type: 'DELAYED',
        severity: 'CRITICAL',
        description: `Data is ${ageMinutes.toFixed(1)} minutes old`,
        timestamp: new Date().toISOString()
      });
    } else if (ageMinutes > 15) { // More than 15 minutes old
      score = 50;
      issues.push({
        type: 'DELAYED',
        severity: 'HIGH',
        description: `Data is ${ageMinutes.toFixed(1)} minutes old`,
        timestamp: new Date().toISOString()
      });
    } else if (ageMinutes > 5) { // More than 5 minutes old
      score = 80;
      issues.push({
        type: 'DELAYED',
        severity: 'MEDIUM',
        description: `Data is ${ageMinutes.toFixed(1)} minutes old`,
        timestamp: new Date().toISOString()
      });
    }

    return score;
  }

  /**
   * Detect outliers in price data
   */
  private detectOutliers(data: CandlestickData[]): Array<{
    field: string;
    value: number;
    expectedRange: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> {
    const outliers: Array<{
      field: string;
      value: number;
      expectedRange: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    }> = [];
    if (data.length < 3) return outliers;

    // Calculate moving statistics
    const prices = data.map(d => d.close);
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    // Check for price outliers (beyond 3 standard deviations)
    data.forEach((candle, index) => {
      const fields = ['open', 'high', 'low', 'close'];
      fields.forEach(field => {
        const value = candle[field as keyof CandlestickData] as number;
        const zScore = Math.abs((value - mean) / stdDev);
        
        if (zScore > 3) {
          outliers.push({
            field,
            value,
            expectedRange: `${(mean - 3 * stdDev).toFixed(2)} - ${(mean + 3 * stdDev).toFixed(2)}`,
            severity: zScore > 5 ? 'CRITICAL' : zScore > 4 ? 'HIGH' : 'MEDIUM'
          });
        }
      });

      // Check for volume outliers
      if (index > 0) {
        const avgVolume = data.slice(Math.max(0, index - 10), index)
          .reduce((sum, d) => sum + d.volume, 0) / Math.min(10, index);
        
        if (candle.volume > avgVolume * 10) {
          outliers.push({
            field: 'volume',
            value: candle.volume,
            expectedRange: `< ${(avgVolume * 5).toFixed(0)}`,
            severity: candle.volume > avgVolume * 20 ? 'HIGH' : 'MEDIUM'
          });
        }
      }
    });

    return outliers;
  }

  /**
   * Get data source status
   */
  getDataSourceStatus(sourceName: string): DataSource | null {
    return this.dataSources.get(sourceName) || null;
  }

  /**
   * Get all data sources
   */
  getAllDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }

  /**
   * Update data source status
   */
  updateDataSourceStatus(sourceName: string, status: Partial<DataSource>): void {
    const existing = this.dataSources.get(sourceName);
    if (existing) {
      this.dataSources.set(sourceName, { ...existing, ...status });
    }
  }

  /**
   * Get quality trends
   */
  getQualityTrends(hours = 24): Array<{
    timestamp: string;
    averageQuality: number;
    sourceQuality: { [source: string]: number };
  }> {
    const cutoff = Date.now() - (hours * 3600000);
    const recentHistory = this.qualityHistory.filter(entry => 
      new Date(entry.timestamp).getTime() > cutoff
    );

    // Group by hour
    const hourlyData = new Map<string, Array<{ source: string; quality: number }>>();
    
    recentHistory.forEach(entry => {
      const hour = new Date(entry.timestamp).toISOString().substring(0, 13) + ':00:00.000Z';
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, []);
      }
      hourlyData.get(hour)!.push({
        source: entry.source,
        quality: entry.metrics.overall
      });
    });

    // Calculate averages
    return Array.from(hourlyData.entries()).map(([timestamp, data]) => {
      const averageQuality = data.reduce((sum, d) => sum + d.quality, 0) / data.length;
      const sourceQuality: { [source: string]: number } = {};
      
      data.forEach(d => {
        if (!sourceQuality[d.source]) {
          sourceQuality[d.source] = 0;
        }
        sourceQuality[d.source] += d.quality;
      });

      // Average by source
      Object.keys(sourceQuality).forEach(source => {
        const sourceData = data.filter(d => d.source === source);
        sourceQuality[source] = sourceQuality[source] / sourceData.length;
      });

      return {
        timestamp,
        averageQuality,
        sourceQuality
      };
    }).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Get critical issues
   */
  getCriticalIssues(hours = 1): DataQualityIssue[] {
    const cutoff = Date.now() - (hours * 3600000);
    return this.qualityHistory
      .filter(entry => new Date(entry.timestamp).getTime() > cutoff)
      .flatMap(entry => entry.metrics.issues)
      .filter(issue => issue.severity === 'CRITICAL')
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Initialize data sources
   */
  private initializeDataSources(): void {
    const sources: DataSource[] = [
      {
        name: 'GEMINI_PRICE_FEED',
        type: 'PRICE_FEED',
        url: 'https://api.gemini.com',
        lastUpdate: new Date().toISOString(),
        status: 'ONLINE',
        latency: 50,
        errorRate: 0,
        qualityScore: 98
      },
      {
        name: 'BINANCE_PRICE_FEED',
        type: 'PRICE_FEED',
        url: 'https://api.binance.com',
        lastUpdate: new Date().toISOString(),
        status: 'ONLINE',
        latency: 30,
        errorRate: 0.1,
        qualityScore: 99
      },
      {
        name: 'NEWS_FEED',
        type: 'NEWS_FEED',
        lastUpdate: new Date().toISOString(),
        status: 'ONLINE',
        latency: 200,
        errorRate: 1,
        qualityScore: 95
      }
    ];

    sources.forEach(source => {
      this.dataSources.set(source.name, source);
    });
  }

  /**
   * Start continuous quality monitoring
   */
  private startQualityMonitoring(): void {
    setInterval(() => {
      // Update data source health
      this.dataSources.forEach((source, name) => {
        // Simulate health checks
        const isHealthy = Math.random() > 0.05; // 95% uptime
        const newLatency = source.latency + (Math.random() - 0.5) * 20;
        
        this.updateDataSourceStatus(name, {
          status: isHealthy ? 'ONLINE' : 'DELAYED',
          latency: Math.max(10, newLatency),
          lastUpdate: new Date().toISOString()
        });
      });

      // Log overall system data quality
      const avgQuality = Array.from(this.dataSources.values())
        .reduce((sum, source) => sum + source.qualityScore, 0) / this.dataSources.size;
      
      this.logger.logDataQuality('SYSTEM_OVERALL', avgQuality);
    }, 60000); // Check every minute
  }
}

export default DataQualityService;
