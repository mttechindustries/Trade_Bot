import { useState, useEffect } from 'react';
import { BotStatus } from '../types';
import { PowerIcon, BeakerIcon, ChartBarSquareIcon, BuildingStorefrontIcon, MagnifyingGlassIcon } from './icons/InterfaceIcons';
import { TimeService, formatTime, formatDate, getMarketSession } from '../services/timeService';

type View = 'dashboard' | 'backtest' | 'screener' | 'settings' | 'advanced' | 'paper-trading' | 'momentum-hunter';

interface HeaderProps {
  status: BotStatus;
  onToggleStatus: () => void;
  currentView: View;
  onViewChange: (view: View) => void;
  isConnected?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  status, 
  onToggleStatus, 
  currentView, 
  onViewChange, 
  isConnected = false 
}) => {
  const [currentTime, setCurrentTime] = useState(formatTime());
  const [marketSession, setMarketSession] = useState(getMarketSession());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTime());
      setMarketSession(getMarketSession());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isRunning = status === BotStatus.RUNNING;
  const isPaused = status === BotStatus.PAUSED;
  const isError = status === BotStatus.ERROR;

  const navButtonStyle = (view: View) => 
    `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      currentView === view
        ? 'bg-primary/80 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  const getStatusColor = () => {
    switch (status) {
      case BotStatus.RUNNING:
        return 'text-success';
      case BotStatus.PAUSED:
        return 'text-yellow-400';
      case BotStatus.ERROR:
        return 'text-danger';
      default:
        return 'text-danger';
    }
  };

  const getStatusDot = () => {
    switch (status) {
      case BotStatus.RUNNING:
        return 'bg-success animate-pulse';
      case BotStatus.PAUSED:
        return 'bg-yellow-400 animate-pulse';
      case BotStatus.ERROR:
        return 'bg-danger animate-pulse';
      default:
        return 'bg-danger';
    }
  };

  const getButtonStyle = () => {
    if (isError) {
      return 'bg-yellow-500/80 hover:bg-yellow-500';
    }
    return isRunning || isPaused 
      ? 'bg-danger/80 hover:bg-danger' 
      : 'bg-success/80 hover:bg-success';
  };

  const getButtonText = () => {
    if (isError) return 'Reset Bot';
    if (isPaused) return 'Resume Bot';
    return isRunning ? 'Stop Bot' : 'Start Bot';
  };

  const getMarketStatusColor = () => {
    if (marketSession.isOpen) return 'text-green-400';
    if (marketSession.session === 'pre-market' || marketSession.session === 'after-market') {
      return 'text-yellow-400';
    }
    return 'text-gray-400';
  };

  return (
    <header className="bg-gray-800/80 backdrop-blur-sm sticky top-0 z-20 shadow-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <BeakerIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-100">Gemini Trade Bot</h1>
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`}></div>
                  <span className="text-gray-400">
                    {isConnected ? 'Real-time Data' : 'Offline Mode'}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Time and Market Status */}
            <div className="hidden md:flex items-center space-x-4 px-3 py-2 bg-gray-700/50 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-gray-400">{formatDate()}</div>
                <div className="text-gray-100 font-mono text-sm">{currentTime}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Market</div>
                <div className={`font-semibold text-sm capitalize ${getMarketStatusColor()}`}>
                  {marketSession.session.replace('-', ' ')}
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${marketSession.isOpen ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            </div>
            
            <nav className="flex items-center space-x-2">
              <button 
                onClick={() => onViewChange('dashboard')} 
                className={navButtonStyle('dashboard')}
              >
                <BuildingStorefrontIcon className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
              
              <button 
                onClick={() => onViewChange('backtest')} 
                className={navButtonStyle('backtest')}
              >
                <ChartBarSquareIcon className="h-5 w-5" />
                <span>Backtest</span>
              </button>
              
              <button 
                onClick={() => onViewChange('screener')} 
                className={navButtonStyle('screener')}
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span>AI Screener</span>
              </button>
              
              <button 
                onClick={() => onViewChange('advanced')} 
                className={navButtonStyle('advanced')}
              >
                <BeakerIcon className="h-5 w-5" />
                <span>Advanced</span>
              </button>

              <button 
                onClick={() => onViewChange('momentum-hunter')} 
                className={navButtonStyle('momentum-hunter')}
              >
                <span className="text-xl">🚀</span>
                <span>Momentum Hunter</span>
              </button>
              
              <button 
                onClick={() => onViewChange('paper-trading')} 
                className={navButtonStyle('paper-trading')}
              >
                <PowerIcon className="h-5 w-5" />
                <span>Paper Trading</span>
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Status indicator */}
            <div className="flex items-center space-x-2">
              <span className={`h-3 w-3 rounded-full ${getStatusDot()}`}></span>
              <span className={`font-semibold ${getStatusColor()}`}>
                {status}
              </span>
            </div>

            {/* Risk metrics mini display */}
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-400">
              <div className="text-center">
                <div className="text-xs text-gray-500">Daily P&L</div>
                <div className="text-success font-mono">+$247.50</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Win Rate</div>
                <div className="text-gray-300 font-mono">68.5%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Exposure</div>
                <div className="text-yellow-400 font-mono">12.4%</div>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onViewChange('settings')}
                className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                title="Settings"
              >
                ⚙️
              </button>
              
              <button
                onClick={onToggleStatus}
                disabled={!isConnected && status === BotStatus.STOPPED}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyle()}`}
              >
                <PowerIcon className="h-5 w-5" />
                <span>{getButtonText()}</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Current time and market status display */}
        <div className="hidden md:flex justify-between text-sm text-gray-400 border-t border-gray-700 pt-4 mt-4">
          <div className="flex items-center space-x-4">
            <span className="font-mono text-gray-100">{currentTime}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-xs">Market Status</div>
              <div className={`font-semibold ${getMarketStatusColor()}`}>
                {marketSession.isOpen ? 'Open' : 'Closed'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;