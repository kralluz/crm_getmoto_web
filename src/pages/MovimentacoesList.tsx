import { useState, useMemo } from 'react';
import { Table, Card, Input, Tag, Space, Select, Button, DatePicker } from 'antd';
import { SearchOutlined, PlusOutlined, FilterOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { useCashFlowTransactions, useDeleteTransaction } from '../hooks/useCashFlow';
import { ActionButtons } from '../components/common/ActionButtons';
import { PageHeader } from '../components/common/PageHeader';
import type { CashFlowTransaction, CashFlowDirection } from '../types/cashflow';
import { useFormat } from '../hooks/useFormat';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export function MovimentacoesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency, formatDate } = useFormat();
  const [searchText, setSearchText] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | CashFlowDirection>('all');
  const [dateRange, setDateRange] = useState<[string, string] | undefined>(undefined);

  const { data: transactions, isLoading } = useCashFlowTransactions({
    startDate: dateRange?.[0],
    endDate: dateRange?.[1],
  });
  const { mutate: deleteTransaction } = useDeleteTransaction();

  // Filtrar transações localmente
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];

    return transactions.filter(transaction => {
      const matchesSearch = searchText === '' ||
        (transaction.note?.toLowerCase().includes(searchText.toLowerCase()));

      const matchesDirection = directionFilter === 'all' || transaction.direction === directionFilter;

      return matchesSearch && matchesDirection;
    });
  }, [transactions, searchText, directionFilter]);

  const handleView = (id: number | string) => {
    navigate(`/movimentacoes/${id}`);
  };

  const handleDelete = async (id: number | string) => {
    deleteTransaction(String(id));
  };

  const handleCreate = () => {
    navigate('/transacao');
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([
        dayjs(dates[0]).format('YYYY-MM-DD'),
        dayjs(dates[1]).format('YYYY-MM-DD'),
      ]);
    } else {
      setDateRange(undefined);
    }
  };

  const columns: ColumnsType<CashFlowTransaction> = [
    {
      title: t('cashflow.actions'),
      key: 'actions',
      width: 80,
      align: 'center',
      fixed: 'left',
      render: (_, record) => (
        <ActionButtons
          onView={() => handleView(record.cash_flow_id)}
          onDelete={() => handleDelete(record.cash_flow_id)}
          showView
          showEdit={false}
          deleteTitle={t('cashflow.deleteMovement')}
          deleteDescription={t('cashflow.deleteMovementConfirm')}
          iconOnly
        />
      ),
    },
    {
      title: 'ID',
      dataIndex: 'cash_flow_id',
      key: 'cash_flow_id',
      width: 80,
      sorter: (a, b) => Number(a.cash_flow_id) - Number(b.cash_flow_id),
    },
    {
      title: t('cashflow.date'),
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      width: 120,
      render: (date: string) => formatDate(date),
      sorter: (a, b) => dayjs(a.occurred_at).unix() - dayjs(b.occurred_at).unix(),
    },
    {
      title: t('cashflow.type'),
      dataIndex: 'direction',
      key: 'direction',
      width: 100,
      align: 'center',
      render: (direction: CashFlowDirection) => {
        const isIncome = direction === 'entrada';
        return (
          <Tag
            color={isIncome ? 'green' : 'red'}
            icon={isIncome ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          >
            {isIncome ? t('cashflow.income') : t('cashflow.expense')}
          </Tag>
        );
      },
      filters: [
        { text: t('cashflow.income'), value: 'entrada' },
        { text: t('cashflow.expense'), value: 'saida' },
      ],
      onFilter: (value, record) => record.direction === value,
    },
    {
      title: t('cashflow.description'),
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note: string | null) => note || '-',
    },
    {
      title: t('cashflow.value'),
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (value: number, record) => {
        const isIncome = record.direction === 'entrada';
        return (
          <span style={{
            fontWeight: 600,
            color: isIncome ? '#52c41a' : '#ff4d4f'
          }}>
            {isIncome ? '+' : '-'} {formatCurrency(Math.abs(value))}
          </span>
        );
      },
      sorter: (a, b) => a.amount - b.amount,
    },
  ];

  // Calcular totais
  const totals = useMemo(() => {
    if (!Array.isArray(filteredTransactions)) {
      return { income: 0, expense: 0, balance: 0 };
    }

    const income = filteredTransactions
      .filter(t => t.direction === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter(t => t.direction === 'saida')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  return (
    <div>
      <PageHeader
        title="Movimentações Financeiras"
        subtitle="Visualize e gerencie todas as transações do sistema"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="large"
          >
            Nova Transação
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Space direction="horizontal" size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
          <Input
            placeholder="Buscar por descrição..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />

          <Select
            placeholder={t('cashflow.typeFilter')}
            value={directionFilter}
            onChange={setDirectionFilter}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: t('cashflow.allTypes') },
              { value: 'entrada', label: t('cashflow.incomes') },
              { value: 'saida', label: t('cashflow.expenses') },
            ]}
          />

          <RangePicker
            format="DD/MM/YYYY"
            placeholder={[t('cashflow.startDate'), t('cashflow.endDate')]}
            onChange={handleDateRangeChange}
            style={{ width: 280 }}
          />

          {(searchText || directionFilter !== 'all' || dateRange) && (
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchText('');
                setDirectionFilter('all');
                setDateRange(undefined);
              }}
            >
              Limpar Filtros
            </Button>
          )}
        </Space>
      </Card>

      {/* Card com resumo dos totais */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" style={{ width: '100%', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#8c8c8c', fontSize: 14, marginBottom: 4 }}>Total de Entradas</div>
            <div style={{ color: '#52c41a', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(totals.income)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#8c8c8c', fontSize: 14, marginBottom: 4 }}>Total de Saídas</div>
            <div style={{ color: '#ff4d4f', fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(totals.expense)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#8c8c8c', fontSize: 14, marginBottom: 4 }}>Saldo</div>
            <div style={{
              color: totals.balance >= 0 ? '#52c41a' : '#ff4d4f',
              fontSize: 24,
              fontWeight: 600
            }}>
              {formatCurrency(totals.balance)}
            </div>
          </div>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredTransactions}
          loading={isLoading}
          rowKey="cash_flow_id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} movimentações`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          size="small"
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}
