import { Card } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
import type { CashFlowTransaction } from '../../types/cashflow';

interface CashFlowChartProps {
  transactions?: CashFlowTransaction[];
  loading?: boolean;
}

export function CashFlowChart({ transactions, loading }: CashFlowChartProps) {
  const { t } = useTranslation();

  // Agrupar transações por data
  const groupedData = Array.isArray(transactions) ? transactions.reduce(
    (acc, transaction) => {
      const date = dayjs.utc(transaction.occurred_at).format('DD/MM');
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      if (transaction.direction === 'entrada') {
        acc[date].income += Number(transaction.amount);
      } else {
        acc[date].expense += Number(transaction.amount);
      }
      return acc;
    },
    {} as Record<string, { date: string; income: number; expense: number }>
  ) : {};

  // Converter para array
  const chartData = Object.values(groupedData).sort((a, b) => {
    const [dayA, monthA] = a.date.split('/').map(Number);
    const [dayB, monthB] = b.date.split('/').map(Number);
    return monthA === monthB ? dayA - dayB : monthA - monthB;
  });

  const formatCurrency = (value: number) => {
    return `£${value.toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, marginBottom: 5, fontWeight: 600 }}>{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: 0, color: entry.color }}>
              {entry.name}: £{entry.value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card title={t('dashboard.cashFlowChart')} loading={loading}>
      {chartData && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#52c41a" 
              strokeWidth={2}
              name={t('dashboard.income')}
              dot={{ fill: '#52c41a', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="expense" 
              stroke="#ff4d4f" 
              strokeWidth={2}
              name={t('dashboard.expense')}
              dot={{ fill: '#ff4d4f', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          {t('dashboard.noData')}
        </div>
      )}
    </Card>
  );
}
