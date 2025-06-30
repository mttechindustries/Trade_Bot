/**
 * Time Service - Centralized time management for the trading platform
 * Handles timezone-aware time operations for trading hours and market data
 */

export class TimeService {
  /**
   * Get the current time in Detroit (Eastern) timezone
   */
  static getCurrentTime(): Date {
    return new Date();
  }

  /**
   * Get current timestamp in milliseconds
   */
  static now(): number {
    return Date.now();
  }

  /**
   * Get current time formatted for Detroit timezone
   */
  static getCurrentTimeInDetroit(): Date {
    const now = new Date();
    // Convert to Detroit/Eastern timezone
    const detroitTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Detroit"}));
    return detroitTime;
  }

  /**
   * Check if markets are currently open (US market hours in Eastern Time)
   */
  static areMarketsOpen(): boolean {
    // Get current time in Detroit/Eastern timezone
    const easternTime = this.getCurrentTimeInDetroit();
    const hours = easternTime.getHours();
    const minutes = easternTime.getMinutes();
    const dayOfWeek = easternTime.getDay();
    
    // Weekend check (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // US market hours: 9:30 AM - 4:00 PM Eastern Time
    const marketOpenTime = 9 * 60 + 30; // 9:30 AM in minutes
    const marketCloseTime = 16 * 60; // 4:00 PM in minutes
    const currentTimeMinutes = hours * 60 + minutes;
    
    return currentTimeMinutes >= marketOpenTime && currentTimeMinutes < marketCloseTime;
  }

  /**
   * Get market session info based on Eastern Time
   */
  static getMarketSession(): {
    isOpen: boolean;
    session: 'pre-market' | 'market' | 'after-market' | 'closed';
    nextOpen?: Date;
    nextClose?: Date;
  } {
    const now = this.getCurrentTime();
    
    // Convert to Eastern Time
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hours = easternTime.getHours();
    const minutes = easternTime.getMinutes();
    const dayOfWeek = easternTime.getDay();
    const currentTimeMinutes = hours * 60 + minutes;
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        isOpen: false,
        session: 'closed'
      };
    }

    const preMarketStart = 4 * 60; // 4:00 AM
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM
    const afterMarketEnd = 20 * 60; // 8:00 PM

    if (currentTimeMinutes >= preMarketStart && currentTimeMinutes < marketOpen) {
      return {
        isOpen: false,
        session: 'pre-market'
      };
    } else if (currentTimeMinutes >= marketOpen && currentTimeMinutes < marketClose) {
      return {
        isOpen: true,
        session: 'market'
      };
    } else if (currentTimeMinutes >= marketClose && currentTimeMinutes < afterMarketEnd) {
      return {
        isOpen: false,
        session: 'after-market'
      };
    } else {
      return {
        isOpen: false,
        session: 'closed'
      };
    }
  }

  /**
   * Format time for display in Eastern timezone
   */
  static formatTime(date?: Date, includeSeconds = false): string {
    const time = date || this.getCurrentTime();
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds && { second: '2-digit' }),
      hour12: true,
      timeZone: 'America/Detroit' // Use Detroit timezone specifically
    };
    return time.toLocaleTimeString('en-US', options);
  }

  /**
   * Format date for display
   */
  static formatDate(date?: Date): string {
    const time = date || this.getCurrentTime();
    return time.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Detroit' // Use Detroit timezone specifically
    });
  }

  /**
   * Get time ago string (e.g., "2 minutes ago")
   */
  static getTimeAgo(pastTime: Date | string): string {
    const past = typeof pastTime === 'string' ? new Date(pastTime) : pastTime;
    const now = this.getCurrentTime();
    const diffMs = now.getTime() - past.getTime();
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }

  /**
   * Generate realistic historical timestamps
   */
  static generateHistoricalTime(daysAgo: number, hoursAgo = 0, minutesAgo = 0): Date {
    const now = this.getCurrentTime();
    const ms = (daysAgo * 24 * 60 * 60 * 1000) + 
               (hoursAgo * 60 * 60 * 1000) + 
               (minutesAgo * 60 * 1000);
    return new Date(now.getTime() - ms);
  }

  /**
   * Get trading day boundaries in UTC
   */
  static getTradingDayBounds(date?: Date): { start: Date; end: Date } {
    const target = date || this.getCurrentTime();
    
    // Create Eastern timezone date
    const easternDate = new Date(target.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    // Market opens at 9:30 AM ET, closes at 4:00 PM ET
    const start = new Date(easternDate);
    start.setHours(9, 30, 0, 0);
    
    const end = new Date(easternDate);
    end.setHours(16, 0, 0, 0);
    
    // Convert back to current timezone
    const startUTC = new Date(start.toLocaleString("en-US", {timeZone: "UTC"}));
    const endUTC = new Date(end.toLocaleString("en-US", {timeZone: "UTC"}));
    
    return { start: startUTC, end: endUTC };
  }

  /**
   * Get current timezone offset for Detroit (Eastern) Time
   */
  static getEasternTimezoneOffset(): number {
    const now = this.getCurrentTime();
    const detroitTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Detroit"}));
    const utcTime = new Date(now.toLocaleString("en-US", {timeZone: "UTC"}));
    return (utcTime.getTime() - detroitTime.getTime()) / (1000 * 60 * 60); // hours
  }

  /**
   * Convert any date to Detroit (Eastern) Time
   */
  static toEasternTime(date: Date): Date {
    return new Date(date.toLocaleString("en-US", {timeZone: "America/Detroit"}));
  }
}

// Export convenience functions
export const getCurrentTime = () => TimeService.getCurrentTime();
export const now = () => TimeService.now();
export const areMarketsOpen = () => TimeService.areMarketsOpen();
export const getMarketSession = () => TimeService.getMarketSession();
export const formatTime = (date?: Date, includeSeconds = false) => 
  TimeService.formatTime(date, includeSeconds);
export const formatDate = (date?: Date) => TimeService.formatDate(date);
export const getTimeAgo = (pastTime: Date | string) => TimeService.getTimeAgo(pastTime);
