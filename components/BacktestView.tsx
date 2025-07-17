import React, { useState } from 'react';
import { BacktestResult } from '../types';
import { generateBacktestResult } from '../services/aiModelService';
import KpiCard from './KpiCard';
import TradesTable from './TradesTable';
import { SparklesIcon, ScaleIcon, ArrowUpIcon, ArrowDownIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons/InterfaceIcons';

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
    </div>
);

const strategies = {
    "MA_CROSSOVER": "A simple Moving Average Crossover strategy. A 'BUY' signal is generated when the 10-period Simple Moving Average (SMA) crosses above the 30-period SMA. A 'SELL' signal is generated when the 10-period SMA crosses below the 30-period SMA.",
    "AGGRESSIVE_SCALPING": "An aggressive scalping strategy using Bollinger Bands and RSI. A 'BUY' signal is generated when the price touches the lower Bollinger Band and RSI is below 30 (oversold). A 'SELL' signal is generated when the price touches the upper Bollinger Band and RSI is above 70 (overbought). Trades are typically held for very short periods."
};

type StrategyKey = keyof typeof strategies;

const BacktestView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<BacktestResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Use real trading pairs instead of mock data
    const realTradingPairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'DOT/USDT', 'LINK/USDT', 'MATIC/USDT', 'XRP/USDT'];
    const [selectedPair, setSelectedPair] = useState<string>(realTradingPairs[0]);
    const [selectedStrategy, setSelectedStrategy] = useState<StrategyKey>('MA_CROSSOVER');

    const handleRunBacktest = async () => {
        setIsLoading(true);
        setResult(null);
        setError(null);
        try {
            const strategyDescription = strategies[selectedStrategy];
            const backtestResult = await generateBacktestResult(selectedPair, strategyDescription);
            setResult(backtestResult);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-2">Strategy Backtester</h2>
                <p className="text-gray-400 mb-6">
                    Select a trading pair and strategy, then run a backtest. AI will analyze historical data patterns to generate realistic results.
                </p>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="w-full sm:w-1/3">
                        <label htmlFor="pair-select" className="sr-only">Select Pair</label>
                        <select
                            id="pair-select"
                            value={selectedPair}
                            onChange={(e) => setSelectedPair(e.target.value)}
                            className="w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-primary focus:border-primary"
                        >
                            {realTradingPairs.map(pair => <option key={pair} value={pair}>{pair}</option>)}
                        </select>
                    </div>
                    <div className="w-full sm:w-1/3">
                        <label htmlFor="strategy-select" className="sr-only">Select Strategy</label>
                        <select
                            id="strategy-select"
                            value={selectedStrategy}
                            onChange={(e) => setSelectedStrategy(e.target.value as StrategyKey)}
                            className="w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-primary focus:border-primary"
                        >
                            <option value="MA_CROSSOVER">MA Crossover</option>
                            <option value="AGGRESSIVE_SCALPING">Aggressive Scalping</option>
                        </select>
                    </div>
                    <button
                        onClick={handleRunBacktest}
                        disabled={isLoading}
                        className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-primary text-white font-semibold rounded-md shadow-md hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner />
                                <span className="ml-3">Running...</span>
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="h-5 w-5 mr-2" />
                                <span>Run Backtest</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-danger/20 text-danger rounded-lg flex items-center space-x-3">
                    <ExclamationTriangleIcon />
                    <span className="font-semibold">Error:</span>
                    <span>{error}</span>
                </div>
            )}

            {result && (
                <div className="space-y-8 animate-fade-in">
                    <div className="p-4 bg-success/20 text-success rounded-lg flex items-center space-x-3">
                        <CheckCircleIcon />
                        <span className="font-semibold">Backtest Complete!</span>
                        <span>Displaying AI-generated results for {selectedPair}.</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard title="Total Profit" value={`${result.summary.totalProfitPercent.toFixed(2)}%`} icon={<ArrowUpIcon />} change={result.summary.totalProfitPercent} />
                        <KpiCard title="Win Rate" value={`${result.summary.winRatePercent.toFixed(1)}%`} icon={<ScaleIcon />} />
                        <KpiCard title="Sharpe Ratio" value={result.summary.sharpeRatio.toFixed(2)} icon={<SparklesIcon />} />
                        <KpiCard title="Total Trades" value={result.summary.totalTrades.toString()} icon={<ArrowDownIcon />} />
                    </div>
                    
                    <TradesTable title="Example Trades from Backtest" trades={result?.trades || []} isHistory={true} />
                </div>
            )}
        </div>
    );
};

export default BacktestView;
