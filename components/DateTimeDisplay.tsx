import { useState, useEffect } from 'react';
import { TimeService, formatTime, formatDate, getMarketSession } from '../services/timeService';

interface DateTimeDisplayProps {
  className?: string;
  showMarketStatus?: boolean;
}

const DateTimeDisplay: React.FC<DateTimeDisplayProps> = ({ 
  className = '', 
  showMarketStatus = true 
}) => {
  const [currentTime, setCurrentTime] = useState(formatTime());
  const [currentDate, setCurrentDate] = useState(formatDate());
  const [marketSession, setMarketSession] = useState(getMarketSession());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTime());
      setCurrentDate(formatDate());
      setMarketSession(getMarketSession());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getMarketStatusColor = () => {
    if (marketSession.isOpen) return 'text-green-400';
    if (marketSession.session === 'pre-market' || marketSession.session === 'after-market') {
      return 'text-yellow-400';
    }
    return 'text-gray-400';
  };

  const getMarketStatusText = () => {
    return marketSession.session.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className={`bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded-lg p-4 border border-gray-600/50 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-gray-100 font-mono">
            {currentTime}
          </div>
          <div className="text-sm text-gray-300">
            {currentDate}
          </div>
        </div>
        
        {showMarketStatus && (
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-semibold ${getMarketStatusColor()}`}>
                {getMarketStatusText()}
              </span>
              <div className={`w-3 h-3 rounded-full ${
                marketSession.isOpen ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`}></div>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {marketSession.isOpen ? 'Markets Open' : 'Markets Closed'}
            </div>
          </div>
        )}
      </div>
      
      {/* Additional market info */}
      <div className="mt-3 pt-3 border-t border-gray-600/30">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>Trading Session</span>
          <span className="font-mono">
            {formatDate()} • {marketSession.isOpen ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DateTimeDisplay;
