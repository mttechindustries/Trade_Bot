
import { useState, useMemo, useEffect } from 'react';
import { Trade, AiAnalysisType, PortfolioHistoryPoint } from '../types';
import KpiCard from './KpiCard';
import TradesTable from './TradesTable';
import TradeAnalysisModal from './TradeAnalysisModal';
import PortfolioChart from './PortfolioChart';
import DateTimeDisplay from './DateTimeDisplay';
import { ArrowUpIcon, ArrowDownIcon, ScaleIcon, ClockIcon } from './icons/InterfaceIcons';

interface DashboardProps {
  openTrades: Trade[];
  closedTrades: Trade[];
}

const Dashboard: React.FC<DashboardProps> = ({ openTrades, closedTrades }) => {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>([]);

  // Generate real portfolio history based on actual trades
  useEffect(() => {
    const generatePortfolioHistory = () => {
      const history: PortfolioHistoryPoint[] = [];
      const startValue = 10000; // Starting portfolio value
      let currentValue = startValue;
      
      // Generate history for the last 30 days
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Calculate portfolio value based on closed trades up to this date
        const tradesUpToDate = closedTrades.filter(trade => 
          new Date(trade.closeTime || trade.openTime) <= date
        );
        
        const totalProfit = tradesUpToDate.reduce((acc, trade) => 
          acc + (trade.profit.amount * trade.stakeAmount), 0
        );
        
        currentValue = startValue + totalProfit;
        
        history.push({
          date: date.toISOString().split('T')[0],
          value: currentValue
        });
      }
      
      setPortfolioHistory(history);
    };

    generatePortfolioHistory();
  }, [closedTrades]);

  const stats = useMemo(() => {
    const totalProfit = closedTrades.reduce((acc, trade) => acc + trade.profit.amount * trade.stakeAmount, 0);
    const totalProfitPercent = closedTrades.length > 0
        ? closedTrades.reduce((acc, trade) => acc + trade.profit.percent, 0) / closedTrades.length
        : 0;
    const wins = closedTrades.filter(t => t.profit.percent > 0).length;
    const losses = closedTrades.length - wins;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

    return { totalProfit, totalProfitPercent, wins, losses, winRate };
  }, [closedTrades]);

  const handleRowClick = (trade: any) => {
    // Convert DisplayTrade back to Trade for the modal
    const fullTrade: Trade = {
      ...trade,
      stakeAmount: trade.stakeAmount || 1000,
      stopLoss: trade.stopLoss || 0,
      side: trade.side || 'long',
      status: trade.status || 'closed',
      fees: trade.fees || 0,
      exchange: trade.exchange || 'binance',
      leverage: trade.leverage
    };
    setSelectedTrade(fullTrade);
    setModalOpen(true);
  };

  // Convert Trade[] to DisplayTrade[] for the table
  const convertToDisplayTrades = (trades: Trade[]) => {
    return trades.map(trade => ({
      id: trade.id,
      pair: trade.pair,
      openTime: trade.openTime,
      closeTime: trade.closeTime,
      openRate: trade.openRate,
      closeRate: trade.closeRate,
      currentRate: trade.currentRate,
      profit: trade.profit,
      leverage: trade.leverage
    }));
  };

  return (
    <div className="space-y-8">
      {/* Current Date & Time Display */}
      <DateTimeDisplay />
      
      <PortfolioChart data={portfolioHistory} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Profit" value={`$${stats.totalProfit.toFixed(2)}`} icon={<ArrowUpIcon />} change={stats.totalProfitPercent} />
        <KpiCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={<ScaleIcon />} subValue={`${stats.wins}W / ${stats.losses}L`} />
        <KpiCard title="Open Trades" value={openTrades.length.toString()} icon={<ClockIcon />} />
        <KpiCard title="Total Closed" value={closedTrades.length.toString()} icon={<ArrowDownIcon />} />
      </div>

      <div className="space-y-8">
        <TradesTable title="Open Trades" trades={convertToDisplayTrades(openTrades)} onRowClick={handleRowClick} />
        <TradesTable title="Trade History" trades={convertToDisplayTrades(closedTrades)} onRowClick={handleRowClick} isHistory={true}/>
      </div>

      {selectedTrade && (
         <TradeAnalysisModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          trade={selectedTrade}
          analysisType={selectedTrade.closeTime ? AiAnalysisType.TRADE_EXPLANATION : AiAnalysisType.MARKET_SENTIMENT}
        />
      )}
    </div>
  );
};

export default Dashboard;