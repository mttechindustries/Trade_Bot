import { useState, useEffect } from 'react';
import IntelligentAlertService, { TradingAlert } from '../services/intelligentAlertService';

interface AlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AlertPanel: React.FC<AlertPanelProps> = ({ isOpen, onClose }) => {
  const [alerts, setAlerts] = useState<TradingAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high' | 'critical'>('unread');
  const [alertService] = useState(() => IntelligentAlertService.getInstance());

  useEffect(() => {
    // Start monitoring when component mounts
    alertService.startMonitoring();
    
    // Listen for new alerts
    const unsubscribe = alertService.addAlertListener((newAlert) => {
      setAlerts(prev => [newAlert, ...prev.slice(0, 99)]);
    });

    // Load existing alerts
    loadAlerts();

    return unsubscribe;
  }, [alertService]);

  useEffect(() => {
    loadAlerts();
  }, [filter, alertService]);

  const loadAlerts = () => {
    const filterConfig = {
      unreadOnly: filter === 'unread',
      priority: filter === 'high' || filter === 'critical' ? filter : undefined
    };
    
    const filteredAlerts = alertService.getAlerts(filterConfig);
    setAlerts(filteredAlerts);
  };

  const handleMarkAsRead = (alertId: string) => {
    alertService.markAsRead(alertId);
    loadAlerts();
  };

  const handleMarkAllAsRead = () => {
    alertService.markAllAsRead();
    loadAlerts();
  };

  const handleDeleteAlert = (alertId: string) => {
    alertService.deleteAlert(alertId);
    loadAlerts();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-950/50';
      case 'high': return 'border-orange-500 bg-orange-950/50';
      case 'medium': return 'border-yellow-500 bg-yellow-950/50';
      case 'low': return 'border-blue-500 bg-blue-950/50';
      default: return 'border-gray-500 bg-gray-950/50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return '🎯';
      case 'risk': return '⚠️';
      case 'technical': return '📊';
      case 'whale': return '🐋';
      case 'sentiment': return '💭';
      case 'defi': return '🏦';
      case 'news': return '📰';
      default: return '📢';
    }
  };

  const getImpactColor = (impact: number) => {
    return impact > 0 ? 'text-green-400' : 'text-red-400';
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Intelligent Alerts</h2>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-sm rounded ${
                    filter === 'all' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 text-sm rounded ${
                    filter === 'unread' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilter('high')}
                  className={`px-3 py-1 text-sm rounded ${
                    filter === 'high' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  High Priority
                </button>
                <button
                  onClick={() => setFilter('critical')}
                  className={`px-3 py-1 text-sm rounded ${
                    filter === 'critical' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Critical
                </button>
              </div>
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Mark All Read
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Alert List */}
        <div className="overflow-y-auto h-full p-6">
          {alerts.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              <div className="text-4xl mb-4">🔕</div>
              <p className="text-lg">No alerts to display</p>
              <p className="text-sm mt-2">
                {filter === 'unread' ? 'All alerts have been read' : 'No alerts match your filter'}
              </p>
              <button
                onClick={() => alertService.generateTestAlert()}
                className="mt-4 px-4 py-2 bg-primary/20 border border-primary rounded text-primary hover:bg-primary/30"
              >
                Generate Test Alert
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${getPriorityColor(alert.priority)} ${
                    !alert.isRead ? 'border-l-4' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg">{alert.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="capitalize">{alert.type}</span>
                            <span className="capitalize font-medium text-white">{alert.priority}</span>
                            <span>{alert.symbol}</span>
                            <span>{formatTimeAgo(alert.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-3">{alert.message}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-400">Confidence:</span>
                          <span className="ml-2 text-white font-medium">
                            {(alert.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Expected Impact:</span>
                          <span className={`ml-2 font-medium ${getImpactColor(alert.expectedImpact)}`}>
                            {alert.expectedImpact > 0 ? '+' : ''}{alert.expectedImpact.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Timeframe:</span>
                          <span className="ml-2 text-white">{alert.timeframe}</span>
                        </div>
                      </div>

                      {alert.actionItems && alert.actionItems.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-400 mb-2">Recommended Actions:</p>
                          <ul className="text-sm text-gray-300 space-y-1">
                            {alert.actionItems.map((item, index) => (
                              <li key={index} className="flex items-center">
                                <span className="text-primary mr-2">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {!alert.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(alert.id)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-900 px-6 py-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''} 
              {filter !== 'all' && ` (${filter})`}
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Monitoring Active
              </span>
              <button
                onClick={() => alertService.generateTestAlert()}
                className="text-primary hover:text-primary/80"
              >
                Test Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertPanel;
