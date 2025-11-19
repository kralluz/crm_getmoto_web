import { useState, useMemo, useEffect } from 'react';
import { Table, Card, Input, Tag, Space, Select, Button, DatePicker, Dropdown, Row, Col } from 'antd';
import { SearchOutlined, PlusOutlined, FilterOutlined, DownOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useExpenses } from '../hooks/useExpenses';
import type { Expense } from '../types/expense';
import { PageHeader } from '../components/common/PageHeader';
import { ExpenseModal } from '../components/common/ExpenseModal';
import { PurchaseOrderModal } from '../components/common/PurchaseOrderModal';
import { useFormat } from '../hooks/useFormat';
import dayjs from 'dayjs';
import { useHideCancelled } from '../hooks/useHideCancelled';
import { HideCancelledCheckbox } from '../components/common/HideCancelledCheckbox';

const { RangePicker } = DatePicker;

export function ExpensesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency, formatDate } = useFormat();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[string, string] | undefined>(undefined);
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

  const { data: expenses, isLoading } = useExpenses({
    startDate: dateRange?.[0],
    endDate: dateRange?.[1],
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  });

  // Função para verificar se despesa está cancelada
  const isCancelledExpense = (expense: Expense) => {
    return expense.cancelled_at !== null;
  };

  const filteredExpenses = useMemo(() => {
    if (!Array.isArray(expenses)) return [];

    return expenses.filter(expense => {
      const matchesSearch = searchText === '' ||
        expense.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchText.toLowerCase());

      const matchesCancelled = !hideCancelled || !isCancelledExpense(expense);

      return matchesSearch && matchesCancelled;
    });
  }, [expenses, searchText, hideCancelled]);

  // Extrair categorias únicas para o filtro
  const categories = useMemo(() => {
    if (!Array.isArray(expenses)) return [];
    const uniqueCategories = new Set(expenses.map(e => e.category));
    return Array.from(uniqueCategories);
  }, [expenses]);

  const handleView = (id: number) => {
    navigate(`/despesas/${id}`);
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
    if (!Array.isArray(filteredExpenses)) return { total: 0, count: 0 };

    const total = filteredExpenses
      .filter(e => e.is_active)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    return {
      total,
      count: filteredExpenses.filter(e => e.is_active).length,
    };
  }, [filteredExpenses]);

  const columns: ColumnsType<Expense> = [
    {
      title: t('cashflow.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'left',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleView(record.expense_id)}
        >
          {t('common.view')}
        </Button>
      ),
    },
    {
      title: t('expenses.date'),
      dataIndex: 'expense_date',
      key: 'expense_date',
      width: 120,
      sorter: (a, b) => new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime(),
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
      sorter: (a, b) => a.amount - b.amount,
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
        if (record.cancelled_at) {
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
        <Table
          columns={columns}
          dataSource={filteredExpenses}
          loading={isLoading}
          rowKey="expense_id"
          pagination={{
            pageSize: isMobile ? 10 : 20,
            showSizeChanger: !isMobile,
            showTotal: (total) => t('expenses.totalItems', { total }),
            pageSizeOptions: ['10', '20', '50', '100'],
            simple: isMobile,
          }}
          size={isMobile ? 'middle' : 'small'}
          scroll={{ x: 1000 }}
        />
      </Card>

      <ExpenseModal
        open={expenseModalOpen}
        onClose={handleCloseModal}
      />

      <PurchaseOrderModal
        open={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
      />
    </div>
  );
}
