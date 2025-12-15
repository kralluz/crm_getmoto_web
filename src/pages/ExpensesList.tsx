import { useState, useMemo, useEffect } from 'react';
import { Table, Card, Input, Tag, Space, Select, Button, DatePicker, Dropdown, Row, Col, Tooltip } from 'antd';
import { SearchOutlined, PlusOutlined, FilterOutlined, DownOutlined, EyeOutlined, CalendarOutlined, TagOutlined, ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useAllOutflows } from '../hooks/useExpenses';
import type { UnifiedOutflow } from '../types/expense';
import { PageHeader } from '../components/common/PageHeader';
import { ExpenseModal } from '../components/common/ExpenseModal';
import { PurchaseOrderModal } from '../components/common/PurchaseOrderModal';
import { useFormat } from '../hooks/useFormat';
import dayjs from 'dayjs';
import { useHideCancelled } from '../hooks/useHideCancelled';
import { HideCancelledCheckbox } from '../components/common/HideCancelledCheckbox';
import { FloatingActionButton } from '../components/common/FloatingActionButton';

const { RangePicker } = DatePicker;

export function ExpensesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency, formatDate } = useFormat();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[string, string] | undefined>(undefined);
  const [pageSize, setPageSize] = useState(10);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hook para ocultar cancelamentos
  const { hideCancelled, setHideCancelled } = useHideCancelled('expenses');

  // Buscar TODAS as saídas de dinheiro (unificado)
  const { data: outflows, isLoading } = useAllOutflows({
    startDate: dateRange?.[0],
    endDate: dateRange?.[1],
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  });

  // Buscar TODAS as categorias disponíveis (sem filtros) para popular o dropdown
  const { data: allOutflowsForCategories } = useAllOutflows({});

  // Função para verificar se está cancelado ou é um estorno
  const isCancelled = (outflow: UnifiedOutflow) => {
    // Verifica se está marcado como cancelado
    if (outflow.is_cancelled) return true;
    
    // Verifica se é um estorno (descrição começa com "ESTORNO")
    if (outflow.description?.toUpperCase().startsWith('ESTORNO')) return true;
    
    // Verifica se é um desconto (descrição contém "Desconto aplicado")
    if (outflow.description?.includes('Desconto aplicado')) return true;
    
    return false;
  };

  const filteredOutflows = useMemo(() => {
    if (!Array.isArray(outflows)) return [];

    return outflows.filter(outflow => {
      const matchesSearch = searchText === '' ||
        outflow.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        outflow.category?.toLowerCase().includes(searchText.toLowerCase());

      const matchesCancelled = !hideCancelled || !isCancelled(outflow);

      return matchesSearch && matchesCancelled;
    });
  }, [outflows, searchText, hideCancelled]);

  // Extrair categorias únicas para o filtro - SEMPRE de todos os registros
  const categories = useMemo(() => {
    if (!Array.isArray(allOutflowsForCategories)) return [];
    const uniqueCategories = new Set(
      allOutflowsForCategories
        .map(o => o.category)
        .filter(category => category != null && category !== '')
    );
    return Array.from(uniqueCategories).sort();
  }, [allOutflowsForCategories]);

  const handleView = (outflow: UnifiedOutflow) => {
    // Redirecionar baseado no tipo
    if (outflow.type === 'expense' && outflow.reference_id) {
      navigate(`/despesas/${outflow.reference_id}`);
    } else if (outflow.type === 'purchase_order' && outflow.reference_id) {
      navigate(`/compras/${outflow.reference_id}`);
    }
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

  const handleCloseModal = () => {
    setExpenseModalOpen(false);
  };

  const handleCreateExpense = () => {
    setExpenseModalOpen(true);
  };

  const newExpenseMenuItems = [
    {
      key: 'purchase',
      label: t('cashflow.newPurchase'),
      onClick: () => setPurchaseModalOpen(true),
    },
    {
      key: 'expense',
      label: t('cashflow.newExpense'),
      onClick: () => setExpenseModalOpen(true),
    },
  ];

  const totals = useMemo(() => {
    // Calcula sobre TODOS os outflows (não sobre os filtrados)
    // para que o total não seja afetado pelo filtro de ocultar cancelamentos
    if (!Array.isArray(outflows)) return { total: 0, count: 0 };

    const total = outflows
      .filter(o => !isCancelled(o)) // Exclui cancelados e estornos
      .reduce((sum, o) => sum + Math.abs(o.amount), 0);

    return {
      total,
      count: outflows.filter(o => !isCancelled(o)).length,
    };
  }, [outflows]);

  // Função para obter ícone por tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase_order':
        return <ShoppingCartOutlined />;
      case 'payroll':
        return <DollarOutlined />;
      case 'employee_advance':
        return <DollarOutlined />;
      default:
        return <TagOutlined />;
    }
  };

  // Função para obter cor do tipo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'expense':
        return 'blue';
      case 'purchase_order':
        return 'purple';
      case 'payroll':
        return 'green';
      case 'employee_advance':
        return 'orange';
      default:
        return 'default';
    }
  };

  // Função para obter label do tipo
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'expense':
        return t('expenses.types.expense');
      case 'purchase_order':
        return t('expenses.types.purchase_order');
      case 'payroll':
        return t('expenses.types.payroll');
      case 'employee_advance':
        return t('expenses.types.employee_advance');
      default:
        return t('expenses.types.other');
    }
  };

  const columns: ColumnsType<UnifiedOutflow> = [
    {
      title: t('cashflow.actions'),
      key: 'actions',
      width: 80,
      align: 'center',
      fixed: 'left',
      render: (_, record) => (
        <Tooltip title={t('common.view')}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            disabled={!record.reference_id}
          />
        </Tooltip>
      ),
    },
    {
      title: t('expenses.type'),
      key: 'type',
      width: 150,
      render: (_, record) => (
        <Tag icon={getTypeIcon(record.type)} color={getTypeColor(record.type)}>
          {getTypeLabel(record.type)}
        </Tag>
      ),
    },
    {
      title: t('expenses.date'),
      dataIndex: 'expense_date',
      key: 'expense_date',
      width: 120,
      render: (date: string) => formatDate(date, 'short'),
    },
    {
      title: t('expenses.category'),
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: t('expenses.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('expenses.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (amount: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: t('table.status'),
      key: 'status',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (record.is_cancelled) {
          return <Tag color="red">{t('expenses.cancelled')}</Tag>;
        }
        return <Tag color="green">{t('expenses.active')}</Tag>;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('expenses.title')}
        subtitle={t('expenses.subtitle')}
        helpText={t('expenses.pageHelp')}
        extra={
          <Dropdown menu={{ items: newExpenseMenuItems }} placement="bottomRight">
            <Button type="primary" icon={<PlusOutlined />} size={isMobile ? 'middle' : 'large'}>
              {isMobile ? 'Novo' : t('expenses.newExpense')} <DownOutlined />
            </Button>
          </Dropdown>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={8}>
            <Input
              placeholder={t('expenses.searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={5}>
            <Select
              placeholder={t('expenses.categoryFilter')}
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
            >
              <Select.Option value="all">{t('expenses.allCategories')}</Select.Option>
              {categories.map(category => (
                <Select.Option key={category} value={category}>
                  {category}
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={[t('expenses.startDate'), t('expenses.endDate')]}
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={3}>
            <HideCancelledCheckbox
              checked={hideCancelled}
              onChange={setHideCancelled}
            />
          </Col>

          {(searchText || categoryFilter !== 'all' || dateRange) && (
            <Col xs={24} sm={12} md={8} lg={2}>
              <Button
                block
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchText('');
                  setCategoryFilter('all');
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
          <Col xs={24} sm={12}>
            <div style={{ textAlign: 'center', padding: isMobile ? '8px 0' : '0' }}>
              <div style={{ color: '#8c8c8c', fontSize: isMobile ? 11 : 14, marginBottom: 4 }}>
                {t('expenses.totalExpenses')}
              </div>
              <div style={{ color: '#ff4d4f', fontSize: isMobile ? 16 : 24, fontWeight: 600, wordBreak: 'break-word' }}>
                {formatCurrency(totals.total)}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ textAlign: 'center', padding: isMobile ? '8px 0' : '0' }}>
              <div style={{ color: '#8c8c8c', fontSize: isMobile ? 11 : 14, marginBottom: 4 }}>
                {t('expenses.expensesCount')}
              </div>
              <div style={{ fontSize: isMobile ? 16 : 24, fontWeight: 600 }}>
                {totals.count}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Card>
        {isMobile ? (
          <Row gutter={[16, 16]}>
            {filteredOutflows.map((outflow) => (
              <Col xs={24} key={`${outflow.type}-${outflow.cash_flow_id}`}>
                <Card
                  size="small"
                  actions={[
                    <Tooltip title={t('common.view')} key="view">
                      <EyeOutlined 
                        onClick={() => handleView(outflow)} 
                        style={{ opacity: outflow.reference_id ? 1 : 0.3 }}
                      />
                    </Tooltip>,
                  ]}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag icon={getTypeIcon(outflow.type)} color={getTypeColor(outflow.type)}>
                        {getTypeLabel(outflow.type)}
                      </Tag>
                      {outflow.is_cancelled ? (
                        <Tag color="red">{t('expenses.cancelled')}</Tag>
                      ) : (
                        <Tag color="green">{t('expenses.active')}</Tag>
                      )}
                    </div>
                    
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>
                      {outflow.description}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        {formatDate(outflow.expense_date, 'short')}
                      </span>
                      <span style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 16 }}>
                        {formatCurrency(outflow.amount)}
                      </span>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredOutflows}
            loading={isLoading}
            rowKey={(record) => `${record.type}-${record.cash_flow_id}`}
            pagination={{
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onShowSizeChange: (_, size) => setPageSize(size),
              showTotal: (total) => t('expenses.totalItems', { total }),
            }}
            size="middle"
            scroll={{ x: 1000 }}
          />
        )}
      </Card>

      <ExpenseModal
        open={expenseModalOpen}
        onClose={handleCloseModal}
      />

      <PurchaseOrderModal
        open={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
      />

      {/* Floating Action Button para mobile */}
      <FloatingActionButton
        icon={<PlusOutlined />}
        tooltip={t('expenses.newExpense')}
        onClick={handleCreateExpense}
        mobileOnly
      />
    </div>
  );
}
