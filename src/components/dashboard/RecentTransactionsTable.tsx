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

  const parseAmount = (value: unknown): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      // Normaliza valores vindos em formatos brasileiros como "1.234,56"
      const s = value.trim();
      // Se houver vírgula, assumimos formato PT-BR: pontos como milhares e vírgula como decimal
      let normalized = s;
      if (normalized.indexOf(',') > -1) {
        normalized = normalized.replace(/\./g, '').replace(/,/g, '.');
      } else {
        // Remove separadores de milhar (vírgulas ou espaços) se existirem
        normalized = normalized.replace(/[,\s]/g, '');
      }
      const n = Number(normalized);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  };

  const formatCurrency = (value: unknown) => {
    const num = parseAmount(value);
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(num);
  };

  const columns: ColumnsType<CashFlowTransaction> = [
    {
      title: t('table.date'),
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      width: 120,
    },
    {
      title: t('table.description'),
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note: string | null) => note || '-',
    },
    {
      title: t('table.type'),
      dataIndex: 'direction',
      key: 'direction',
      width: 100,
      render: (direction: string) => (
        <Tag color={direction === 'entrada' ? 'green' : 'red'}>
          {direction === 'entrada' ? t('dashboard.income') : t('dashboard.expense')}
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
            color: record.direction === 'entrada' ? '#3f8600' : '#cf1322',
            fontWeight: 'bold',
          }}
        >
          {record.direction === 'entrada' ? '+' : '-'} {formatCurrency(value)}
        </span>
      ),
    },
  ];

  return (
    <Card title={t('dashboard.recentTransactions')}>
      <Table
        columns={columns}
        dataSource={Array.isArray(transactions) ? transactions.slice(0, 10) : []}
        loading={loading}
        rowKey={(record) => String(record.cash_flow_id)}
        pagination={false}
        size="small"
      />
    </Card>
  );
}
