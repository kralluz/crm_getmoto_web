import { useState, useMemo, useEffect } from 'react';
import { Table, Card, Input, Tag, Space, Select, Button, DatePicker, Row, Col } from 'antd';
import { SearchOutlined, FilterOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { useCashFlowTransactions, useDeleteTransaction } from '../hooks/useCashFlow';
import { ActionButtons } from '../components/common/ActionButtons';
import { PageHeader } from '../components/common/PageHeader';
import type { CashFlowTransaction, CashFlowDirection } from '../types/cashflow';
import { getTransactionSource } from '../types/cashflow';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: transactions, isLoading } = useCashFlowTransactions({
    startDate: dateRange?.[0],
    endDate: dateRange?.[1],
  });
  const { mutate: deleteTransaction } = useDeleteTransaction();

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
      title: t('cashflow.date'),
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      width: 120,
      render: (date: string) => formatDate(date, 'short'),
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
      title: t('cashflow.source'),
      key: 'source',
      width: 150,
      render: (_, record) => {
        const source = getTransactionSource(record);
        const sourceLabels = {
          service_order: t('cashflow.sources.service_order'),
          service_realized: t('cashflow.sources.service_realized'),
          service_product: t('cashflow.sources.service_product'),
          purchase_order: t('cashflow.sources.purchase_order'),
          expense: t('cashflow.sources.expense'),
          orphan: t('cashflow.sources.orphan'),
        };

        const sourceColors = {
          service_order: 'blue',
          service_realized: 'cyan',
          service_product: 'geekblue',
          purchase_order: 'purple',
          expense: 'magenta',
          orphan: 'orange',
        };

        return (
          <Tag color={sourceColors[source]}>
            {sourceLabels[source]}
          </Tag>
        );
      },
    },
    {
      title: 'OS',
      key: 'service_order_id',
      width: 80,
      align: 'center',
      render: (_, record) => {
        if (!record.service_order_id) return '-';
        return (
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/servicos/${record.service_order_id}`)}
          >
            #{record.service_order_id}
          </Button>
        );
      },
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
        title={t('cashflow.movementsList')}
        subtitle={t('cashflow.movementsListSubtitle')}
        helpText={t('cashflow.pageHelp')}
      />

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={8}>
            <Input
              placeholder={t('cashflow.searchMovements')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={5}>
            <Select
              placeholder={t('cashflow.typeFilter')}
              value={directionFilter}
              onChange={setDirectionFilter}
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: t('cashflow.allTypes') },
                { value: 'entrada', label: t('cashflow.incomes') },
                { value: 'saida', label: t('cashflow.expenses') },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={7}>
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={[t('cashflow.startDate'), t('cashflow.endDate')]}
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
            />
          </Col>

          {(searchText || directionFilter !== 'all' || dateRange) && (
            <Col xs={24} sm={24} md={8} lg={4}>
              <Button
                block
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchText('');
                  setDirectionFilter('all');
                  setDateRange(undefined);
                }}
              >
                {t('common.clearFilters')}
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <div style={{ textAlign: 'center', padding: isMobile ? '8px 0' : '0' }}>
              <div style={{ color: '#8c8c8c', fontSize: isMobile ? 11 : 14, marginBottom: 4 }}>{t('cashflow.totalIncome')}</div>
              <div style={{ color: '#52c41a', fontSize: isMobile ? 16 : 24, fontWeight: 600, wordBreak: 'break-word' }}>
                {formatCurrency(totals.income)}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ textAlign: 'center', padding: isMobile ? '8px 0' : '0' }}>
              <div style={{ color: '#8c8c8c', fontSize: isMobile ? 11 : 14, marginBottom: 4 }}>{t('cashflow.totalExpense')}</div>
              <div style={{ color: '#ff4d4f', fontSize: isMobile ? 16 : 24, fontWeight: 600, wordBreak: 'break-word' }}>
                {formatCurrency(totals.expense)}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ textAlign: 'center', padding: isMobile ? '8px 0' : '0' }}>
              <div style={{ color: '#8c8c8c', fontSize: isMobile ? 11 : 14, marginBottom: 4 }}>{t('cashflow.balanceLabel')}</div>
              <div style={{
                color: totals.balance >= 0 ? '#52c41a' : '#ff4d4f',
                fontSize: isMobile ? 16 : 24,
                fontWeight: 600,
                wordBreak: 'break-word'
              }}>
                {formatCurrency(totals.balance)}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredTransactions}
          loading={isLoading}
          rowKey="cash_flow_id"
          pagination={{
            pageSize: isMobile ? 10 : 20,
            showSizeChanger: !isMobile,
            showTotal: (total) => t('cashflow.totalMovements', { total }),
            pageSizeOptions: ['10', '20', '50', '100'],
            simple: isMobile,
          }}
          size={isMobile ? 'middle' : 'small'}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}
