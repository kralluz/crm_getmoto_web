import { useState, useMemo, useEffect } from 'react';
import { Space, Alert, Row, Col, Tabs, Card, Table, Input, Select, Button, DatePicker, Tag, List } from 'antd';
import { SearchOutlined, FilterOutlined, ArrowUpOutlined, ArrowDownOutlined, DashboardOutlined, UnorderedListOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { PeriodSelector } from '../components/dashboard/PeriodSelector';
import { FinancialSummaryCards } from '../components/dashboard/FinancialSummaryCards';
import { CashFlowChart } from '../components/dashboard/CashFlowChart';
import { RecentTransactionsTable } from '../components/dashboard/RecentTransactionsTable';
import { DashboardFloatingMenu } from '../components/dashboard/DashboardFloatingMenu';
import { PageHeader } from '../components/common/PageHeader';
import { useDashboardData } from '../hooks/useCashFlow';
import { generateCashFlowReport } from '../utils/reports';
import type { CashFlowTransaction, CashFlowDirection } from '../types/cashflow';
import { getTransactionSource } from '../types/cashflow';
import { useFormat } from '../hooks/useFormat';
import { useHideCancelled } from '../hooks/useHideCancelled';
import { HideCancelledCheckbox } from '../components/common/HideCancelledCheckbox';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;

export function DashboardFinanceiro() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency, formatDate } = useFormat();
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Hook para detectar mudanças no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hook para ocultar cancelamentos
  const { hideCancelled, setHideCancelled } = useHideCancelled('dashboard');

  // Filtros da aba de movimentações
  const [searchText, setSearchText] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | CashFlowDirection>('all');
  const [movementDateRange, setMovementDateRange] = useState<[string, string] | undefined>(undefined);
  const [pageSize, setPageSize] = useState(20);

  // Estado para controlar o período selecionado (usado na visão geral)
  // Sincronizado com o período padrão do PeriodSelector ('thisMonth')
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'), // Início do mês atual
    endDate: dayjs().format('YYYY-MM-DD'), // Hoje
  });

  const { summary, transactions, isLoading, isError } =
    useDashboardData(dateRange.startDate, dateRange.endDate);

  const handlePeriodChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  const handleGenerateCashFlowPdf = async () => {
    if (!transactions || !summary) return;

    setIsPdfLoading(true);
    try {
      await generateCashFlowReport({
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
        categorySummary: [],
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        t,
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Função auxiliar para verificar se transação foi cancelada/estornada
  const isCancelled = (note: string | null) => {
    return note?.toUpperCase().includes('ESTORNO') || false;
  };

  // Filtrar transações para a aba de movimentações
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];

    let filtered = transactions;

    // Aplicar filtro de data da aba de movimentações (se definido)
    if (movementDateRange) {
      filtered = filtered.filter(t => {
        const transactionDate = dayjs(t.occurred_at);
        return transactionDate.isSameOrAfter(dayjs(movementDateRange[0]), 'day') &&
               transactionDate.isSameOrBefore(dayjs(movementDateRange[1]), 'day');
      });
    }

    // Aplicar filtro de busca
    if (searchText) {
      filtered = filtered.filter(t =>
        t.note?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Aplicar filtro de direção
    if (directionFilter !== 'all') {
      filtered = filtered.filter(t => t.direction === directionFilter);
    }

    // Aplicar filtro de cancelados
    if (hideCancelled) {
      filtered = filtered.filter(t => !isCancelled(t.note ?? null));
    }

    return filtered;
  }, [transactions, searchText, directionFilter, movementDateRange, hideCancelled]);

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setMovementDateRange([
        dayjs(dates[0]).format('YYYY-MM-DD'),
        dayjs(dates[1]).format('YYYY-MM-DD'),
      ]);
    } else {
      setMovementDateRange(undefined);
    }
  };

  // Calcular totais baseado em TODAS as transações (não nas filtradas)
  // para que o total não seja afetado pelo filtro de ocultar cancelamentos
  const totals = useMemo(() => {
    if (!Array.isArray(transactions)) {
      return { income: 0, expense: 0, balance: 0 };
    }

    // Filtrar apenas por data se movementDateRange estiver definido
    let transactionsForTotal = transactions;
    if (movementDateRange) {
      transactionsForTotal = transactions.filter(t => {
        const transactionDate = dayjs(t.occurred_at);
        return transactionDate.isSameOrAfter(dayjs(movementDateRange[0]), 'day') &&
               transactionDate.isSameOrBefore(dayjs(movementDateRange[1]), 'day');
      });
    }

    // Excluir apenas cancelamentos/estornos do cálculo
    const activeTransactions = transactionsForTotal.filter(t => !isCancelled(t.note ?? null));

    const income = activeTransactions
      .filter(t => t.direction === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = activeTransactions
      .filter(t => t.direction === 'saida')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions, movementDateRange]);

  const columns: ColumnsType<CashFlowTransaction> = [
    {
      title: t('cashflow.actions'),
      key: 'actions',
      width: 80,
      align: 'center',
      fixed: 'left',
      render: (_, record) => (
        <Button
          type="link"
          icon={<SearchOutlined />}
          onClick={() => navigate(`/movimentacoes/${record.cash_flow_id}`)}
          title={t('common.view')}
        />
      ),
    },
    {
      title: t('cashflow.date'),
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      width: 120,
      render: (date: string, record) => (
        <span style={{ textDecoration: isCancelled(record.note ?? null) ? 'line-through' : 'none' }}>
          {formatDate(date, 'short')}
        </span>
      ),
      sorter: (a, b) => dayjs(a.occurred_at).unix() - dayjs(b.occurred_at).unix(),
    },
    {
      title: t('cashflow.type'),
      dataIndex: 'direction',
      key: 'direction',
      width: 100,
      align: 'center',
      render: (direction: CashFlowDirection, record) => {
        const isIncome = direction === 'entrada';
        return (
          <Tag
            color={isIncome ? 'green' : 'red'}
            icon={isIncome ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            style={{ textDecoration: isCancelled(record.note ?? null) ? 'line-through' : 'none' }}
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
          <Tag
            color={sourceColors[source]}
            style={{ textDecoration: isCancelled(record.note ?? null) ? 'line-through' : 'none' }}
          >
            {sourceLabels[source]}
          </Tag>
        );
      },
    },
    {
      title: t('cashflow.description'),
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
            color: isIncome ? '#52c41a' : '#ff4d4f',
            textDecoration: isCancelled(record.note ?? null) ? 'line-through' : 'none'
          }}>
            {isIncome ? '+' : '-'} {formatCurrency(Math.abs(value))}
          </span>
        );
      },
      sorter: (a, b) => a.amount - b.amount,
    },
  ];

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        helpText={t('dashboard.pageHelp')}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <DashboardOutlined style={{ marginRight: 8 }} />
                {t('dashboard.overviewTab')}
              </span>
            ),
            children: (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 16 }}>
                  <PeriodSelector 
                    onPeriodChange={handlePeriodChange}
                    onGenerateReport={handleGenerateCashFlowPdf}
                    reportLoading={isPdfLoading}
                    reportDisabled={!transactions || transactions.length === 0}
                  />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                  <Space direction="vertical" size="middle" style={{ width: '100%', paddingBottom: 24 }}>
                    <FinancialSummaryCards summary={summary} loading={isLoading} />

                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={14}>
                        <CashFlowChart transactions={transactions} loading={isLoading} />
                      </Col>
                      <Col xs={24} lg={10}>
                        <RecentTransactionsTable transactions={transactions} loading={isLoading} />
                      </Col>
                    </Row>
                  </Space>
                </div>
              </div>
            ),
          },
          {
            key: 'movements',
            label: (
              <span>
                <UnorderedListOutlined style={{ marginRight: 8 }} />
                {t('dashboard.movementsTab')}
              </span>
            ),
            children: (
              <div>
                <Card style={{ marginBottom: 16 }} className={isMobile ? 'mobile-filters-card' : ''}>
                  <Space direction="horizontal" size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
                    <Input
                      placeholder={t('cashflow.searchMovements')}
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ width: isMobile ? '100%' : 300 }}
                      allowClear
                    />

                    <Select
                      placeholder={t('cashflow.typeFilter')}
                      value={directionFilter}
                      onChange={setDirectionFilter}
                      style={{ width: isMobile ? '100%' : 150 }}
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
                      style={{ width: isMobile ? '100%' : 280 }}
                    />

                    <HideCancelledCheckbox
                      checked={hideCancelled}
                      onChange={setHideCancelled}
                    />

                    {(searchText || directionFilter !== 'all' || movementDateRange) && (
                      <Button
                        icon={<FilterOutlined />}
                        onClick={() => {
                          setSearchText('');
                          setDirectionFilter('all');
                          setMovementDateRange(undefined);
                        }}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                      >
                        {t('common.clearFilters')}
                      </Button>
                    )}
                  </Space>
                </Card>

                <Card style={{ marginBottom: 16 }} className={isMobile ? 'mobile-totals-card' : ''}>
                  <Space 
                    size={isMobile ? 'small' : 'large'} 
                    direction={isMobile ? 'vertical' : 'horizontal'}
                    style={{ width: '100%', justifyContent: isMobile ? 'flex-start' : 'space-around' }}
                  >
                    <div style={{ textAlign: isMobile ? 'left' : 'center', width: isMobile ? '100%' : 'auto' }}>
                      <div style={{ 
                        color: '#8c8c8c', 
                        fontSize: isMobile ? 12 : 14, 
                        marginBottom: isMobile ? 2 : 4 
                      }}>
                        {t('cashflow.totalIncome')}
                      </div>
                      <div style={{ 
                        color: '#52c41a', 
                        fontSize: isMobile ? 18 : 24, 
                        fontWeight: 600 
                      }}>
                        {formatCurrency(totals.income)}
                      </div>
                    </div>
                    <div style={{ textAlign: isMobile ? 'left' : 'center', width: isMobile ? '100%' : 'auto' }}>
                      <div style={{ 
                        color: '#8c8c8c', 
                        fontSize: isMobile ? 12 : 14, 
                        marginBottom: isMobile ? 2 : 4 
                      }}>
                        {t('cashflow.totalExpense')}
                      </div>
                      <div style={{ 
                        color: '#ff4d4f', 
                        fontSize: isMobile ? 18 : 24, 
                        fontWeight: 600 
                      }}>
                        {formatCurrency(totals.expense)}
                      </div>
                    </div>
                    <div style={{ textAlign: isMobile ? 'left' : 'center', width: isMobile ? '100%' : 'auto' }}>
                      <div style={{ 
                        color: '#8c8c8c', 
                        fontSize: isMobile ? 12 : 14, 
                        marginBottom: isMobile ? 2 : 4 
                      }}>
                        {t('cashflow.balanceLabel')}
                      </div>
                      <div style={{
                        color: totals.balance >= 0 ? '#52c41a' : '#ff4d4f',
                        fontSize: isMobile ? 18 : 24,
                        fontWeight: 600
                      }}>
                        {formatCurrency(totals.balance)}
                      </div>
                    </div>
                  </Space>
                </Card>

                {isMobile ? (
                  // Versão mobile - Lista compacta
                  <Card className="mobile-movements-list">
                    <List
                      loading={isLoading}
                      dataSource={filteredTransactions}
                      pagination={{
                        pageSize: pageSize,
                        showSizeChanger: true,
                        showTotal: (total) => t('cashflow.totalMovements', { total }),
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: (page, newPageSize) => {
                          if (newPageSize !== pageSize) setPageSize(newPageSize);
                        },
                      }}
                      renderItem={(item: CashFlowTransaction) => {
                        const isIncome = item.direction === 'entrada';
                        const source = getTransactionSource(item);
                        const sourceLabels = {
                          service_order: t('cashflow.sources.service_order'),
                          service_realized: t('cashflow.sources.service_realized'),
                          service_product: t('cashflow.sources.service_product'),
                          purchase_order: t('cashflow.sources.purchase_order'),
                          expense: t('cashflow.sources.expense'),
                          orphan: t('cashflow.sources.orphan'),
                        };

                        return (
                          <List.Item
                            style={{
                              padding: '12px 0',
                              borderBottom: '1px solid #f0f0f0',
                            }}
                            onClick={() => navigate(`/movimentacoes/${item.cash_flow_id}`)}
                          >
                            <div style={{ width: '100%', cursor: 'pointer' }}>
                              {/* Linha 1: Data e Valor */}
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '8px'
                              }}>
                                <span style={{ 
                                  fontSize: '12px', 
                                  color: '#8c8c8c',
                                  textDecoration: isCancelled(item.note ?? null) ? 'line-through' : 'none'
                                }}>
                                  {formatDate(item.occurred_at, 'short')}
                                </span>
                                <span style={{
                                  fontWeight: 'bold',
                                  fontSize: '16px',
                                  color: isIncome ? '#52c41a' : '#ff4d4f',
                                  textDecoration: isCancelled(item.note ?? null) ? 'line-through' : 'none'
                                }}>
                                  {isIncome ? '+' : '-'} {formatCurrency(Math.abs(item.amount))}
                                </span>
                              </div>
                              
                              {/* Linha 2: Tipo e Source */}
                              <div style={{ marginBottom: '6px' }}>
                                <Tag
                                  color={isIncome ? 'green' : 'red'}
                                  icon={isIncome ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                  style={{ 
                                    fontSize: '11px',
                                    marginRight: '8px',
                                    textDecoration: isCancelled(item.note ?? null) ? 'line-through' : 'none'
                                  }}
                                >
                                  {isIncome ? t('cashflow.income') : t('cashflow.expense')}
                                </Tag>
                                <Tag
                                  style={{ 
                                    fontSize: '10px',
                                    textDecoration: isCancelled(item.note ?? null) ? 'line-through' : 'none'
                                  }}
                                >
                                  {sourceLabels[source]}
                                </Tag>
                              </div>
                              
                              {/* Linha 3: Descrição (se existir) */}
                              {item.note && (
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: '#595959',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  textDecoration: isCancelled(item.note) ? 'line-through' : 'none'
                                }}>
                                  {item.note}
                                </div>
                              )}
                              
                              {/* Ícone de visualização */}
                              <div style={{ 
                                marginTop: '8px', 
                                textAlign: 'right',
                                fontSize: '11px',
                                color: '#1890ff'
                              }}>
                                <EyeOutlined /> {t('common.view')}
                              </div>
                            </div>
                          </List.Item>
                        );
                      }}
                    />
                  </Card>
                ) : (
                  // Versão desktop - Tabela
                  <Card>
                    <Table
                      columns={columns}
                      dataSource={filteredTransactions}
                      loading={isLoading}
                      rowKey="cash_flow_id"
                      pagination={{
                        pageSize: pageSize,
                        showSizeChanger: true,
                        showTotal: (total) => t('cashflow.totalMovements', { total }),
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onShowSizeChange: (_, size) => setPageSize(size),
                      }}
                      size="small"
                      scroll={{ x: 1200 }}
                    />
                  </Card>
                )}
              </div>
            ),
          },
        ]}
      />
      
      {/* Floating Action Button Menu */}
      <DashboardFloatingMenu />
    </div>
  );
}
