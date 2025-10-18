import { Card, Table, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { CashFlowTransaction } from '../../types/cashflow';

interface RecentTransactionsTableProps {
  transactions?: CashFlowTransaction[];
  loading?: boolean;
}

export function RecentTransactionsTable({
  transactions,
  loading,
}: RecentTransactionsTableProps) {
  const { t } = useTranslation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const columns: ColumnsType<CashFlowTransaction> = [
    {
      title: t('table.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      width: 120,
    },
    {
      title: t('table.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('table.category'),
      dataIndex: 'category',
      key: 'category',
      width: 150,
    },
    {
      title: t('table.type'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'INCOME' ? 'green' : 'red'}>
          {type === 'INCOME' ? t('dashboard.income') : t('dashboard.expense')}
        </Tag>
      ),
    },
    {
      title: t('table.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 130,
      render: (value: number, record) => (
        <span
          style={{
            color: record.type === 'INCOME' ? '#3f8600' : '#cf1322',
            fontWeight: 'bold',
          }}
        >
          {record.type === 'INCOME' ? '+' : '-'} {formatCurrency(value)}
        </span>
      ),
    },
  ];

  return (
    <Card title={t('dashboard.recentTransactions')}>
      <Table
        columns={columns}
        dataSource={transactions?.slice(0, 10) || []}
        loading={loading}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </Card>
  );
}
