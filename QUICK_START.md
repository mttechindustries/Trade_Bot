# 🚀 Quick Start Guide

## Professional Trading Platform Setup

### Prerequisites
- Node.js 18+ ([Download here](https://nodejs.org/))
- npm (comes with Node.js)

### Installation

1. **Quick Setup** (Recommended)
   ```bash
   ./setup.sh
   ```

2. **Manual Setup**
   ```bash
   npm install
   cp .env.example .env
   # Edit .env with your API keys
   npm run dev
   ```

### API Keys Required

Add these to your `.env` file:

```env
# Gemini Exchange (for live trading)
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_SECRET_KEY=your_gemini_secret

# News Analysis
VITE_NEWS_API_KEY=your_newsapi_key
VITE_CRYPTO_PANIC_API_KEY=your_cryptopanic_key

# Market Data (optional - has free tier)
VITE_BINANCE_API_KEY=your_binance_api_key
VITE_BINANCE_SECRET_KEY=your_binance_secret

# Environment
VITE_ENVIRONMENT=development
```

### Getting API Keys

1. **Gemini**: [Create Account](https://www.gemini.com/) → API Settings
2. **NewsAPI**: [Get Free Key](https://newsapi.org/register)
3. **CryptoPanic**: [Register](https://cryptopanic.com/developers/)
4. **Binance**: [Create Account](https://www.binance.com/) → API Management (optional)

### Features Available

✅ **Live Trading Dashboard**
- Real-time P&L tracking
- Open positions monitoring
- Trade history analysis

✅ **Advanced Analytics**
- Multi-factor market analysis
- AI-powered trading suggestions
- Social sentiment monitoring
- On-chain whale tracking

✅ **Intelligent Alerts**
- Smart opportunity detection
- Risk management warnings
- Market regime changes
- Whale activity notifications

✅ **Performance Tracking**
- Win rate and profit factor
- Sharpe ratio calculation
- Drawdown monitoring
- Fee optimization

### First Time Usage

1. Start with **paper trading** to test strategies
2. Configure your **risk parameters** in Settings
3. Enable **intelligent alerts** for opportunities
4. Monitor **performance metrics** to refine approach
5. Gradually transition to **live trading** with small amounts

### Support

- Check `IMPLEMENTATION_SUMMARY.md` for detailed features
- Review individual service files for API documentation
- TypeScript interfaces in `types.ts` show all data structures

### Safety First

⚠️ **Important**: 
- Never commit API keys to version control
- Start with small amounts for live trading
- Always use stop losses
- Monitor risk metrics closely

---

**Ready to trade like a pro!** 🎯
