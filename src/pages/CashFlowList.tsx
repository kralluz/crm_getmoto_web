import { useState, useMemo } from 'react';
import { Table, Card, Input, Tag, Typography, Space, Select, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { useCashFlowTransactions } from '../hooks/useCashFlow';
import type { CashFlowTransaction } from '../types/cashflow';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export function CashFlowList() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();

  const { data: transactions, isLoading } = useCashFlowTransactions({
    type: selectedType || undefined,
    category: selectedCategory || undefined,
    startDate: dateRange?.[0],
    endDate: dateRange?.[1],
  });

  // Extrair categorias únicas
  const categories = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    const uniqueCategories = new Set(transactions.map(t => t.category).filter(Boolean));
    return Array.from(uniqueCategories) as string[];
  }, [transactions]);

  // Filtrar transações por busca
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];

    return transactions.filter(transaction => {
      const matchesSearch = searchText === '' ||
        transaction.description.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchText.toLowerCase());

      return matchesSearch;
    });
  }, [transactions, searchText]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return dayjs(date).format('DD/MM/YYYY');
  };

  const columns: ColumnsType<CashFlowTransaction> = [
    {
      title: t('table.date'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => formatDate(date),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: t('table.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={type === 'INCOME' ? 'green' : 'red'}>
          {type === 'INCOME' ? t('transaction.typeIncome') : t('transaction.typeExpense')}
        </Tag>
      ),
    },
    {
      title: t('table.category'),
      dataIndex: 'category',
      key: 'category',
      width: 180,
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: t('table.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('table.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (value: number, record) => (
        <span style={{
          color: record.type === 'INCOME' ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {record.type === 'INCOME' ? '+' : '-'} {formatCurrency(value)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>{t('cashflow.title')}</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="horizontal" size="middle" style={{ width: '100%', flexWrap: 'wrap' }}>
          <Input
            placeholder={t('cashflow.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder={t('cashflow.filterByType')}
            value={selectedType || undefined}
            onChange={(value) => setSelectedType(value || '')}
            style={{ width: 150 }}
            allowClear
            options={[
              { value: 'INCOME', label: t('transaction.typeIncome') },
              { value: 'EXPENSE', label: t('transaction.typeExpense') },
            ]}
          />
          <Select
            placeholder={t('cashflow.filterByCategory')}
            value={selectedCategory || undefined}
            onChange={(value) => setSelectedCategory(value || '')}
            style={{ width: 200 }}
            allowClear
            options={[
              { value: '', label: t('cashflow.allCategories') },
              ...categories.map(cat => ({ value: cat, label: cat }))
            ]}
          />
          <RangePicker
            placeholder={[t('common.dateStart'), t('common.dateEnd')]}
            onChange={(dates) => {
              if (dates) {
                setDateRange([
                  dates[0]?.format('YYYY-MM-DD') || '',
                  dates[1]?.format('YYYY-MM-DD') || ''
                ]);
              } else {
                setDateRange(undefined);
              }
            }}
            format="DD/MM/YYYY"
          />
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredTransactions}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} ${t('cashflow.transactions').toLowerCase()}`,
          }}
          size="small"
          scroll={{ x: 1000 }}
          summary={(data) => {
            const totalIncome = data
              .filter(t => t.type === 'INCOME')
              .reduce((sum, t) => sum + t.amount, 0);
            const totalExpense = data
              .filter(t => t.type === 'EXPENSE')
              .reduce((sum, t) => sum + t.amount, 0);
            const balance = totalIncome - totalExpense;

            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4} align="right">
                    <strong>{t('cashflow.summary')}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Space direction="vertical" size={0}>
                      <span style={{ color: '#52c41a' }}>
                        {t('dashboard.income')}: {formatCurrency(totalIncome)}
                      </span>
                      <span style={{ color: '#ff4d4f' }}>
                        {t('dashboard.expense')}: {formatCurrency(totalExpense)}
                      </span>
                      <span style={{
                        color: balance >= 0 ? '#52c41a' : '#ff4d4f',
                        fontWeight: 'bold'
                      }}>
                        {t('cashflow.balance')}: {formatCurrency(balance)}
                      </span>
                    </Space>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>
    </div>
  );
}
