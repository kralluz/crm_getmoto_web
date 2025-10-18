import { useState } from 'react';
import { Space, Typography, Spin, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { PeriodSelector } from '../components/dashboard/PeriodSelector';
import { FinancialSummaryCards } from '../components/dashboard/FinancialSummaryCards';
import { CashFlowChart } from '../components/dashboard/CashFlowChart';
import { CategorySummaryTable } from '../components/dashboard/CategorySummaryTable';
import { RecentTransactionsTable } from '../components/dashboard/RecentTransactionsTable';
import { useDashboardData } from '../hooks/useCashFlow';

const { Title } = Typography;

export function DashboardFinanceiro() {
  const { t } = useTranslation();

  // Estado para controlar o período selecionado
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });

  const { summary, categories, transactions, isLoading, isError } =
    useDashboardData(dateRange.startDate, dateRange.endDate);

  const handlePeriodChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  if (isError) {
    return (
      <Alert
        message={t('common.error')}
        description="Não foi possível carregar os dados do dashboard. Verifique sua conexão e tente novamente."
        type="error"
        showIcon
      />
    );
  }

  return (
    <div>
      <Title level={2}>{t('dashboard.title')}</Title>

      <PeriodSelector onPeriodChange={handlePeriodChange} />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <FinancialSummaryCards summary={summary} loading={isLoading} />

        <CashFlowChart transactions={transactions} loading={isLoading} />

        <CategorySummaryTable categories={categories} loading={isLoading} />

        <RecentTransactionsTable transactions={transactions} loading={isLoading} />
      </Space>
    </div>
  );
}
