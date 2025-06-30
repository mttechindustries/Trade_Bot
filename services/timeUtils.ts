import { TimeService } from './timeService';

/**
 * Centralized time utilities to ensure consistent time handling across the application
 * All services should use these utilities instead of Date.now() or new Date()
 */

export class TimeUtils {
  /**
   * Get current timestamp - use this instead of Date.now()
   */
  static now(): number {
    return TimeService.now();
  }

  /**
   * Get current Date object - use this instead of new Date()
   */
  static getCurrentDate(): Date {
    return TimeService.getCurrentTime();
  }

  /**
   * Create a date from timestamp, ensuring consistency
   */
  static fromTimestamp(timestamp: number): Date {
    return new Date(timestamp);
  }

  /**
   * Get timestamp for X minutes ago
   */
  static minutesAgo(minutes: number): number {
    return this.now() - (minutes * 60 * 1000);
  }

  /**
   * Get timestamp for X hours ago
   */
  static hoursAgo(hours: number): number {
    return this.now() - (hours * 60 * 60 * 1000);
  }

  /**
   * Get timestamp for X days ago
   */
  static daysAgo(days: number): number {
    return this.now() - (days * 24 * 60 * 60 * 1000);
  }

  /**
   * Get timestamp for X weeks ago
   */
  static weeksAgo(weeks: number): number {
    return this.now() - (weeks * 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Format timestamp to ISO string
   */
  static toISOString(timestamp?: number): string {
    const date = timestamp ? new Date(timestamp) : this.getCurrentDate();
    return date.toISOString();
  }

  /**
   * Check if a timestamp is within a certain timeframe
   */
  static isWithinTimeframe(timestamp: number, timeframeMs: number): boolean {
    return (this.now() - timestamp) <= timeframeMs;
  }

  /**
   * Get trading session info
   */
  static getMarketSession() {
    return TimeService.getMarketSession();
  }

  /**
   * Check if markets are open
   */
  static areMarketsOpen(): boolean {
    return TimeService.areMarketsOpen();
  }

  /**
   * Format time for display
   */
  static formatTime(date?: Date, includeSeconds = false): string {
    return TimeService.formatTime(date, includeSeconds);
  }

  /**
   * Format date for display
   */
  static formatDate(date?: Date): string {
    return TimeService.formatDate(date);
  }

  /**
   * Get time ago string
   */
  static getTimeAgo(pastTime: Date | string | number): string {
    const past = typeof pastTime === 'number' ? new Date(pastTime) : 
                 typeof pastTime === 'string' ? new Date(pastTime) : pastTime;
    return TimeService.getTimeAgo(past);
  }

  /**
   * Generate historical timestamps for mock data
   */
  static generateHistoricalTimestamps(count: number, intervalMs: number): number[] {
    const timestamps: number[] = [];
    const startTime = this.now() - (count * intervalMs);
    
    for (let i = 0; i < count; i++) {
      timestamps.push(startTime + (i * intervalMs));
    }
    
    return timestamps;
  }

  /**
   * Generate random timestamp within a range
   */
  static randomTimestampInRange(startTime: number, endTime: number): number {
    return startTime + Math.random() * (endTime - startTime);
  }

  /**
   * Check if timestamp is during market hours
   */
  static isDuringMarketHours(timestamp: number): boolean {
    const date = new Date(timestamp);
    const easternTime = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hours = easternTime.getHours();
    const minutes = easternTime.getMinutes();
    const dayOfWeek = easternTime.getDay();
    const currentTimeMinutes = hours * 60 + minutes;
    
    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Market hours: 9:30 AM - 4:00 PM ET
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = 16 * 60; // 4:00 PM
    
    return currentTimeMinutes >= marketOpen && currentTimeMinutes < marketClose;
  }

  /**
   * Get next market open time
   */
  static getNextMarketOpen(): Date {
    const now = this.getCurrentDate();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    let nextOpen = new Date(easternTime);
    nextOpen.setHours(9, 30, 0, 0); // 9:30 AM ET
    
    // If it's already past market open today, move to next trading day
    if (easternTime.getHours() >= 9 && easternTime.getMinutes() >= 30) {
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    // Skip weekends
    while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    return nextOpen;
  }

  /**
   * Get next market close time
   */
  static getNextMarketClose(): Date {
    const now = this.getCurrentDate();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    let nextClose = new Date(easternTime);
    nextClose.setHours(16, 0, 0, 0); // 4:00 PM ET
    
    // If it's already past market close today, move to next trading day
    if (easternTime.getHours() >= 16) {
      nextClose.setDate(nextClose.getDate() + 1);
    }
    
    // Skip weekends
    while (nextClose.getDay() === 0 || nextClose.getDay() === 6) {
      nextClose.setDate(nextClose.getDate() + 1);
    }
    
    return nextClose;
  }
}

// Export commonly used functions
export const timeNow = () => TimeUtils.now();
export const getCurrentDate = () => TimeUtils.getCurrentDate();
export const hoursAgo = (hours: number) => TimeUtils.hoursAgo(hours);
export const daysAgo = (days: number) => TimeUtils.daysAgo(days);
export const minutesAgo = (minutes: number) => TimeUtils.minutesAgo(minutes);
export const formatTime = (date?: Date) => TimeUtils.formatTime(date);
export const formatDate = (date?: Date) => TimeUtils.formatDate(date);
export const getTimeAgo = (pastTime: Date | string | number) => TimeUtils.getTimeAgo(pastTime);

export default TimeUtils;
