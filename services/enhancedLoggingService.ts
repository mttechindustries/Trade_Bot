// Enhanced Logging and Error Handling Service
import { Position, Trade } from '../types';

export interface LogLevel {
  ERROR: 'ERROR';
  WARN: 'WARN';
  INFO: 'INFO';
  DEBUG: 'DEBUG';
}

export interface LogEntry {
  timestamp: string;
  level: keyof LogLevel;
  category: string;
  message: string;
  data?: any;
  error?: Error;
  tradeId?: string;
  symbol?: string;
}

export interface SystemHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  uptime: number;
  memoryUsage: number;
  errorRate: number;
  lastErrorTime?: string;
  activeConnections: number;
  dataQualityScore: number;
}

export interface PerformanceMetrics {
  executionLatency: number;
  dataLatency: number;
  orderFillRate: number;
  systemLoad: number;
  networkLatency: number;
}

class EnhancedLoggingService {
  private static instance: EnhancedLoggingService;
  private logs: LogEntry[] = [];
  private maxLogs = 10000;
  private errorCount = 0;
  private totalOperations = 0;
  private startTime = Date.now();
  private healthChecks: SystemHealth[] = [];

  private constructor() {
    // Start health monitoring
    this.startHealthMonitoring();
  }

  static getInstance(): EnhancedLoggingService {
    if (!EnhancedLoggingService.instance) {
      EnhancedLoggingService.instance = new EnhancedLoggingService();
    }
    return EnhancedLoggingService.instance;
  }

  /**
   * Log an entry with automatic categorization
   */
  log(level: keyof LogLevel, category: string, message: string, data?: any, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error
    };

    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Update error tracking
    if (level === 'ERROR') {
      this.errorCount++;
    }
    this.totalOperations++;

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const logFn = level === 'ERROR' ? console.error : 
                   level === 'WARN' ? console.warn : console.log;
      logFn(`[${level}] ${category}: ${message}`, data || '', error || '');
    }

    // Trigger alerts for critical errors
    if (level === 'ERROR' && this.shouldAlert(category)) {
      this.triggerAlert(entry);
    }
  }

  /**
   * Trade-specific logging
   */
  logTrade(level: keyof LogLevel, tradeId: string, symbol: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: 'TRADE',
      message,
      data,
      tradeId,
      symbol
    };

    this.logs.push(entry);
  }

  /**
   * Strategy performance logging
   */
  logStrategy(strategyId: string, performance: any, message: string): void {
    this.log('INFO', 'STRATEGY', message, {
      strategyId,
      performance,
      timestamp: Date.now()
    });
  }

  /**
   * Risk management logging
   */
  logRisk(level: keyof LogLevel, riskType: string, message: string, data?: any): void {
    this.log(level, 'RISK', `${riskType}: ${message}`, data);
  }

  /**
   * Data quality logging
   */
  logDataQuality(source: string, quality: number, issues?: string[]): void {
    this.log('INFO', 'DATA_QUALITY', `${source} quality: ${quality}%`, {
      quality,
      issues: issues || [],
      timestamp: Date.now()
    });
  }

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.totalOperations > 0 ? (this.errorCount / this.totalOperations) * 100 : 0;
    const recentErrors = this.logs.filter(log => 
      log.level === 'ERROR' && 
      Date.now() - new Date(log.timestamp).getTime() < 3600000 // Last hour
    );

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (errorRate > 5 || recentErrors.length > 10) {
      status = 'CRITICAL';
    } else if (errorRate > 2 || recentErrors.length > 5) {
      status = 'WARNING';
    }

    return {
      status,
      uptime,
      memoryUsage: this.getMemoryUsage(),
      errorRate,
      lastErrorTime: recentErrors[0]?.timestamp,
      activeConnections: this.getActiveConnections(),
      dataQualityScore: this.calculateDataQualityScore()
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      executionLatency: this.calculateExecutionLatency(),
      dataLatency: this.calculateDataLatency(),
      orderFillRate: this.calculateOrderFillRate(),
      systemLoad: this.getSystemLoad(),
      networkLatency: this.measureNetworkLatency()
    };
  }

  /**
   * Get logs by category and time range
   */
  getLogs(
    category?: string,
    level?: keyof LogLevel,
    startTime?: Date,
    endTime?: Date,
    limit = 100
  ): LogEntry[] {
    let filteredLogs = this.logs;

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (startTime) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= startTime
      );
    }

    if (endTime) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= endTime
      );
    }

    return filteredLogs.slice(-limit);
  }

  /**
   * Get error summary
   */
  getErrorSummary(hours = 24): {
    totalErrors: number;
    errorsByCategory: { [category: string]: number };
    errorsByType: { [type: string]: number };
    criticalErrors: LogEntry[];
  } {
    const cutoff = Date.now() - (hours * 3600000);
    const recentErrors = this.logs.filter(log => 
      log.level === 'ERROR' && 
      new Date(log.timestamp).getTime() > cutoff
    );

    const errorsByCategory: { [category: string]: number } = {};
    const errorsByType: { [type: string]: number } = {};

    recentErrors.forEach(error => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      const errorType = error.error?.name || 'Unknown';
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    const criticalErrors = recentErrors.filter(error => 
      this.isCriticalError(error)
    );

    return {
      totalErrors: recentErrors.length,
      errorsByCategory,
      errorsByType,
      criticalErrors
    };
  }

  /**
   * Export logs for analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = 'timestamp,level,category,message,tradeId,symbol\n';
      const rows = this.logs.map(log => 
        `${log.timestamp},${log.level},${log.category},"${log.message}",${log.tradeId || ''},${log.symbol || ''}`
      ).join('\n');
      return headers + rows;
    }
    
    return JSON.stringify(this.logs, null, 2);
  }

  // Private helper methods
  private shouldAlert(category: string): boolean {
    const criticalCategories = ['TRADE', 'RISK', 'DATA_FEED', 'SYSTEM'];
    return criticalCategories.includes(category);
  }

  private triggerAlert(entry: LogEntry): void {
    // Implement alert mechanism (email, webhook, etc.)
    console.error('🚨 CRITICAL ALERT:', entry);
  }

  private isCriticalError(error: LogEntry): boolean {
    const criticalKeywords = ['TRADE_FAILURE', 'RISK_BREACH', 'DATA_LOSS', 'SYSTEM_FAILURE'];
    return criticalKeywords.some(keyword => 
      error.message.includes(keyword) || error.category.includes(keyword)
    );
  }

  private getMemoryUsage(): number {
    // Mock implementation - in production, use actual memory monitoring
    return Math.random() * 100;
  }

  private getActiveConnections(): number {
    // Mock implementation - track actual WebSocket/API connections
    return Math.floor(Math.random() * 10) + 1;
  }

  private calculateDataQualityScore(): number {
    // Calculate based on recent data quality logs
    const recentQualityLogs = this.logs.filter(log => 
      log.category === 'DATA_QUALITY' && 
      Date.now() - new Date(log.timestamp).getTime() < 3600000
    );

    if (recentQualityLogs.length === 0) return 95; // Default good score

    const avgQuality = recentQualityLogs.reduce((sum, log) => 
      sum + (log.data?.quality || 95), 0
    ) / recentQualityLogs.length;

    return Math.round(avgQuality);
  }

  private calculateExecutionLatency(): number {
    // Mock - measure actual trade execution times
    return Math.random() * 100 + 50; // 50-150ms
  }

  private calculateDataLatency(): number {
    // Mock - measure data feed latency
    return Math.random() * 200 + 100; // 100-300ms
  }

  private calculateOrderFillRate(): number {
    // Mock - calculate actual fill rate from trade logs
    return 95 + Math.random() * 5; // 95-100%
  }

  private getSystemLoad(): number {
    // Mock - get actual CPU/memory load
    return Math.random() * 100;
  }

  private measureNetworkLatency(): number {
    // Mock - ping exchanges/data providers
    return Math.random() * 50 + 10; // 10-60ms
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      const health = this.getSystemHealth();
      this.healthChecks.push(health);
      
      // Keep only last 24 hours of health checks
      const cutoff = Date.now() - (24 * 3600000);
      this.healthChecks = this.healthChecks.filter(check => 
        Date.now() - check.uptime < cutoff
      );

      // Log health status changes
      if (health.status !== 'HEALTHY') {
        this.log('WARN', 'SYSTEM_HEALTH', `System status: ${health.status}`, health);
      }
    }, 60000); // Check every minute
  }
}

export default EnhancedLoggingService;
