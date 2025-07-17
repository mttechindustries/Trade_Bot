import { TickerData, CandlestickData } from '../types';
import { tradingViewDatafeed } from './tradingViewDatafeed';

class TradingViewService {
  private static instance: TradingViewService;
  private datafeed: any;

  private constructor() {
    this.datafeed = new tradingViewDatafeed({
      debug: true,
    });
  }

  public static getInstance(): TradingViewService {
    if (!TradingViewService.instance) {
      TradingViewService.instance = new TradingViewService();
    }
    return TradingViewService.instance;
  }

  public async getTickerData(symbol: string): Promise<TickerData> {
    return new Promise((resolve, reject) => {
      this.datafeed.resolveSymbol(symbol, (symbolInfo: any) => {
        // The datafeed doesn't directly provide ticker data in the format we need.
        // We will need to get the latest bar and format it as TickerData.
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        this.datafeed.getBars(symbolInfo, '1D', yesterday.getTime() / 1000, now.getTime() / 1000, (bars: any) => {
          if (bars.length > 0) {
            const latestBar = bars[bars.length - 1];
            const tickerData: TickerData = {
              symbol: symbolInfo.name,
              price: latestBar.close,
              change24h: latestBar.close - bars[bars.length - 2].close,
              changePercent24h: ((latestBar.close - bars[bars.length - 2].close) / bars[bars.length - 2].close) * 100,
              volume24h: latestBar.volume,
              high24h: latestBar.high,
              low24h: latestBar.low,
              timestamp: latestBar.time,
              lastUpdate: new Date().getTime(),
            };
            resolve(tickerData);
          } else {
            reject(new Error('No bars found for the symbol.'));
          }
        }, (error: any) => {
          reject(error);
        }, { firstDataRequest: true });
      }, (error: any) => {
        reject(error);
      });
    });
  }

  public async getCandlestickData(symbol: string, interval: string, limit: number): Promise<CandlestickData[]> {
    return new Promise((resolve, reject) => {
      this.datafeed.resolveSymbol(symbol, (symbolInfo: any) => {
        const now = new Date();
        const from = new Date(now);
        // This is a rough estimation of the start date.
        // A more accurate calculation would depend on the interval.
        from.setDate(from.getDate() - (limit * this.intervalToDays(interval)));

        this.datafeed.getBars(symbolInfo, interval, from.getTime() / 1000, now.getTime() / 1000, (bars: any) => {
          const candlestickData: CandlestickData[] = bars.map((bar: any) => ({
            symbol: symbolInfo.name,
            timestamp: bar.time,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: bar.volume,
          }));
          resolve(candlestickData);
        }, (error: any) => {
          reject(error);
        });
      }, (error: any) => {
        reject(error);
      });
    });
  }

  private intervalToDays(interval: string): number {
    switch (interval) {
      case '1':
      case '5':
      case '15':
      case '30':
      case '60':
        return 1; // Intra-day intervals
      case '1D':
        return 1;
      case '1W':
        return 7;
      case '1M':
        return 30;
      default:
        return 1;
    }
  }
}

export default TradingViewService;
