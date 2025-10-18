import { Card } from 'antd';
import { Line } from '@ant-design/charts';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { CashFlowTransaction } from '../../types/cashflow';

interface CashFlowChartProps {
  transactions?: CashFlowTransaction[];
  loading?: boolean;
}

export function CashFlowChart({ transactions, loading }: CashFlowChartProps) {
  const { t } = useTranslation();

  // Agrupar transações por data
  const groupedData = transactions?.reduce(
    (acc, transaction) => {
      const date = dayjs(transaction.date).format('DD/MM');
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      if (transaction.type === 'INCOME') {
        acc[date].income += Number(transaction.amount);
      } else {
        acc[date].expense += Number(transaction.amount);
      }
      return acc;
    },
    {} as Record<string, { date: string; income: number; expense: number }>
  );

  // Converter para array e format para o gráfico
  const chartData =
    groupedData &&
    Object.values(groupedData).flatMap((item) => [
      { date: item.date, type: t('dashboard.income'), value: item.income },
      { date: item.date, type: t('dashboard.expense'), value: item.expense },
    ]);

  const config = {
    data: chartData || [],
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    color: ['#3f8600', '#cf1322'],
    yAxis: {
      label: {
        formatter: (v: string) =>
          `R$ ${Number(v).toLocaleString('pt-BR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`,
      },
    },
    tooltip: {
      formatter: (datum: { type: string; value: number }) => {
        return {
          name: datum.type,
          value: `R$ ${Number(datum.value).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        };
      },
    },
    legend: {
      position: 'top' as const,
    },
  };

  return (
    <Card title={t('dashboard.cashFlowChart')} loading={loading}>
      {chartData && chartData.length > 0 ? (
        <Line {...config} />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          {t('dashboard.noData')}
        </div>
      )}
    </Card>
  );
}
