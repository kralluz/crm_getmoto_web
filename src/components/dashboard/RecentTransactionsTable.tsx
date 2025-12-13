import { Card, Table, Tag, List } from 'antd';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { formatDate } from '../../utils/format.util';
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
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const isCancelled = (note: string | null) => {
    return note?.toUpperCase().includes('ESTORNO') || false;
  };

  const columns: ColumnsType<CashFlowTransaction> = [
    {
      title: t('table.date'),
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      render: (date: string, record) => (
        <span style={{ textDecoration: isCancelled(record.note ?? null) ? 'line-through' : 'none' }}>
          {formatDate(date)}
        </span>
      ),
      width: 120,
    },
    {
      title: t('table.description'),
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note: string | null) => (
        <span style={{ textDecoration: isCancelled(note) ? 'line-through' : 'none' }}>
          {note || '-'}
        </span>
      ),
    },
    {
      title: t('table.type'),
      dataIndex: 'direction',
      key: 'direction',
      width: 100,
      render: (direction: string, record) => (
        <Tag
          color={direction === 'entrada' ? 'green' : 'red'}
          style={{ textDecoration: isCancelled(record.note ?? null) ? 'line-through' : 'none' }}
        >
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
            textDecoration: isCancelled(record.note ?? null) ? 'line-through' : 'none',
          }}
        >
          {record.direction === 'entrada' ? '+' : '-'} {formatCurrency(value)}
        </span>
      ),
    },
  ];

  // Versão mobile compacta
  if (isMobile) {
    return (
      <Card title={t('dashboard.recentTransactions')} className="mobile-transactions-card">
        <List
          loading={loading}
          dataSource={Array.isArray(transactions) ? transactions.slice(0, 10) : []}
          renderItem={(item: CashFlowTransaction) => (
            <List.Item
              onClick={() => navigate(`/movimentacoes/${item.cash_flow_id}`)}
              style={{
                cursor: 'pointer',
                padding: '8px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#8c8c8c',
                    marginBottom: '4px',
                    textDecoration: isCancelled(item.note ?? null) ? 'line-through' : 'none'
                  }}>
                    {formatDate(item.occurred_at)}
                  </div>
                  <Tag
                    color={item.direction === 'entrada' ? 'green' : 'red'}
                    style={{ 
                      fontSize: '11px',
                      padding: '2px 8px',
                      textDecoration: isCancelled(item.note ?? null) ? 'line-through' : 'none'
                    }}
                  >
                    {item.direction === 'entrada' ? t('dashboard.income') : t('dashboard.expense')}
                  </Tag>
                </div>
                <div style={{
                  textAlign: 'right',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: item.direction === 'entrada' ? '#3f8600' : '#cf1322',
                  textDecoration: isCancelled(item.note ?? null) ? 'line-through' : 'none'
                }}>
                  {item.direction === 'entrada' ? '+' : '-'} {formatCurrency(item.amount)}
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>
    );
  }

  // Versão desktop
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
