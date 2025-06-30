import React, { useState, useEffect } from 'react';

const HuggingFaceApiTest: React.FC = () => {
  const [hfStatus, setHfStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [geminiStatus, setGeminiStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [hfMessage, setHfMessage] = useState('Testing Hugging Face API...');
  const [geminiMessage, setGeminiMessage] = useState('Testing Gemini API...');
  const [hfDetails, setHfDetails] = useState<string>('');
  const [geminiDetails, setGeminiDetails] = useState<string>('');

  useEffect(() => {
    testHuggingFaceApi();
    testGeminiApi();
  }, []);

  const testHuggingFaceApi = async () => {
    try {
      setHfStatus('testing');
      setHfMessage('Testing Hugging Face API connection...');
      
      // Check if API key exists
      const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
      if (!apiKey || apiKey === 'your_api_key_here') {
        setHfStatus('error');
        setHfMessage('API Key Issue');
        setHfDetails('Hugging Face API key is not configured properly. Please check your .env file.');
        return;
      }
      
      setHfDetails(`API Key found: ${apiKey.substring(0, 10)}...`);
      
      // Test API call
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: "Test prompt for trading analysis",
          parameters: {
            max_new_tokens: 50,
            temperature: 0.7,
            return_full_text: false
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        setHfStatus('error');
        setHfMessage(`API Error (${response.status})`);
        setHfDetails(`${response.statusText}: ${errorText}`);
        return;
      }
      
      const data = await response.json();
      setHfStatus('success');
      setHfMessage('Hugging Face API Working!');
      setHfDetails(`Response received: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
      
    } catch (error) {
      setHfStatus('error');
      setHfMessage('Connection Failed');
      setHfDetails(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testGeminiApi = async () => {
    try {
      setGeminiStatus('testing');
      setGeminiMessage('Testing Gemini API connection...');
      
      // Check if API key exists
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        setGeminiStatus('error');
        setGeminiMessage('API Key Issue');
        setGeminiDetails('Gemini API key is not configured properly. Please check your .env file.');
        return;
      }
      
      setGeminiDetails(`API Key found: ${apiKey.substring(0, 10)}...`);
      
      // Test API call
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Provide a brief analysis of Bitcoin market sentiment."
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100,
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        setGeminiStatus('error');
        setGeminiMessage(`API Error (${response.status})`);
        setGeminiDetails(`${response.statusText}: ${errorText}`);
        return;
      }
      
      const data = await response.json();
      setGeminiStatus('success');
      setGeminiMessage('Gemini API Working!');
      setGeminiDetails(`Response received: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
      
    } catch (error) {
      setGeminiStatus('error');
      setGeminiMessage('Connection Failed');
      setGeminiDetails(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const getStatusColor = (status: 'testing' | 'success' | 'error') => {
    switch (status) {
      case 'testing': return '#3b82f6';
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: 'testing' | 'success' | 'error') => {
    switch (status) {
      case 'testing': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const ApiStatusCard = ({ 
    title, 
    status, 
    message, 
    details 
  }: { 
    title: string;
    status: 'testing' | 'success' | 'error';
    message: string;
    details: string;
  }) => (
    <div style={{
      padding: '20px',
      backgroundColor: '#1f2937',
      color: 'white',
      fontFamily: 'monospace',
      borderRadius: '8px',
      margin: '10px 0',
      border: `2px solid ${getStatusColor(status)}`
    }}>
      <h3 style={{ color: getStatusColor(status), marginBottom: '15px' }}>
        {getStatusIcon(status)} {title}
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Status:</strong> {message}
      </div>
      
      {details && (
        <div style={{
          backgroundColor: '#374151',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px',
          wordBreak: 'break-all',
          maxHeight: '150px',
          overflow: 'auto'
        }}>
          <strong>Details:</strong><br />
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{details}</pre>
        </div>
      )}
    </div>
  );

  const overallStatus = hfStatus === 'success' || geminiStatus === 'success' ? 'success' : 
                       hfStatus === 'testing' || geminiStatus === 'testing' ? 'testing' : 'error';

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '30px', 
          color: getStatusColor(overallStatus) 
        }}>
          🤖 AI Services Diagnostic
        </h1>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <ApiStatusCard
            title="Hugging Face API"
            status={hfStatus}
            message={hfMessage}
            details={hfDetails}
          />
          
          <ApiStatusCard
            title="Gemini API (Fallback)"
            status={geminiStatus}
            message={geminiMessage}
            details={geminiDetails}
          />
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: getStatusColor(overallStatus),
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '15px' }}>
            {getStatusIcon(overallStatus)} Overall Status
          </h2>
          <p style={{ margin: 0 }}>
            {overallStatus === 'success' && "✅ At least one AI service is working - you're good to go!"}
            {overallStatus === 'testing' && "🔄 Testing AI services..."}
            {overallStatus === 'error' && "❌ Both AI services are unavailable. Please check your API keys."}
          </p>
        </div>
        
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#1f2937',
          borderRadius: '8px'
        }}>
          <h3>🔧 How the Fallback System Works:</h3>
          <ol style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li><strong>Primary:</strong> Hugging Face API (specialized AI models)</li>
            <li><strong>Fallback:</strong> Gemini API (Google's AI when HF fails)</li>
            <li><strong>Graceful degradation:</strong> Helpful messages if both fail</li>
          </ol>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button 
            onClick={() => { testHuggingFaceApi(); testGeminiApi(); }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              marginRight: '15px'
            }}
          >
            🔄 Retry Tests
          </button>
          
          <button 
            onClick={() => window.location.href = window.location.origin}
            style={{
              padding: '12px 24px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🚀 Launch Trading App
          </button>
        </div>
      </div>
    </div>
  );
};

export default HuggingFaceApiTest;
