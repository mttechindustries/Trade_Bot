
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: number;
  subValue?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, change, subValue }) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-100">{value}</p>
        {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
        {change !== undefined && (
          <p className={`text-sm font-semibold mt-1 ${isPositive ? 'text-success' : 'text-danger'}`}>
            {isPositive ? '+' : ''}{change.toFixed(2)}%
          </p>
        )}
      </div>
      <div className="bg-primary/20 p-3 rounded-full">
        <div className="text-primary h-6 w-6">{icon}</div>
      </div>
    </div>
  );
};

export default KpiCard;
