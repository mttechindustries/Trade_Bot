#!/bin/bash

echo "🚀 Starting Professional Trading Platform Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📦 Node.js not found. Please install Node.js 18+ first:"
    echo "   Visit: https://nodejs.org/en/download/"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "📦 npm not found. Please install npm first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo "✅ npm $(npm --version) detected"

# Navigate to project directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating environment configuration..."
    cp .env.example .env
    echo "📝 Please edit .env file with your API keys:"
    echo "   - VITE_GEMINI_API_KEY"
    echo "   - VITE_NEWS_API_KEY"
    echo "   - VITE_CRYPTO_PANIC_API_KEY"
    echo "   - VITE_BINANCE_API_KEY"
    echo "   - VITE_BINANCE_SECRET_KEY"
    echo ""
fi

echo "🎯 Setup complete! To start the platform:"
echo "   npm run dev"
echo ""
echo "🌐 The platform will be available at: http://localhost:5173"
echo ""
echo "📊 Features included:"
echo "   ✅ Advanced Market Analysis"
echo "   ✅ AI-Powered Trading Suggestions"
echo "   ✅ Social Sentiment Monitoring"
echo "   ✅ On-Chain Analytics"
echo "   ✅ Intelligent Alert System"
echo "   ✅ Real-Time Performance Tracking"
echo "   ✅ Risk Management Tools"
echo ""
echo "🔐 Security Note: Never commit your .env file with real API keys!"
echo ""

# Ask if user wants to start the dev server
read -p "🚀 Start the development server now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌟 Starting development server..."
    npm run dev
fi
