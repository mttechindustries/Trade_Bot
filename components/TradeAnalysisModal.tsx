
import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trade, AiAnalysisType } from '../types';
import { getAiAnalysis } from '../services/aiModelService';
import { XMarkIcon, SparklesIcon } from './icons/InterfaceIcons';

interface TradeAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade;
  analysisType: AiAnalysisType;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
    <span className="text-gray-400">Gemini is analyzing...</span>
  </div>
);

const TradeAnalysisModal: React.FC<TradeAnalysisModalProps> = ({ isOpen, onClose, trade, analysisType }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAnalysis = useCallback(async () => {
    if (!trade) return;
    setIsLoading(true);
    setAiAnalysis('');
    try {
      const analysis = await getAiAnalysis(trade, analysisType);
      setAiAnalysis(analysis);
    } catch (error: any) {
      const errorMessage = `<p class="text-danger p-2 bg-danger/10 rounded-md">${error.message || 'An unknown error occurred.'}</p>`;
      setAiAnalysis(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [trade, analysisType]);

  useEffect(() => {
    if (isOpen) {
      // Automatically fetch analysis when modal opens
      fetchAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const chartData = [
    { name: 'Open', price: trade.openRate },
    { name: 'Stop Loss', price: trade.stopLoss },
    { name: 'Current', price: trade.currentRate },
    ...(trade.closeRate ? [{ name: 'Close', price: trade.closeRate }] : []),
  ].sort((a,b) => a.price - b.price);

  const analysisTitle = analysisType === AiAnalysisType.MARKET_SENTIMENT ? 'Market Sentiment Analysis' : 'Trade Rationale Analysis';
  const isPositive = trade.profit.percent >= 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-gray-100">
            Trade Details: <span className="text-primary">{trade.pair}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Details & Chart */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-700/50 p-3 rounded-md">
                <p className="text-gray-400">Open Rate</p>
                <p className="font-mono text-gray-100">{trade.openRate.toFixed(4)}</p>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-md">
                <p className="text-gray-400">{trade.closeRate ? 'Close Rate' : 'Current Rate'}</p>
                <p className="font-mono text-gray-100">{trade.closeRate ? trade.closeRate.toFixed(4) : trade.currentRate.toFixed(4)}</p>
              </div>
              <div className={`p-3 rounded-md col-span-2 ${isPositive ? 'bg-success/20' : 'bg-danger/20'}`}>
                <p className={`font-semibold ${isPositive ? 'text-success' : 'text-danger'}`}>Profit</p>
                <p className={`font-mono text-lg ${isPositive ? 'text-success' : 'text-danger'}`}>{trade.profit.percent.toFixed(2)}%</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#9ca3af" tickFormatter={(value) => typeof value === 'number' ? value.toFixed(2) : ''} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Line type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Panel: AI Analysis */}
          <div className="bg-gray-900/50 p-4 rounded-lg flex flex-col">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-semibold text-lg flex items-center">
                 <SparklesIcon className="h-5 w-5 mr-2 text-primary" />
                 {analysisTitle}
               </h3>
             </div>
             <div className="flex-grow space-y-3 text-sm text-gray-300 overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeAnalysisModal;
