import React, { useState, useEffect } from 'react';

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      return <Fallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Error display component
const ErrorDisplay: React.FC<{ error: Error }> = ({ error }) => (
  <div style={{ 
    padding: '20px', 
    backgroundColor: '#ff6b6b', 
    color: 'white', 
    fontFamily: 'monospace',
    height: '100vh',
    overflow: 'auto'
  }}>
    <h2>Application Error</h2>
    <h3>Error Message:</h3>
    <p>{error.message}</p>
    <h3>Stack Trace:</h3>
    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
      {error.stack}
    </pre>
  </div>
);

// Simple loading component
const LoadingScreen: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    backgroundColor: '#1a1a1a',
    color: 'white'
  }}>
    <div>
      <h2>Loading Trading Bot...</h2>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <div style={{ 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 2s linear infinite',
          margin: '0 auto'
        }}></div>
      </div>
    </div>
  </div>
);

// Main debug app
const AppDebug: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Check if required modules can be imported
        console.log('Testing imports...');
        
        const { tradingStore } = await import('./store/tradingStore');
        console.log('Trading store imported successfully');
        
        // Test basic store operations
        console.log('Testing store operations...');
        const state = tradingStore.getState();
        console.log('Initial state:', state);
        
        // Try to import services
        console.log('Testing service imports...');
        
        try {
          const realTimeService = await import('./services/realTimeMarketDataService');
          console.log('Real-time market data service imported');
        } catch (err) {
          console.warn('Real-time service import error:', err);
        }
        
        try {
          const geminiService = await import('./services/geminiService');
          console.log('Gemini service imported');
        } catch (err) {
          console.warn('Gemini service import error:', err);
        }
        
        // If we get here, basic imports work
        console.log('All basic imports successful, loading main app...');
        
        // Small delay to see loading screen
        setTimeout(() => {
          setLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('Initialization error:', error);
        setInitError(error instanceof Error ? error.message : String(error));
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (initError) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#ff6b6b', 
        color: 'white', 
        fontFamily: 'monospace',
        height: '100vh'
      }}>
        <h2>Initialization Error</h2>
        <p>{initError}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: '10px', margin: '10px 0' }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  // Try to load the actual app
  try {
    const OriginalApp = React.lazy(() => import('./App'));
    
    return (
      <ErrorBoundary fallback={ErrorDisplay}>
        <React.Suspense fallback={<LoadingScreen />}>
          <OriginalApp />
        </React.Suspense>
      </ErrorBoundary>
    );
  } catch (error) {
    return <ErrorDisplay error={error as Error} />;
  }
};

// Add CSS for loading spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default AppDebug;
