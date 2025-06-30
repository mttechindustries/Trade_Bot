
import { formatTime, formatDate } from '../services/timeService';

type DisplayTrade = {
  id?: number | string;
  pair: string;
  openTime: string;
  closeTime?: string;
  openRate: number;
  closeRate?: number;
  currentRate?: number;
  profit: { percent: number };
  leverage?: number;
};

interface TradesTableProps {
  title: string;
  trades: DisplayTrade[];
  isHistory?: boolean;
  onRowClick?: (trade: DisplayTrade) => void;
}

// Helper function to format datetime in Detroit timezone
const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${formatDate(date)} ${formatTime(date, true)}`;
};

interface ProfitDisplayProps {
  profit: number;
}

const ProfitDisplay = ({ profit }: ProfitDisplayProps) => {
  const isPositive = profit >= 0;
  return (
    <span className={isPositive ? 'text-success' : 'text-danger'}>
      {profit.toFixed(2)}%
    </span>
  );
};

const TradesTable = ({ title, trades, isHistory = false, onRowClick }: TradesTableProps) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <h3 className="text-lg font-semibold text-gray-100 p-4 border-b border-gray-700">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pair</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Open Time</th>
              {isHistory && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Close Time</th>}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Open Rate</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{isHistory ? 'Close Rate' : 'Current Rate'}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Profit %</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Leverage</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {trades.map((trade: DisplayTrade, index: number) => (
              <tr 
                key={trade.id || `${trade.pair}-${index}`} 
                onClick={() => onRowClick?.(trade)} 
                className={onRowClick ? "hover:bg-gray-700/50 cursor-pointer transition-colors duration-150" : ""}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{trade.pair}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDateTime(trade.openTime)}</td>
                {isHistory && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{trade.closeTime ? formatDateTime(trade.closeTime) : 'N/A'}</td>}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{trade.openRate.toFixed(4)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{isHistory ? trade.closeRate?.toFixed(4) : trade.currentRate?.toFixed(4)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold"><ProfitDisplay profit={trade.profit.percent} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{trade.leverage ? `${trade.leverage}x` : 'Spot'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       {trades.length === 0 && (
          <p className="text-center py-8 text-gray-500">No trades to display.</p>
        )}
    </div>
  );
};

export default TradesTable;
