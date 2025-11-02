import { useState } from 'react';
import { Space, Typography, Alert, Button, Row, Col } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { PeriodSelector } from '../components/dashboard/PeriodSelector';
import { FinancialSummaryCards } from '../components/dashboard/FinancialSummaryCards';
import { CashFlowChart } from '../components/dashboard/CashFlowChart';
import { RecentTransactionsTable } from '../components/dashboard/RecentTransactionsTable';
import { useDashboardData } from '../hooks/useCashFlow';
import { generateCashFlowReport } from '../utils/reports';

const { Title } = Typography;

export function DashboardFinanceiro() {
  const { t } = useTranslation();
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // Estado para controlar o período selecionado
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });

  const { summary, transactions, isLoading, isError } =
    useDashboardData(dateRange.startDate, dateRange.endDate);

  const handlePeriodChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  const handleGenerateCashFlowPdf = () => {
    if (!transactions || !summary) return;

    setIsPdfLoading(true);
    try {
      generateCashFlowReport({
        entries: transactions.map(t => ({
          cash_flow_id: typeof t.cash_flow_id === 'string' ? parseInt(t.cash_flow_id, 10) : t.cash_flow_id,
          amount: t.amount,
          direction: t.direction,
          occurred_at: t.occurred_at,
          note: t.note || undefined,
          created_at: t.created_at,
        })),
        summary: {
          totalIncome: summary.totalIncome || 0,
          totalExpense: summary.totalExpense || 0,
          balance: summary.balance || 0,
        },
        categorySummary: [], // Removed category summary as it's not functional
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsPdfLoading(false);
    }
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
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>{t('dashboard.title')}</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
            onClick={handleGenerateCashFlowPdf}
            loading={isPdfLoading}
            disabled={!transactions || transactions.length === 0}
          >
            Gerar Relatório (PDF)
          </Button>
        </Col>
      </Row>

      <PeriodSelector onPeriodChange={handlePeriodChange} />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <FinancialSummaryCards summary={summary} loading={isLoading} />

        <CashFlowChart transactions={transactions} loading={isLoading} />

        <RecentTransactionsTable transactions={transactions} loading={isLoading} />
      </Space>
    </div>
  );
}
