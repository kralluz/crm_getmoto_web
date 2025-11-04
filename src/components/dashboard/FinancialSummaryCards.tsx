import { Card, Col, Row, Statistic } from 'antd';
import {
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { CashFlowSummary } from '../../types/cashflow';

interface FinancialSummaryCardsProps {
  summary?: CashFlowSummary;
  loading?: boolean;
}

export function FinancialSummaryCards({
  summary,
  loading,
}: FinancialSummaryCardsProps) {
  const { t } = useTranslation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(value);
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={8}>
        <Card loading={loading}>
          <Statistic
            title={t('dashboard.currentBalance')}
            value={summary?.balance || 0}
            precision={2}
            prefix={<DollarOutlined />}
            formatter={(value) => formatCurrency(Number(value))}
            valueStyle={{
              color: (summary?.balance || 0) >= 0 ? '#3f8600' : '#cf1322',
            }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card loading={loading}>
          <Statistic
            title={t('dashboard.periodIncome')}
            value={summary?.totalIncome || 0}
            precision={2}
            prefix={<ArrowUpOutlined />}
            formatter={(value) => formatCurrency(Number(value))}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card loading={loading}>
          <Statistic
            title={t('dashboard.periodExpenses')}
            value={summary?.totalExpense || 0}
            precision={2}
            prefix={<ArrowDownOutlined />}
            formatter={(value) => formatCurrency(Number(value))}
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
      </Col>
    </Row>
  );
}
