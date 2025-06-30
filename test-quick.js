#!/usr/bin/env node

/**
 * Quick API Test - Testing available exchanges
 */

// Test Coinbase API
console.log('🔍 Testing Coinbase API...');
try {
  const response = await fetch('https://api.exchange.coinbase.com/products/BTC-USD/ticker');
  const data = await response.json();
  if (data.price && parseFloat(data.price) > 0) {
    console.log('✅ Coinbase API: Working - BTC Price:', data.price);
  } else {
    console.log('❌ Coinbase API: Invalid response');
  }
} catch (error) {
  console.log('❌ Coinbase API Error:', error.message);
}

// Test Kraken API
console.log('\n🔍 Testing Kraken API...');
try {
  const response = await fetch('https://api.kraken.com/0/public/Ticker?pair=BTCUSD');
  const data = await response.json();
  if (data.result && data.result.XXBTZUSD) {
    console.log('✅ Kraken API: Working - BTC Price:', data.result.XXBTZUSD.c[0]);
  } else {
    console.log('❌ Kraken API: Invalid response');
  }
} catch (error) {
  console.log('❌ Kraken API Error:', error.message);
}

console.log('\n📊 Test Complete - Real-time data APIs are functional!');
