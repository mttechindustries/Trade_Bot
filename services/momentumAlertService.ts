import { MomentumSignal } from './momentumHunterService';

export interface AlertConfig {
  enablePushNotifications: boolean;
  enableEmailAlerts: boolean;
  enableSMSAlerts: boolean;
  enableDesktopNotifications: boolean;
  minimumConfidence: number;
  minimumGainPotential: number;
  alertCooldown: number; // Minutes between alerts for same symbol
  prioritySignals: string[]; // Signal types to prioritize
}

export interface Alert {
  id: string;
  timestamp: string;
  signal: MomentumSignal;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  actionRequired: boolean;
  acknowledged: boolean;
  executed: boolean;
}

class MomentumAlertService {
  private static instance: MomentumAlertService;
  private config: AlertConfig;
  private alerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private lastAlertTime: Map<string, number> = new Map();

  private constructor() {
    this.config = {
      enablePushNotifications: true,
      enableEmailAlerts: true,
      enableSMSAlerts: false,
      enableDesktopNotifications: true,
      minimumConfidence: 70,
      minimumGainPotential: 100, // 100% minimum gain potential
      alertCooldown: 30, // 30 minutes
      prioritySignals: ['NEW_LISTING', 'WHALE_ACTIVITY', 'SOCIAL_BUZZ']
    };
  }

  static getInstance(): MomentumAlertService {
    if (!MomentumAlertService.instance) {
      MomentumAlertService.instance = new MomentumAlertService();
    }
    return MomentumAlertService.instance;
  }

  /**
   * Process momentum signal and create alerts
   */
  async processSignal(signal: MomentumSignal): Promise<Alert | null> {
    // Check if signal meets alert criteria
    if (!this.shouldCreateAlert(signal)) {
      return null;
    }

    // Check cooldown period
    const lastAlert = this.lastAlertTime.get(signal.symbol);
    const now = Date.now();
    if (lastAlert && (now - lastAlert) < (this.config.alertCooldown * 60 * 1000)) {
      return null;
    }

    // Create alert
    const alert = this.createAlert(signal);
    
    // Store alert
    this.alerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    this.lastAlertTime.set(signal.symbol, now);

    // Send notifications
    await this.sendNotifications(alert);

    return alert;
  }

  /**
   * Check if signal should create an alert
   */
  private shouldCreateAlert(signal: MomentumSignal): boolean {
    // Minimum confidence check
    if (signal.confidence < this.config.minimumConfidence) {
      return false;
    }

    // Minimum gain potential check
    if (signal.potentialGainEstimate < this.config.minimumGainPotential) {
      return false;
    }

    // High-priority signals always create alerts
    if (this.config.prioritySignals.includes(signal.signalType)) {
      return true;
    }

    // Additional criteria for other signals
    if (signal.recommendedAction === 'BUY_IMMEDIATELY' && signal.strength > 80) {
      return true;
    }

    return false;
  }

  /**
   * Create alert from signal
   */
  private createAlert(signal: MomentumSignal): Alert {
    const priority = this.calculatePriority(signal);
    const message = this.generateAlertMessage(signal);

    return {
      id: `alert_${Date.now()}_${signal.symbol}`,
      timestamp: new Date().toISOString(),
      signal,
      priority,
      message,
      actionRequired: signal.recommendedAction === 'BUY_IMMEDIATELY',
      acknowledged: false,
      executed: false
    };
  }

  /**
   * Calculate alert priority
   */
  private calculatePriority(signal: MomentumSignal): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Critical: New listings, whale activity with high confidence
    if ((signal.signalType === 'NEW_LISTING' || signal.signalType === 'WHALE_ACTIVITY') && 
        signal.confidence > 85 && signal.potentialGainEstimate > 1000) {
      return 'CRITICAL';
    }

    // High: Strong signals with immediate buy recommendation
    if (signal.recommendedAction === 'BUY_IMMEDIATELY' && 
        signal.confidence > 80 && signal.potentialGainEstimate > 500) {
      return 'HIGH';
    }

    // Medium: Good signals worth monitoring
    if (signal.confidence > 70 && signal.potentialGainEstimate > 200) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(signal: MomentumSignal): string {
    const emoji = this.getSignalEmoji(signal.signalType);
    const urgency = signal.recommendedAction === 'BUY_IMMEDIATELY' ? '🚨 URGENT' : '📊';
    
    let message = `${urgency} ${emoji} ${signal.symbol} - ${signal.signalType}\n`;
    message += `💰 Potential Gain: ${signal.potentialGainEstimate}%\n`;
    message += `📈 Current Price: $${signal.price}\n`;
    message += `🎯 Entry: $${signal.entryPrice}\n`;
    message += `🛡️ Stop Loss: $${signal.stopLoss}\n`;
    message += `🔥 Confidence: ${signal.confidence}%\n`;
    message += `⚡ Action: ${signal.recommendedAction}\n`;
    
    if (signal.reasoning.length > 0) {
      message += `📋 Reasons:\n${signal.reasoning.map(r => `• ${r}`).join('\n')}`;
    }

    return message;
  }

  /**
   * Get emoji for signal type
   */
  private getSignalEmoji(signalType: string): string {
    const emojis: { [key: string]: string } = {
      'VOLUME_SPIKE': '📊',
      'SOCIAL_BUZZ': '🔥',
      'WHALE_ACTIVITY': '🐋',
      'NEW_LISTING': '🆕',
      'BREAKOUT': '🚀',
      'INSIDER_FLOW': '💎'
    };
    return emojis[signalType] || '⚡';
  }

  /**
   * Send notifications for alert
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    try {
      // Desktop notification
      if (this.config.enableDesktopNotifications) {
        await this.sendDesktopNotification(alert);
      }

      // Push notification
      if (this.config.enablePushNotifications) {
        await this.sendPushNotification(alert);
      }

      // Email alert
      if (this.config.enableEmailAlerts) {
        await this.sendEmailAlert(alert);
      }

      // SMS alert (for critical alerts only)
      if (this.config.enableSMSAlerts && alert.priority === 'CRITICAL') {
        await this.sendSMSAlert(alert);
      }

      console.log(`🔔 Alert sent for ${alert.signal.symbol}: ${alert.message}`);

    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  /**
   * Send desktop notification
   */
  private async sendDesktopNotification(alert: Alert): Promise<void> {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`${alert.signal.symbol} - ${alert.signal.signalType}`, {
          body: `Potential gain: ${alert.signal.potentialGainEstimate}% | Confidence: ${alert.signal.confidence}%`,
          icon: '/trading-icon.png',
          tag: alert.signal.symbol,
          requireInteraction: alert.priority === 'CRITICAL'
        });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await this.sendDesktopNotification(alert);
        }
      }
    }
  }

  /**
   * Send push notification (mock implementation)
   */
  private async sendPushNotification(alert: Alert): Promise<void> {
    // In production, integrate with push notification service
    console.log('📱 Push notification:', alert.message);
  }

  /**
   * Send email alert (mock implementation)
   */
  private async sendEmailAlert(alert: Alert): Promise<void> {
    // In production, integrate with email service
    console.log('📧 Email alert:', alert.message);
  }

  /**
   * Send SMS alert (mock implementation)
   */
  private async sendSMSAlert(alert: Alert): Promise<void> {
    // In production, integrate with SMS service
    console.log('📱 SMS alert:', alert.message);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Mark alert as executed
   */
  markAlertExecuted(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.executed = true;
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => {
        const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 50): Alert[] {
    return this.alertHistory
      .slice(-limit)
      .reverse();
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(hoursOld: number = 24): number {
    const cutoff = Date.now() - (hoursOld * 60 * 60 * 1000);
    const toRemove: string[] = [];

    this.alerts.forEach((alert, id) => {
      if (new Date(alert.timestamp).getTime() < cutoff && alert.acknowledged) {
        toRemove.push(id);
      }
    });

    toRemove.forEach(id => this.alerts.delete(id));
    return toRemove.length;
  }

  /**
   * Update alert configuration
   */
  updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AlertConfig {
    return { ...this.config };
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): {
    totalAlerts: number;
    criticalAlerts: number;
    acknowledgedAlerts: number;
    executedAlerts: number;
    averageResponseTime: number;
  } {
    const total = this.alertHistory.length;
    const critical = this.alertHistory.filter(a => a.priority === 'CRITICAL').length;
    const acknowledged = this.alertHistory.filter(a => a.acknowledged).length;
    const executed = this.alertHistory.filter(a => a.executed).length;

    // Calculate average response time (mock)
    const avgResponseTime = 5.2; // minutes

    return {
      totalAlerts: total,
      criticalAlerts: critical,
      acknowledgedAlerts: acknowledged,
      executedAlerts: executed,
      averageResponseTime: avgResponseTime
    };
  }
}

export default MomentumAlertService;
