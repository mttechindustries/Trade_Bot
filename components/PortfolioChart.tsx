
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PortfolioHistoryPoint } from '../types';
import { format } from 'date-fns';

interface PortfolioChartProps {
    data: PortfolioHistoryPoint[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0]?.value || 0;
      const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
      return (
        <div className="bg-gray-800/80 backdrop-blur-sm p-3 rounded-md border border-gray-600 shadow-lg">
          <p className="label text-gray-300">{`Date : ${format(new Date(label), 'MMM dd, yyyy')}`}</p>
          <p className="intro text-primary font-semibold">{`Portfolio Value : $${safeValue.toLocaleString()}`}</p>
        </div>
      );
    }
  
    return null;
};

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data }) => {
    return (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
             <h3 className="text-lg font-semibold text-gray-100 mb-4">Portfolio History (30 Days)</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 20,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis 
                            dataKey="date" 
                            stroke="#6b7280" 
                            tickFormatter={(str) => format(new Date(str), 'MMM d')}
                        />
                        <YAxis 
                            stroke="#6b7280" 
                            tickFormatter={(value) => `$${(Number(value)/1000)}k`}
                            domain={['dataMin - 1000', 'dataMax + 1000']}
                            allowDataOverflow={true}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" stroke="#818cf8" fill="url(#colorValue)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PortfolioChart;