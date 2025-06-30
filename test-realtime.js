// Test script to verify real-time data service
import RealTimeMarketDataService from './services/realTimeMarketDataService.js';

const testRealTimeData = async () => {
  console.log('🧪 Testing Real-Time Market Data Service...');
  
  try {
    const service = RealTimeMarketDataService.getInstance();
    
    // Test 1: Get ticker data
    console.log('📊 Test 1: Getting ticker data...');
    const tickers = await service.getRealTimeTickerData(['BTC/USDT', 'ETH/USDT']);
    console.log('✅ Ticker data received:', tickers);
    
    // Test 2: Get candlestick data
    console.log('📈 Test 2: Getting candlestick data...');
    const candles = await service.getCandlestickData('BTC/USDT', '1h', 10);
    console.log('✅ Candlestick data received:', candles.length, 'candles');
    
    // Test 3: WebSocket subscription
    console.log('🔄 Test 3: Testing WebSocket subscription...');
    const unsubscribe = service.subscribeToRealTimeUpdates(['BTC/USDT'], (data) => {
      console.log('📡 WebSocket update:', data.symbol, '$' + data.price);
    });
    
    // Clean up after 10 seconds
    setTimeout(() => {
      unsubscribe();
      service.disconnect();
      console.log('✅ Test completed successfully!');
    }, 10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testRealTimeData();
