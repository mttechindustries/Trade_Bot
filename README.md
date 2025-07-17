# 🚀 Gemini AI Trading Bot

**A Professional, Real-Time Cryptocurrency Trading Bot with AI-Powered Momentum Detection**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev/)

---

## 🎯 Core Trading Philosophy

[cite_start]This is not just a trading bot; it's an advanced trading system built on a professional, risk-first philosophy[cite: 37, 38]. [cite_start]The strategies and tools within are designed to shift from a defensive mindset of capital preservation to an offensive one of profit maximization, but only when specific, high-conviction criteria are met[cite: 649, 1152].

[cite_start]**The governing principle is to master the art of not losing money first; then, to learn the art of making a lot more**[cite: 651].

---

## ⚡ Key Features & Implemented Strategies

### 🧠 **The Signal Intelligence Engine**
[cite_start]The bot moves beyond simple indicators to a "Signal Convergence" approach, where confidence in a trade is built as multiple, independent data points align[cite: 923, 979].

- [cite_start]**Multi-Factor Analysis**: Fuses on-chain data, social media sentiment, technical indicators, and fundamental catalysts into a unified, actionable signal[cite: 853, 1131].
- **Market Regime Detection**: Automatically identifies if the market is in a `bull`, `bear`, `sideways`, or `volatile` state and adapts its strategy recommendations accordingly.
- [cite_start]**AI-Powered Momentum Hunter**: Uses Google Gemini to scan the market in real-time for high-momentum opportunities, identifying assets with the potential for explosive, multi-day runs[cite: 853, 1131].
- **Data Source Integration**: Leverages **TradingView** for high-quality, aggregated charting data and **DexScreener** for real-time data from decentralized exchanges.

### 📈 **The Offensive Playbook: Maximizing Gains**
[cite_start]Once a high-conviction "runner" is identified, the bot can switch to an offensive mode, employing advanced tactics to maximize profits[cite: 1152]:

- [cite_start]**Pyramiding (Adding to Winners)**: A safe, systematic method for adding to a winning position to dramatically multiply profits without adding significant risk[cite: 682, 1185, 1186]. [cite_start]The Golden Rule is to only add when the stop-loss for the *entire* position can be moved to a point of net profit[cite: 685, 1189].
- [cite_start]**Advanced Exit Strategies**: Utilizes techniques like ATR-based trailing stops and the "Blow-Off Top" exit strategy (based on 1-minute chart structure breaks) to ride a trend to its peak[cite: 729, 1248].

### 🛡️ **Risk-First Framework**
[cite_start]This system is built on a non-negotiable foundation of disciplined risk management[cite: 37, 38, 1063].

- [cite_start]**The 1-2% Rule**: The bot will never risk more than 1-2% of total trading capital on any single trade[cite: 158, 1064, 1147].
- [cite_start]**Calculated Position Sizing**: Position size is always determined by a formula based on account risk, entry price, and stop-loss price, never on emotion[cite: 160, 1067, 1068].
- [cite_start]**Hard Stop-Losses**: All trades are protected by a hard stop-loss order placed at the time of entry[cite: 169, 1072].
- [cite_start]**The "Free Trade"**: A core psychological and risk-management technique where, after taking initial profits, the stop-loss is moved to the breakeven point, making it impossible to lose capital on the remainder of the trade[cite: 702, 1206].

### ⚠️ **Navigating High-Volatility & Manipulation**
The bot is designed to operate in the highly volatile and often manipulated world of micro-cap crypto assets. [cite_start]It understands that the very characteristics that create opportunities for explosive gains are also the source of catastrophic risk[cite: 762, 1128].

- [cite_start]**The Radar's Dilemma**: The system is aware that the on-chain signals of a pump-and-dump scheme are often identical to those of a legitimate breakout[cite: 61, 831].
- [cite_start]**Qualitative Due Diligence**: Before taking a signal from a purely quantitative screener, a professional trader must perform a qualitative check, including verifying the project team, scrutinizing the whitepaper, analyzing community sentiment, and performing on-chain forensics[cite: 138, 139, 141, 142, 144].
- [cite_start]**Exit Feasibility Assessment**: A key pre-trade check is to ensure there is sufficient liquidity to exit the intended position without crashing the price[cite: 1037].

---

## 🛠 Technical Architecture

### Core Technologies
- **React 19.1.0**: Latest React with concurrent features
- **TypeScript**: Full type safety and developer experience
- **Vite**: Fast development and build system
- **WebSocket**: Real-time data streaming
- **Custom State Management**: Event-driven reactive store

### API Integrations
- **TradingView**: For high-quality charting and centralized exchange data.
- **DexScreener**: For real-time data from decentralized exchanges.
- **Gemini AI API**: For intelligent market analysis, sentiment, and trade explanations.
- **Binance API**: For live trading and account management (when configured).

### Services Layer
services/
├── tradingViewService.ts     # NEW: Handles all TradingView data
├── dexscreenerService.ts     # NEW: Handles all DexScreener data
├── realTimeMarketDataService.ts # Manages and aggregates data from multiple sources
├── marketAnalysisService.ts  # The "intelligence engine" of the bot
├── riskManagementService.ts  # Advanced risk calculations and portfolio health
├── portfolioManagementService.ts # Portfolio analysis and optimization
├── strategyOptimizationService.ts # Backtesting and strategy optimization
└── ... and more


---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Gemini API key for AI features
- (Optional) Binance API keys for live trading

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd gemini-trade-bot-ui

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# Start development server
npm run dev
Environment Setup
Create a .env.local file with:

Code snippet

VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_BINANCE_API_KEY=your_binance_api_key (optional)
VITE_BINANCE_SECRET_KEY=your_binance_secret (optional)
🤝 Contributing
Development Setup
Fork the repository

Create feature branch

Install dependencies

Run development server

Make changes and test

Submit pull request

Code Standards
TypeScript: Strict type checking

ESLint: Code quality enforcement

Prettier: Code formatting

Testing: Unit and integration tests

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
