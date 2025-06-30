import { useState, useEffect } from 'react';

interface DiagnosticInfo {
  apiStatus: 'testing' | 'working' | 'failed';
  wsStatus: 'testing' | 'connected' | 'failed';
  corsIssue: boolean;
  networkIssue: boolean;
  lastError?: string;
}

const SystemDiagnostic: React.FC = () => {
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo>({
    apiStatus: 'testing',
    wsStatus: 'testing',
    corsIssue: false,
    networkIssue: false
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      console.log('🔧 Running system diagnostics...');
      
      // Test 1: Check if we can reach Binance API
      try {
        const response = await fetch('https://api.binance.com/api/v3/ping');
        if (response.ok) {
          setDiagnostic(prev => ({ ...prev, apiStatus: 'working' }));
        } else {
          throw new Error(`API responded with ${response.status}`);
        }
      } catch (error: any) {
        console.error('API Test Failed:', error);
        setDiagnostic(prev => ({ 
          ...prev, 
          apiStatus: 'failed',
          corsIssue: error.message?.includes('CORS') || error.name === 'TypeError',
          networkIssue: error.message?.includes('Failed to fetch'),
          lastError: error.message
        }));
      }

      // Test 2: Check WebSocket connectivity
      try {
        const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
        
        ws.onopen = () => {
          setDiagnostic(prev => ({ ...prev, wsStatus: 'connected' }));
          ws.close();
        };
        
        ws.onerror = () => {
          setDiagnostic(prev => ({ ...prev, wsStatus: 'failed' }));
        };
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            ws.close();
            setDiagnostic(prev => ({ ...prev, wsStatus: 'failed' }));
          }
        }, 5000);
        
      } catch (error: any) {
        setDiagnostic(prev => ({ 
          ...prev, 
          wsStatus: 'failed',
          lastError: error.message
        }));
      }
    };

    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
      case 'connected':
        return '✅';
      case 'failed':
        return '❌';
      case 'testing':
      default:
        return '🔄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
      case 'connected':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'testing':
      default:
        return 'text-yellow-500';
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">🔧 System Diagnostics</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Binance API:</span>
          <span className={`font-medium ${getStatusColor(diagnostic.apiStatus)}`}>
            {getStatusIcon(diagnostic.apiStatus)} {diagnostic.apiStatus}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-300">WebSocket:</span>
          <span className={`font-medium ${getStatusColor(diagnostic.wsStatus)}`}>
            {getStatusIcon(diagnostic.wsStatus)} {diagnostic.wsStatus}
          </span>
        </div>
        
        {diagnostic.corsIssue && (
          <div className="bg-red-500/20 p-3 rounded">
            <p className="text-red-300 text-sm">
              🚫 CORS Issue Detected - Using development proxy
            </p>
          </div>
        )}
        
        {diagnostic.networkIssue && (
          <div className="bg-yellow-500/20 p-3 rounded">
            <p className="text-yellow-300 text-sm">
              🌐 Network Issue - Check your internet connection
            </p>
          </div>
        )}
        
        {diagnostic.lastError && (
          <div className="bg-gray-500/20 p-3 rounded">
            <p className="text-gray-300 text-xs">
              Last Error: {diagnostic.lastError}
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-400">
          If APIs fail, the app will use simulated data for demonstration.
        </p>
      </div>
    </div>
  );
};

export default SystemDiagnostic;
