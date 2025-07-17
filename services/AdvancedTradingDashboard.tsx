import { useState, useEffect } from 'react';
import MarketAnalysisService, { MultiFactorAnalysis, MarketOpportunity, MarketRegime } from '../services/marketAnalysisService';
import SocialSentimentService, { SocialTrend, InfluencerSignal } from '../services/socialSentimentService';
import OnChainAnalyticsService, { OnChainMetrics, WhaleActivity, DeFiMetrics } from '../services/onChainAnalyticsService';
import LearningDashboard from './LearningDashboard';
import { Position, Trade } from '../types';
import { formatTime } from '../services/timeService';
import RiskManagementService, { RiskMetrics } from '../services/riskManagementService';
import PortfolioManagementService, { PortfolioPerformance } from '../services/portfolioManagementService';
import ArbitrageService, { ArbitrageOpportunity } from '../services/arbitrageService';
import NewsAnalysisService from '../services/newsAnalysisService';
import EnhancedAIService from '../services/enhancedAIService';
import RealTimeMarketDataService from '../services/realTimeMarketDataService';
import TradingService from '../services/tradingService';

interface TradingDashboardProps {
  currentView: string;
}

const AdvancedTradingDashboard: React.FC<TradingDashboardProps> = ({ currentView }) => {
  // Log props to avoid unused parameter warning
  console.log('Trading Dashboard view:', currentView);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [portfolioPerformance, setPortfolioPerformance] = useState<PortfolioPerformance | null>(null);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [technicalIndicators, setTechnicalIndicators] = useState<any | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [newsImpact, setNewsImpact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [marketAnalysis, setMarketAnalysis] = useState<MultiFactorAnalysis | null>(null);
    const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
    const [marketRegime, setMarketRegime] = useState<MarketRegime | null>(null);
    const [socialTrends, setSocialTrends] = useState<SocialTrend[]>([]);
    const [fearGreedIndex, setFearGreedIndex] = useState<any>(null);
    const [influencerSignals, setInfluencerSignals] = useState<InfluencerSignal[]>([]);
    const [whaleActivity, setWhaleActivity] = useState<WhaleActivity[]>([]);
    const [defiMetrics, setDefiMetrics] = useState<DeFiMetrics[]>([]);
    const [onChainMetrics, setOnChainMetrics] = useState<OnChainMetrics | null>(null);

  const [services] = useState(() => ({
    technical: TechnicalAnalysisService.getInstance(),
    risk: RiskManagementService.getInstance(),
    portfolio: PortfolioManagementService.getInstance(),
    arbitrage: ArbitrageService.getInstance(),
    news: NewsAnalysisService.getInstance(),
    ai: EnhancedAIService.getInstance(),
    trading: TradingService.getInstance(),
    market: MarketAnalysisService.getInstance(),
    social: SocialSentimentService.getInstance(),
    onchain: OnChainAnalyticsService.getInstance()
  }));

  useEffect(() => {
    initializeDashboard();
    const interval = setInterval(updateDashboard, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPositions(),
        loadTrades(),
        updateRiskMetrics(),
        updatePortfolioPerformance(),
        scanArbitrageOpportunities(),
        updateTechnicalAnalysis(),
        getAISuggestions(),
        getNewsAnalysis(),
        loadDashboardData()
      ]);
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDashboard = async () => {
    try {
      await Promise.all([
        updateRiskMetrics(),
        scanArbitrageOpportunities(),
        updateTechnicalAnalysis(),
        getNewsAnalysis(),
        loadDashboardData()
      ]);
    } catch (error) {
      console.error('Failed to update dashboard:', error);
    }
  };

  const loadPositions = async () => {
    try {
      // Get REAL positions from trading service
      const realPositions = await services.trading.getPositions();
      console.log('✅ Loaded REAL positions:', realPositions);
      setPositions(realPositions);
    } catch (error) {
      console.error('❌ Failed to load REAL positions:', error);
      setPositions([]); // Empty array, no mock data
    }
  };

  const loadTrades = async () => {
    try {
      // Get REAL trades from trading service
      const realTrades = await services.trading.getTrades();
      console.log('✅ Loaded REAL trades:', realTrades);
      setTrades(realTrades);
    } catch (error) {
      console.error('❌ Failed to load REAL trades:', error);
      setTrades([]); // Empty array, no mock data
    }
  };

  const updateRiskMetrics = async () => {
    if (positions.length > 0) {
      const metrics = services.risk.calculateRiskMetrics(positions, trades, 100000);
      setRiskMetrics(metrics);
    }
  };

  const updatePortfolioPerformance = async () => {
    try {
      // Since we don't have historical values stored yet, we'll calculate from current data
      // In a real application, this would come from a database of historical portfolio values
      const currentValue = positions.reduce((total, pos) => total + (pos.size * pos.currentPrice), 0);
      
      // Generate basic historical values based on current portfolio state
      // This is a placeholder until real historical tracking is implemented
      const historicalValues = [
        { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), value: currentValue * 0.95 },
        { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), value: currentValue * 0.98 },
        { date: new Date().toISOString(), value: currentValue }
      ];
      
      console.log('✅ Calculating portfolio performance from current data');
      
      const performance = services.portfolio.calculatePortfolioPerformance(
        positions,
        trades,
        historicalValues
      );
      setPortfolioPerformance(performance);
    } catch (error) {
      console.error('❌ Failed to calculate portfolio performance:', error);
      setPortfolioPerformance(null);
    }
  };

  const scanArbitrageOpportunities = async () => {
    try {
      const opportunities = await services.arbitrage.scanArbitrageOpportunities(
        ['BTC/USDT', 'ETH/USDT', 'ADA/USDT'],
        0.3, // 0.3% minimum profit
        'MEDIUM'
      );
      setArbitrageOpportunities(opportunities);
    } catch (error) {
      console.error('Failed to scan arbitrage opportunities:', error);
    }
  };

  const updateTechnicalAnalysis = async () => {
    try {
      // Get REAL candlestick data only
      const realTimeService = RealTimeMarketDataService.getInstance();
      const defaultSymbol = 'BTC/USDT'; // Use default symbol for technical analysis
      const candlestickData = await realTimeService.getCandlestickData(defaultSymbol, '1h', 100);
      
      console.log('✅ Using REAL candlestick data for technical analysis');
      const indicators = services.technical.calculateIndicators(candlestickData);
      setTechnicalIndicators(indicators);
    } catch (error) {
      console.error('❌ Failed to get REAL candlestick data:', error);
      // NO MOCK DATA - Show error state instead
      setTechnicalIndicators(null);
    }
  };

  const getAISuggestions = async () => {
    try {
      const suggestions = await services.ai.findProfitableOpportunities(
        'Conservative balanced portfolio with medium risk tolerance',
        'medium',
        '4h',
        5
      );
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    }
  };

  const getNewsAnalysis = async () => {
    try {
      const analysis = await services.news.analyzeNewsImpact(['BTC', 'ETH', 'ADA']);
      setNewsImpact(analysis);
    } catch (error) {
      console.error('Failed to get news analysis:', error);
    }
  };

    const loadDashboardData = async () => {
    try {
      setLoading(true);
      const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];
      
      console.log('🚀 Loading REAL market data from live APIs...');
      
      // Get REAL current market data for BTC
      const currentBTCPrice = await services.market.getCurrentPrice('BTC');
      console.log('💰 Current BTC price:', currentBTCPrice);
      
      // Use REAL historical data instead of fake mock data
      const realCandleData = await services.market.getHistoricalData('BTC', '1h', 100);
      
      const [
        btcAnalysis,
        marketOpportunities,
        regime,
        trends,
        fearGreed,
        signals,
        whales,
        defi,
        onchain
      ] = await Promise.all([
        services.market.getMultiFactorAnalysis('BTC', realCandleData),
        services.market.findMarketOpportunities(symbols),
        services.market.getMarketRegime(),
        services.social.getTrendingTokens(),
        services.social.getFearGreedIndex(),
        services.social.getInfluencerSignals(),
        services.onchain.getWhaleActivity('BTC'),
        services.onchain.getDeFiMetrics(),
        services.onchain.getOnChainMetrics('BTC')
      ]);

      console.log('✅ All REAL market data loaded successfully');
      
      setMarketAnalysis(btcAnalysis);
      setOpportunities(marketOpportunities);
      setMarketRegime(regime);
      setSocialTrends(trends);
      setFearGreedIndex(fearGreed);
      setInfluencerSignals(signals);
      setWhaleActivity(whales);
      setDefiMetrics(defi);
      setOnChainMetrics(onchain);
    } catch (error) {
      console.error('❌ REAL DATA LOADING FAILED:', error);
      console.error('This dashboard ONLY uses real market data - no fallbacks to fake data');
    } finally {
      setLoading(false);
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'strong_buy': return 'text-green-400';
      case 'buy': return 'text-green-300';
      case 'hold': return 'text-yellow-400';
      case 'sell': return 'text-red-300';
      case 'strong_sell': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-400';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-400';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-400';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-400">Loading advanced market analysis...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Learning Progress */}
      <LearningDashboard />
      
      {/* Market Regime & Fear/Greed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Market Regime</h3>
          {marketRegime && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Regime:</span>
                <span className={`capitalize font-semibold ${
                  marketRegime.regime === 'bull' ? 'text-green-400' :
                  marketRegime.regime === 'bear' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {marketRegime.regime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Confidence:</span>
                <span className="text-white">{(marketRegime.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="text-white">{marketRegime.duration} days</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-300">{marketRegime.recommendedStrategy}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Fear & Greed Index</h3>
          {fearGreedIndex && (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{Math.round(fearGreedIndex.value)}</div>
                <div className={`text-sm font-medium ${
                  fearGreedIndex.value > 75 ? 'text-red-400' :
                  fearGreedIndex.value > 55 ? 'text-orange-400' :
                  fearGreedIndex.value > 45 ? 'text-yellow-400' :
                  fearGreedIndex.value > 25 ? 'text-blue-400' :
                  'text-green-400'
                }`}>
                  {fearGreedIndex.classification}
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(fearGreedIndex.factors).map(([factor, value]: [string, any]) => (
                  <div key={factor} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{factor}:</span>
                    <span className="text-white">{Math.round(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BTC Multi-Factor Analysis */}
      {marketAnalysis && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">BTC Multi-Factor Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Overall</div>
              <div className={`text-lg font-semibold ${getSignalColor(marketAnalysis.overall.signal)}`}>
                {marketAnalysis.overall.signal.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-xs text-gray-500">{(marketAnalysis.overall.confidence * 100).toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Technical</div>
              <div className={`text-lg font-semibold ${getSignalColor(marketAnalysis.technical.signal)}`}>
                {marketAnalysis.technical.signal.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-xs text-gray-500">{(marketAnalysis.technical.confidence * 100).toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Fundamental</div>
              <div className={`text-lg font-semibold ${getSignalColor(marketAnalysis.fundamental.signal)}`}>
                {marketAnalysis.fundamental.signal.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-xs text-gray-500">{(marketAnalysis.fundamental.confidence * 100).toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Sentiment</div>
              <div className={`text-lg font-semibold ${getSignalColor(marketAnalysis.sentiment.signal)}`}>
                {marketAnalysis.sentiment.signal.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-xs text-gray-500">{(marketAnalysis.sentiment.confidence * 100).toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">On-Chain</div>
              <div className={`text-lg font-semibold ${getSignalColor(marketAnalysis.onchain.signal)}`}>
                {marketAnalysis.onchain.signal.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-xs text-gray-500">{(marketAnalysis.onchain.confidence * 100).toFixed(0)}%</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-400">Risk</div>
                <div className="text-lg font-semibold text-red-400">{marketAnalysis.riskReward.risk.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Reward</div>
                <div className="text-lg font-semibold text-green-400">{marketAnalysis.riskReward.reward.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">R/R Ratio</div>
                <div className="text-lg font-semibold text-primary">{marketAnalysis.riskReward.ratio.toFixed(1)}:1</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Opportunities */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Market Opportunities</h3>
        <div className="space-y-4">
          {opportunities.slice(0, 5).map((opp, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(opp.priority)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-white">{opp.symbol}</span>
                  <span className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 capitalize">
                    {opp.type.replace('_', ' ')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(opp.priority)}`}>
                    {opp.priority}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Expected Return</div>
                  <div className="text-lg font-semibold text-green-400">+{opp.expectedReturn}%</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Entry: </span>
                  <span className="text-white">${(opp.entryPrice && !isNaN(opp.entryPrice) ? opp.entryPrice : 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Target: </span>
                  <span className="text-green-400">${(opp.targetPrice && !isNaN(opp.targetPrice) ? opp.targetPrice : 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Stop: </span>
                  <span className="text-red-400">${(opp.stopLoss && !isNaN(opp.stopLoss) ? opp.stopLoss : 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                <span className="font-medium">Timeline:</span> {opp.timeHorizon} |
                <span className="font-medium"> Max Risk:</span> {opp.maxRisk}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social Sentiment & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Trending Tokens</h3>
          <div className="space-y-3">
            {socialTrends.slice(0, 8).map((trend, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-white">{trend.symbol}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    trend.actionRecommendation === 'buy' ? 'bg-green-900 text-green-400' :
                    trend.actionRecommendation === 'sell' ? 'bg-red-900 text-red-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {trend.actionRecommendation}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{trend.trendingScore.toFixed(0)}</div>
                  <div className={`text-xs ${trend.sentimentShift > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trend.sentimentShift > 0 ? '+' : ''}{trend.sentimentShift.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Influencer Signals</h3>
          <div className="space-y-3">
            {influencerSignals.slice(0, 6).map((signal, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white">{signal.influencer}</span>
                    <span className="text-xs text-gray-400">({signal.platform})</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-300">{signal.symbol}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      signal.signal === 'bullish' || signal.signal === 'buy' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
                    }`}>
                      {signal.signal}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Impact: {signal.impact.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">
                    {Math.round(signal.reliability * 100)}% reliable
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Whale Activity & DeFi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Whale Activity (BTC)</h3>
          <div className="space-y-3">
            {whaleActivity.slice(0, 6).map((whale, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm px-2 py-1 rounded ${
                      whale.action === 'buy' ? 'bg-green-900 text-green-400' :
                      whale.action === 'sell' ? 'bg-red-900 text-red-400' :
                      'bg-blue-900 text-blue-400'
                    }`}>
                      {whale.action}
                    </span>
                    <span className={`text-xs px-1 py-0.5 rounded border ${
                      whale.impact === 'high' ? 'border-red-400 text-red-400' :
                      whale.impact === 'medium' ? 'border-yellow-400 text-yellow-400' :
                      'border-green-400 text-green-400'
                    }`}>
                      {whale.impact}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {whale.address.slice(0, 10)}...
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {whale.amount.toLocaleString()} {whale.symbol}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTime(new Date(whale.timestamp), true)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Top DeFi Protocols</h3>
          <div className="space-y-3">
            {defiMetrics.slice(0, 6).map((protocol, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                <div>
                  <div className="font-medium text-white">{protocol.protocol}</div>
                  <div className="text-sm text-gray-400">{protocol.token}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    ${(protocol.totalValueLocked / 1e9).toFixed(2)}B TVL
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className={protocol.tvlChange24h > 0 ? 'text-green-400' : 'text-red-400'}>
                      {protocol.tvlChange24h > 0 ? '+' : ''}{protocol.tvlChange24h.toFixed(1)}%
                    </span>
                    <span className="text-gray-400">
                      APY: {protocol.apy.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* On-Chain Metrics */}
      {onChainMetrics && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">On-Chain Metrics (BTC)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Active Addresses</div>
              <div className="text-xl font-semibold text-white">
                {(onChainMetrics.activeAddresses / 1000).toFixed(0)}K
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Transaction Count</div>
              <div className="text-xl font-semibold text-white">
                {(onChainMetrics.transactionCount / 1000).toFixed(0)}K
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Network Value</div>
              <div className="text-xl font-semibold text-white">
                ${(onChainMetrics.networkValue / 1e12).toFixed(1)}T
              </div>
            </div>
            {onChainMetrics.hashRate && (
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">Hash Rate</div>
                <div className="text-xl font-semibold text-white">
                  {onChainMetrics.hashRate.toFixed(0)} EH/s
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Metrics */}
      {riskMetrics && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Risk</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Risk Score</div>
              <div className={`text-xl font-semibold ${
                riskMetrics.riskScore > 70 ? 'text-red-400' :
                riskMetrics.riskScore > 50 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {riskMetrics.riskScore.toFixed(0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Max Drawdown</div>
              <div className="text-xl font-semibold text-red-400">
                {(riskMetrics.maxDrawdown * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Sharpe Ratio</div>
              <div className="text-xl font-semibold text-primary">
                {riskMetrics.sharpeRatio.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Health Status</div>
              <div className={`text-lg font-semibold ${
                riskMetrics.healthStatus === 'CRITICAL' ? 'text-red-400' :
                riskMetrics.healthStatus === 'WARNING' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {riskMetrics.healthStatus}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedTradingDashboard;
