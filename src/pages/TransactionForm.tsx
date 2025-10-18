import { useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  DatePicker,
  Button,
  Card,
  Typography,
  message,
  Space,
} from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useCreateTransaction } from '../hooks/useCashFlow';
import { useAuthStore } from '../store/auth-store';
import type { TransactionType } from '../types/cashflow';

const { Title } = Typography;
const { TextArea } = Input;

interface TransactionFormData {
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: dayjs.Dayjs;
  notes?: string;
}

export function TransactionForm() {
  const [form] = Form.useForm<TransactionFormData>();
  const [transactionType, setTransactionType] =
    useState<TransactionType>('INCOME');
  const createTransaction = useCreateTransaction();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const INCOME_CATEGORIES = [
    { label: t('transaction.categories.income.maintenance'), value: 'Serviço de Manutenção' },
    { label: t('transaction.categories.income.productSale'), value: 'Venda de Produto' },
    { label: t('transaction.categories.income.partSale'), value: 'Venda de Peça' },
    { label: t('transaction.categories.income.externalService'), value: 'Serviço Externo' },
    { label: t('transaction.categories.income.others'), value: 'Outros' },
  ];

  const EXPENSE_CATEGORIES = [
    { label: t('transaction.categories.expense.stockPurchase'), value: 'Compra de Estoque' },
    { label: t('transaction.categories.expense.partsPurchase'), value: 'Compra de Peças' },
    { label: t('transaction.categories.expense.salaries'), value: 'Salários' },
    { label: t('transaction.categories.expense.rent'), value: 'Aluguel' },
    { label: t('transaction.categories.expense.electricity'), value: 'Energia Elétrica' },
    { label: t('transaction.categories.expense.water'), value: 'Água' },
    { label: t('transaction.categories.expense.internet'), value: 'Internet' },
    { label: t('transaction.categories.expense.phone'), value: 'Telefone' },
    { label: t('transaction.categories.expense.maintenance'), value: 'Manutenção' },
    { label: t('transaction.categories.expense.taxes'), value: 'Impostos' },
    { label: t('transaction.categories.expense.others'), value: 'Outros' },
  ];

  const categories =
    transactionType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (value: TransactionType) => {
    setTransactionType(value);
    // Limpar categoria ao mudar o tipo
    form.setFieldValue('category', undefined);
  };

  const handleSubmit = async (values: TransactionFormData) => {
    if (!user?.id) {
      message.error(t('transaction.errorMessage'));
      return;
    }

    try {
      await createTransaction.mutateAsync({
        userId: user.id,
        type: values.type,
        category: values.category,
        amount: values.amount,
        description: values.description,
        date: values.date.format('YYYY-MM-DD'),
      });

      message.success(t('transaction.successMessage'));
      form.resetFields();
      form.setFieldValue('date', dayjs());
    } catch (error) {
      message.error(t('transaction.errorMessage'));
      console.error('Error creating transaction:', error);
    }
  };

  return (
    <div>
      <Title level={2}>{t('transaction.title')}</Title>

      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'INCOME',
            date: dayjs(),
          }}
        >
          <Form.Item
            label={t('transaction.type')}
            name="type"
            rules={[{ required: true, message: t('transaction.type') }]}
          >
            <Radio.Group onChange={(e) => handleTypeChange(e.target.value)}>
              <Radio.Button value="INCOME">{t('transaction.typeIncome')}</Radio.Button>
              <Radio.Button value="EXPENSE">{t('transaction.typeExpense')}</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label={t('transaction.category')}
            name="category"
            rules={[{ required: true, message: t('transaction.categoryPlaceholder') }]}
          >
            <Select
              placeholder={t('transaction.categoryPlaceholder')}
              showSearch
              options={categories}
            />
          </Form.Item>

          <Form.Item
            label={t('transaction.amount')}
            name="amount"
            rules={[
              { required: true, message: t('transaction.amountPlaceholder') },
              { type: 'number', min: 0.01, message: t('transaction.amountPlaceholder') },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="R$"
              precision={2}
              min={0}
              placeholder={t('transaction.amountPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            label={t('transaction.description')}
            name="description"
            rules={[
              { required: true, message: t('transaction.descriptionPlaceholder') },
              { min: 5, message: t('transaction.descriptionPlaceholder') },
            ]}
          >
            <TextArea
              rows={3}
              placeholder={t('transaction.descriptionPlaceholder')}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label={t('transaction.date')}
            name="date"
            rules={[{ required: true, message: t('transaction.date') }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={t('transaction.date')}
            />
          </Form.Item>

          <Form.Item label={t('transaction.description')} name="notes">
            <TextArea
              rows={2}
              placeholder={t('transaction.descriptionPlaceholder')}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createTransaction.isPending}
                size="large"
              >
                {createTransaction.isPending ? t('transaction.creating') : t('transaction.submit')}
              </Button>
              <Button onClick={() => form.resetFields()} size="large">
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
