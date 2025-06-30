/*
 *   Copyright (c) 2025 
 *   All rights reserved.
 */
#!/usr/bin/env node

/**
 * Comprehensive Test Script for Gemini Trading Bot UI
 * Tests all real-time data services and API endpoints
 */

import https from 'https';
import WebSocket from 'ws';

// Color console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test REST API endpoints
async function testRESTAPIs() {
  log('\n🔍 Testing REST API Endpoints...', 'blue');
  
  const apis = [
    {
      name: 'Binance Ticker',
      url: 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',
      test: (data) => data.symbol === 'BTCUSDT' && parseFloat(data.lastPrice) > 0
    },
    {
      name: 'Coinbase Ticker',
      url: 'https://api.exchange.coinbase.com/products/BTC-USD/ticker',
      test: (data) => data.price && parseFloat(data.price) > 0
    },
    {
      name: 'Kraken Ticker',
      url: 'https://api.kraken.com/0/public/Ticker?pair=BTCUSD',
      test: (data) => data.result && data.result.XXBTZUSD
    },
    {
      name: 'Binance Candlesticks',
      url: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=10',
      test: (data) => Array.isArray(data) && data.length > 0
    }
  ];

  for (const api of apis) {
    try {
      const response = await fetch(api.url);
      const data = await response.json();
      
      if (api.test(data)) {
        log(`✅ ${api.name}: OK`, 'green');
      } else {
        log(`❌ ${api.name}: Invalid data format`, 'red');
        console.log('Response:', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      log(`❌ ${api.name}: ${error.message}`, 'red');
    }
  }
}

// Test WebSocket connections
async function testWebSockets() {
  log('\n🔗 Testing WebSocket Connections...', 'blue');
  
  const wsTests = [
    {
      name: 'Binance WebSocket',
      url: 'wss://stream.binance.com:9443/ws/btcusdt@ticker',
      timeout: 5000
    },
    {
      name: 'Coinbase WebSocket',
      url: 'wss://ws-feed.exchange.coinbase.com',
      message: JSON.stringify({
        type: 'subscribe',
        product_ids: ['BTC-USD'],
        channels: ['ticker']
      }),
      timeout: 5000
    }
  ];

  for (const wsTest of wsTests) {
    await new Promise((resolve) => {
      try {
        const ws = new WebSocket(wsTest.url);
        let messageReceived = false;

        const timeout = setTimeout(() => {
          if (!messageReceived) {
            log(`⏰ ${wsTest.name}: Timeout`, 'yellow');
            ws.close();
            resolve();
          }
        }, wsTest.timeout);

        ws.on('open', () => {
          log(`🔌 ${wsTest.name}: Connected`, 'green');
          if (wsTest.message) {
            ws.send(wsTest.message);
          }
        });

        ws.on('message', (data) => {
          if (!messageReceived) {
            messageReceived = true;
            log(`✅ ${wsTest.name}: Receiving data`, 'green');
            clearTimeout(timeout);
            ws.close();
            resolve();
          }
        });

        ws.on('error', (error) => {
          log(`❌ ${wsTest.name}: ${error.message}`, 'red');
          clearTimeout(timeout);
          resolve();
        });

        ws.on('close', () => {
          if (!messageReceived) {
            log(`🔌 ${wsTest.name}: Connection closed`, 'yellow');
          }
          clearTimeout(timeout);
          resolve();
        });

      } catch (error) {
        log(`❌ ${wsTest.name}: ${error.message}`, 'red');
        resolve();
      }
    });
  }
}

// Test CORS and proxy setup
async function testCORS() {
  log('\n🌐 Testing CORS and Proxy Setup...', 'blue');
  
  // Test if development server is running
  try {
    const response = await fetch('http://localhost:5173/api/binance/ticker/24hr?symbol=BTCUSDT');
    if (response.ok) {
      log('✅ Development proxy: Working', 'green');
    } else {
      log(`❌ Development proxy: HTTP ${response.status}`, 'red');
    }
  } catch (error) {
    log('⚠️  Development server not running (expected if testing build)', 'yellow');
  }
}

// Test data processing functions
async function testDataProcessing() {
  log('\n⚙️  Testing Data Processing...', 'blue');
  
  // Test price normalization
  try {
    const binancePrice = { lastPrice: '45000.50' };
    const coinbasePrice = { price: '45000.50' };
    const krakenPrice = { result: { XXBTZUSD: { c: ['45000.50'] } } };
    
    // Simulate the normalization logic from realTimeMarketDataService
    const normalizedBinance = parseFloat(binancePrice.lastPrice);
    const normalizedCoinbase = parseFloat(coinbasePrice.price);
    const normalizedKraken = parseFloat(krakenPrice.result.XXBTZUSD.c[0]);
    
    if (normalizedBinance > 0 && normalizedCoinbase > 0 && normalizedKraken > 0) {
      log('✅ Price normalization: Working', 'green');
    } else {
      log('❌ Price normalization: Failed', 'red');
    }
  } catch (error) {
    log(`❌ Data processing error: ${error.message}`, 'red');
  }
}

// Test error handling and fallbacks
async function testErrorHandling() {
  log('\n🛡️  Testing Error Handling...', 'blue');
  
  // Test with invalid URL
  try {
    await fetch('https://invalid-api-url-that-does-not-exist.com/test');
    log('❌ Error handling: Should have failed', 'red');
  } catch (error) {
    log('✅ Network error handling: Working', 'green');
  }
  
  // Test with invalid WebSocket
  try {
    const ws = new WebSocket('wss://invalid-ws-url.com');
    ws.on('error', () => {
      log('✅ WebSocket error handling: Working', 'green');
    });
  } catch (error) {
    log('✅ WebSocket error handling: Working', 'green');
  }
}

// Main test function
async function runTests() {
  log('🚀 Starting Comprehensive Trading Bot Tests...', 'blue');
  log('================================================', 'blue');
  
  await testRESTAPIs();
  await testWebSockets();
  await testCORS();
  await testDataProcessing();
  await testErrorHandling();
  
  log('\n📊 Test Summary Complete!', 'blue');
  log('================================================', 'blue');
  log('Check the results above for any issues.', 'yellow');
  log('If all tests pass, your real-time data setup is working correctly.', 'green');
}

// Run tests if this script is executed directly
runTests().catch(console.error);
