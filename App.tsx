import { useState, useEffect } from 'react';
import { Trade, BotStatus } from './types';
import { tradingStore } from './store/tradingStore';
import PaperTradingService from './services/paperTradingService';
import TradingService from './services/tradingService';
import RealTimeMarketDataService from './services/realTimeMarketDataService';
import { safeToFixed } from './utils/formatters';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import BacktestView from './components/BacktestView';
import MarketScreenerView from './components/MarketScreenerView';
import NotificationSystem from './components/NotificationSystem';
import RealTimePriceTicker from './components/RealTimePriceTicker';
import ConfigurationPanel from './components/ConfigurationPanel';
import AdvancedTradingDashboard from './components/AdvancedTradingDashboard';
import AlertPanel from './components/AlertPanel';
import PaperTradingControls from './components/PaperTradingControls';
import MomentumHunterDashboard from './components/MomentumHunterDashboard';

type View = 'dashboard' | 'backtest' | 'screener' | 'settings' | 'advanced' | 'paper-trading' | 'momentum-hunter';

const App: React.FC = () => {
  console.log('App component rendering');
  
  // Fallback state if API data loading fails
  const [fallbackMode, setFallbackMode] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [botStatus, setBotStatus] = useState<BotStatus>(BotStatus.STOPPED);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Add error boundary to catch rendering errors
  useEffect(() => {
    console.log('App mounted');
    
    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error caught:', event.error);
      setFallbackMode(true);
      setApiError(event.error?.message || 'Unknown error occurred');
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      setFallbackMode(true);
      setApiError(event.reason?.message || 'API request failed');
    });
  }, []);

  // Initialize with real-time data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Initialize real-time market data service
        const realTimeService = RealTimeMarketDataService.getInstance();
        setIsConnected(true);
        
        console.log('Fetching initial market data...');
        
        // Create some initial demo trades using real-time data
        try {
          const tickers = await realTimeService.getTickerData(['BTC/USDT', 'ETH/USDT']);
          console.log('Initial tickers received:', tickers);
          
          if (tickers && tickers.length >= 2) {
            const btcData = tickers[0];
            const ethData = tickers[1];
            
            if (btcData && ethData) {
              console.log('Creating sample trades with ticker data:', btcData);
              
              // Create a sample open trade with real current price
              const sampleOpenTrade: Trade = {
                id: '1',
                pair: 'BTC/USDT',
                openTime: new Date(Date.now() - 86400000).toISOString(),
                openRate: btcData.price * 0.98,  // Simulating buy 2% below current
                currentRate: btcData.price,
                closeTime: undefined,
                closeRate: undefined,
                stakeAmount: 0.05,
                profit: {
                  percent: ((btcData.price / (btcData.price * 0.98)) - 1) * 100,
                  amount: 0.05 * ((btcData.price / (btcData.price * 0.98)) - 1) * btcData.price
                },
                side: 'long',
                status: 'open',
                fees: 0.1,
                exchange: 'Coinbase',
                takeProfit: btcData.price * 1.05,
                stopLoss: btcData.price * 0.94
              };
              
              // Create a sample closed trade with real historical data
              const sampleClosedTrade: Trade = {
                id: '2',
                pair: 'ETH/USDT',
                openTime: new Date(Date.now() - 172800000).toISOString(),
                openRate: ethData.price * 0.95,
                closeTime: new Date(Date.now() - 86400000).toISOString(),
                closeRate: ethData.price * 1.02,
                currentRate: ethData.price,
                stakeAmount: 0.5,
                profit: {
                  percent: 7.37,
                  amount: 0.5 * ethData.price * 0.07
                },
                side: 'long',
                status: 'closed',
                fees: 0.1,
                exchange: 'Kraken'
              };
              
              console.log('Adding sample trades to store');
              tradingStore.addTrade(sampleOpenTrade);
              tradingStore.addTrade(sampleClosedTrade);
              
              // Update ticker data in store
              tradingStore.updateTicker('BTC/USDT', btcData);
              tradingStore.updateTicker('ETH/USDT', ethData);
            }
          }
        } catch (dataError) {
          console.error('Error fetching ticker data:', dataError);
        }
      } catch (error) {
        console.error('Failed to initialize with real-time data:', error);
        setIsConnected(false);
      }
    };
    
    initializeData();
    
    // Populate state from store
    const openTrades = tradingStore.getOpenTrades();
    const closedTrades = tradingStore.getClosedTrades();
    setOpenTrades(openTrades);
    setClosedTrades(closedTrades);
  }, []);
  
  // Subscribe to trading store changes
  useEffect(() => {
    // This subscription is handled later in the component
    // with the event-based system (tradingStore.on/off)

    // Initialize REAL Trading Service
    const tradingService = TradingService.getInstance();
    
    // Configure with REAL API keys if available
    const binanceApiKey = import.meta.env.VITE_BINANCE_API_KEY;
    const binanceSecret = import.meta.env.VITE_BINANCE_SECRET_KEY;
    const enableRealTrading = import.meta.env.VITE_ENABLE_REAL_TRADING === 'true';
    
    if (binanceApiKey && binanceSecret && enableRealTrading) {
      tradingService.configure({
        apiKey: binanceApiKey,
        apiSecret: binanceSecret,
        paperTrading: false, // REAL TRADING ENABLED
        testnet: import.meta.env.BINANCE_TESTNET === 'true'
      });
      console.log('🚀 REAL TRADING SERVICE configured and enabled!');
    } else {
      tradingService.configure({
        apiKey: '',
        apiSecret: '',
        paperTrading: true,
        testnet: true
      });
      console.log('🧪 Paper Trading mode (add API keys to enable real trading)');
    }

    // Initialize Paper Trading Service as fallback
    PaperTradingService.getInstance();
    console.log('📊 Paper Trading Service initialized as fallback');
    
    // No cleanup needed for this effect
  }, []);

  // Initialize market data connections
  useEffect(() => {
      console.log('Initializing market data service...');
      const marketData = RealTimeMarketDataService.getInstance();
      const unsubscribeFunctions: (() => void)[] = [];

      // Connect to websockets for real-time data
      try {
        // Set up ticker subscriptions for main trading pairs
        const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];
        
        console.log('Setting up periodic market data updates for:', symbols);
        
        // Periodically fetch ticker data
        const tickerInterval = setInterval(async () => {
          try {
            const tickerData = await marketData.getTickerData(symbols);
            console.log('Received ticker data:', tickerData);
            
            if (tickerData && tickerData.length > 0) {
              tickerData.forEach(ticker => {
                if (ticker && ticker.symbol) {
                  // Update store with new ticker data
                  tradingStore.updateTicker(ticker.symbol, ticker);
                }
              });
            }
          } catch (err) {
            console.error('Error fetching ticker data:', err);
          }
        }, 5000);
        
        unsubscribeFunctions.push(() => clearInterval(tickerInterval));

      } catch (err) {
        console.error('Failed to connect to market data:', err);
        tradingStore.addNotification({
          type: 'error',
          title: 'Connection Error',
          message: 'Could not connect to market data services. Some features may be limited.',
          read: false
        });
      }

      // Force rerender of components with new data
      tradingStore.setIsConnected(true);

      // Show welcome notification
      setTimeout(() => {
        tradingStore.addNotification({
          type: 'info',
          title: 'Welcome to Gemini Trade Bot',
          message: 'Real-time market data connection established. Ready to trade!',
          read: false
        });
      }, 1000);
      
      return () => {
        console.log('Cleaning up market data connections...');
        unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        marketData.disconnect();
      };
    }, []);

  // REMOVED: All trade simulation - using REAL data only

  // Listen to store changes
  useEffect(() => {
    const handleOpenTradesChange = (trades: Trade[]) => setOpenTrades(trades);
    const handleClosedTradesChange = (trades: Trade[]) => setClosedTrades(trades);
    const handleBotStatusChange = (status: BotStatus) => setBotStatus(status);

    tradingStore.on('openTradesChanged', handleOpenTradesChange);
    tradingStore.on('closedTradesChanged', handleClosedTradesChange);
    tradingStore.on('botStatusChanged', handleBotStatusChange);

    return () => {
      tradingStore.off('openTradesChanged', handleOpenTradesChange);
      tradingStore.off('closedTradesChanged', handleClosedTradesChange);
      tradingStore.off('botStatusChanged', handleBotStatusChange);
    };
  }, []);

  const toggleBotStatus = () => {
    const newStatus = botStatus === BotStatus.RUNNING ? BotStatus.STOPPED : BotStatus.RUNNING;
    setBotStatus(newStatus);
    tradingStore.setBotStatus(newStatus);
    
    // Add notification
    tradingStore.addNotification({
      type: newStatus === BotStatus.RUNNING ? 'success' : 'warning',
      title: `Bot ${newStatus}`,
      message: `Trading bot has been ${newStatus.toLowerCase()}.`,
      read: false
    });
  };

  const handleViewChange = (view: View) => {
    if (view === 'settings') {
      setShowConfigPanel(true);
    } else {
      setCurrentView(view);
    }
  };
  
  const renderView = () => {
    switch(currentView) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Dashboard openTrades={openTrades} closedTrades={closedTrades} />
            </div>
            <div className="lg:col-span-1">
              <RealTimePriceTicker 
                symbols={['BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'SOL/USDT']} 
              />
            </div>
          </div>
        );
      case 'backtest':
        return <BacktestView />;
      case 'screener':
        return <MarketScreenerView />;
      case 'advanced':
        return <AdvancedTradingDashboard positions={[]} trades={[...openTrades, ...closedTrades]} />;
      case 'momentum-hunter':
        return <MomentumHunterDashboard portfolioValue={100000} />;
      case 'paper-trading':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PaperTradingControls />
            </div>
            <div className="lg:col-span-1 space-y-6">
              <RealTimePriceTicker 
                symbols={['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT']} 
              />
              <AlertPanel isOpen={showAlertPanel} onClose={() => setShowAlertPanel(false)} />
            </div>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Dashboard openTrades={openTrades} closedTrades={closedTrades} />
            </div>
            <div className="lg:col-span-1">
              <RealTimePriceTicker 
                symbols={['BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'SOL/USDT']} 
              />
            </div>
          </div>
        );
    }
  }

  // Add wrapper for error tracking
  const renderSafely = (componentName: string, renderFunc: () => JSX.Element | null): JSX.Element | null => {
    try {
      return renderFunc();
    } catch (error) {
      console.error(`Error rendering ${componentName}:`, error);
      return (
        <div className="p-4 m-4 bg-red-800 text-white rounded">
          Error rendering {componentName}. See console for details.
        </div>
      );
    }
  };

  // If in fallback mode, show a simple UI that works without API
  if (fallbackMode) {
    return (
      <div className="min-h-screen bg-gray-900 font-sans text-white p-8">
        <h1 className="text-3xl font-bold mb-6">Gemini Trade Bot</h1>
        
        <div className="bg-red-900/50 border border-red-700 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-2">API Connection Error</h2>
          <p className="mb-4">There was an error connecting to the trading APIs: {apiError}</p>
          <p className="mb-4">This could be due to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Missing or invalid Gemini API key</li>
            <li>Network connectivity issues</li>
            <li>CORS restrictions</li>
            <li>API service outages</li>
          </ul>
          <p>Please check your API key configuration in the .env file and try again.</p>
          
          <button 
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">API Configuration</h3>
            <p className="mb-4">Please ensure your .env file contains:</p>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-x-auto">
              VITE_GOOGLE_AI_API_KEY=your_gemini_api_key_here
            </pre>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
            <p>Check the following files for more information:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>AI_MODEL_UPGRADE.md</li>
              <li>AI_MODEL_ADVANCED_UPGRADES.md</li>
              <li>QUICK_START.md</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Normal UI
  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      {renderSafely('Header', () => (
        <Header 
          status={botStatus} 
          onToggleStatus={toggleBotStatus}
          currentView={currentView}
          onViewChange={handleViewChange}
          isConnected={isConnected}
        />
      ))}
      
      <main className="p-4 sm:p-6 lg:p-8">
        {renderSafely('MainView', () => renderView())}
      </main>

      {/* Real-time notifications */}
      {renderSafely('NotificationSystem', () => <NotificationSystem />)}

      {/* Configuration panel */}
      {renderSafely('ConfigurationPanel', () => (
        <ConfigurationPanel 
          isOpen={showConfigPanel}
          onClose={() => setShowConfigPanel(false)}
        />
      ))}
      
      {/* Alert panel */}
      {renderSafely('AlertPanel', () => (
        <AlertPanel 
          isOpen={showAlertPanel}
          onClose={() => setShowAlertPanel(false)}
        />
      ))}

      {/* Status bar */}
      <div className="fixed bottom-4 left-4 right-4 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-danger'}`}></div>
                <span className="text-gray-300">
                  {isConnected ? 'Market Data Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="text-gray-400">
                Open: {openTrades.length} | Closed: {closedTrades.length}
              </div>
              
              <div className="text-gray-400">
                P&L: ${safeToFixed(closedTrades.reduce((total: number, trade: Trade) => total + (trade.profit.amount || 0), 0), 2)}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowConfigPanel(true)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Settings
              </button>
              <button 
                onClick={() => setShowAlertPanel(true)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Intelligent Alerts"
              >
                🚨
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;