
import React, { useState } from 'react';
import { MarketOpportunity } from '../types';
import { findMarketOpportunities } from '../services/aiModelService';
import { SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons/InterfaceIcons';

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
    </div>
);

const OpportunityCard: React.FC<{ opportunity: MarketOpportunity }> = ({ opportunity }) => (
    <div className="bg-gray-800 rounded-lg shadow-md p-5 border border-gray-700/50 transform hover:-translate-y-1 transition-transform duration-200">
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-primary">{opportunity.symbol}</h3>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${opportunity.type === 'Crypto' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {opportunity.type}
            </span>
        </div>
        <p className="mt-3 text-gray-300">{opportunity.rationale}</p>
        <div className="mt-4 pt-4 border-t border-gray-700 flex space-x-4 text-sm">
            <div className="flex-1">
                <p className="text-gray-500 font-semibold">Volatility</p>
                <p className="text-gray-200">{opportunity.keyMetrics.volatility}</p>
            </div>
            <div className="flex-1">
                <p className="text-gray-500 font-semibold">Trend</p>
                <p className="text-gray-200">{opportunity.keyMetrics.trend}</p>
            </div>
        </div>
    </div>
);


const MarketScreenerView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [opportunities, setOpportunities] = useState<MarketOpportunity[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFindOpportunities = async () => {
        setIsLoading(true);
        setOpportunities(null);
        setError(null);
        try {
            const results = await findMarketOpportunities("Aggressive Scalping: Find high-volatility assets with clear, short-term momentum suitable for quick entries and exits.");
            setOpportunities(results);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="p-6 bg-gray-800 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold text-white mb-2">AI Market Screener</h2>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                    Leverage Gemini to scan markets for assets that fit a specific trading profile. This is an analysis tool, not financial advice.
                </p>
                <button
                    onClick={handleFindOpportunities}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-white font-semibold rounded-md shadow-md hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200"
                >
                    {isLoading ? (
                        <>
                            <LoadingSpinner />
                            <span className="ml-3">Scanning Markets...</span>
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="h-5 w-5 mr-2" />
                            <span>Find Scalping Opportunities</span>
                        </>
                    )}
                </button>
            </div>

            {error && (
                 <div className="p-4 bg-danger/20 text-danger rounded-lg flex items-center space-x-3">
                    <ExclamationTriangleIcon />
                    <span className="font-semibold">Error:</span>
                    <span>{error}</span>
                </div>
            )}

            {opportunities && (
                <div className="space-y-8 animate-fade-in">
                    <div className="p-4 bg-success/20 text-success rounded-lg flex items-center space-x-3">
                        <CheckCircleIcon />
                        <span className="font-semibold">Scan Complete!</span>
                        <span>Displaying AI-generated opportunities.</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {opportunities.map((op, index) => (
                            <OpportunityCard key={`${op.symbol}-${index}`} opportunity={op} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketScreenerView;