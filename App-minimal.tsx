/*
 *   Copyright (c) 2025 
 *   All rights reserved.
 */
import React, { useState, useEffect } from 'react';

// Add CSS for spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

const AppMinimal: React.FC = () => {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        setStep(1);
        console.log('Step 1: Basic React rendering works');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        setStep(2);
        console.log('Step 2: useState and useEffect work');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        setStep(3);
        console.log('Step 3: Testing types import...');
        
        try {
          const { BotStatus } = await import('./types');
          console.log('Step 3: Types import successful', BotStatus);
          setStep(4);
        } catch (err) {
          throw new Error(`Types import failed: ${err}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Step 4: Testing store import...');
        
        try {
          const { tradingStore } = await import('./store/tradingStore');
          console.log('Step 4: Store import successful');
          const state = tradingStore.getState();
          console.log('Step 4: Store state:', state);
          setStep(5);
        } catch (err) {
          throw new Error(`Store import failed: ${err}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        setStep(6);
        console.log('Step 6: All basic imports successful!');
        
        // Test if we can load the main App
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStep(7);
        console.log('Step 7: Ready to load main app');
        
        // Auto-load main app after 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        setStep(8);
        console.log('Step 8: Loading main application...');
        
      } catch (err) {
        console.error('Diagnostic failed:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    runDiagnostics();
  }, []);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#dc2626', 
        color: 'white', 
        fontFamily: 'monospace',
        minHeight: '100vh'
      }}>
        <h1>🚨 Diagnostic Error</h1>
        <p><strong>Error:</strong> {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            padding: '10px 20px', 
            marginTop: '20px',
            backgroundColor: 'white',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const steps = [
    'Initializing...',
    '✅ React rendering',
    '✅ React hooks working', 
    '✅ Types loading...',
    '✅ Types loaded',
    '✅ Store loading...',
    '✅ Store loaded',
    '🎉 Ready! Loading main app...',
    '🚀 Loading main application...'
  ];

  return (
    <div style={{
      padding: '40px',
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
      fontFamily: 'system-ui, sans-serif',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ marginBottom: '40px', color: '#38bdf8' }}>
        🤖 Gemini Trade Bot Diagnostics
      </h1>
      
      <div style={{ width: '100%', maxWidth: '500px' }}>
        {steps.map((stepText, index) => (
          <div 
            key={index}
            style={{
              padding: '12px 20px',
              margin: '8px 0',
              backgroundColor: step > index ? '#065f46' : step === index ? '#0369a1' : '#374151',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              border: step === index ? '2px solid #38bdf8' : '2px solid transparent'
            }}
          >
            {stepText}
          </div>
        ))}
      </div>
      
      {step >= 7 && (
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#065f46',
            borderRadius: '12px',
            border: '2px solid #10b981'
          }}>
            <h2 style={{ color: '#10b981', marginBottom: '16px' }}>
              ✅ All Diagnostics Passed!
            </h2>
            <p>Loading your trading application...</p>
          </div>
        </div>
      )}
      
      {step >= 8 && (
        <MainAppLoader />
      )}
      
      <div style={{
        marginTop: '20px',
        fontSize: '14px',
        color: '#94a3b8'
      }}>
        Step {step} of {steps.length - 1}
      </div>
    </div>
  );
};

// Component to load the main app
const MainAppLoader: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadMainApp = async () => {
      try {
        // Dynamic import of the main App component
        const { default: App } = await import('./App');
        
        // Replace the current content with the main app
        const root = document.getElementById('root');
        if (root) {
          const { createRoot } = await import('react-dom/client');
          const { StrictMode } = await import('react');
          
          const newRoot = createRoot(root);
          newRoot.render(
            React.createElement(StrictMode, null, React.createElement(App))
          );
        }
      } catch (err) {
        console.error('Failed to load main app:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    };
    
    loadMainApp();
  }, []);
  
  if (error) {
    return (
      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#dc2626',
        borderRadius: '8px',
        color: 'white'
      }}>
        <h3>Failed to load main application:</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            marginTop: '10px',
            backgroundColor: 'white',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }
  
  return (
    <div style={{
      marginTop: '20px',
      padding: '20px',
      backgroundColor: '#1e40af',
      borderRadius: '8px',
      color: 'white',
      textAlign: 'center'
    }}>
      <div style={{
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 15px'
      }}></div>
      <p>Loading main application...</p>
    </div>
  );
};

export default AppMinimal;
