import { Card, Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import type { CategorySummary } from '../../types/cashflow';

interface CategorySummaryTableProps {
  categories?: CategorySummary[];
  loading?: boolean;
}

export function CategorySummaryTable({
  categories,
  loading,
}: CategorySummaryTableProps) {
  const { t } = useTranslation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const columns: ColumnsType<CategorySummary> = [
    {
      title: t('table.category'),
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: t('table.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'INCOME' ? 'green' : 'red'}>
          {type === 'INCOME' ? t('dashboard.income') : t('dashboard.expense')}
        </Tag>
      ),
    },
    {
      title: t('table.quantity'),
      dataIndex: 'count',
      key: 'count',
      align: 'center',
    },
    {
      title: t('table.total'),
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (value: number, record) => (
        <span
          style={{
            color: record.type === 'INCOME' ? '#3f8600' : '#cf1322',
            fontWeight: 'bold',
          }}
        >
          {formatCurrency(value)}
        </span>
      ),
    },
  ];

  return (
    <Card title={t('dashboard.categorySummary')}>
      <Table
        columns={columns}
        dataSource={categories || []}
        loading={loading}
        rowKey={(record) => `${record.category}-${record.type}`}
        pagination={false}
        size="small"
      />
    </Card>
  );
}
