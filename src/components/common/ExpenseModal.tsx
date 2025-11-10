import { Modal, Form, Input, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { NotificationService } from '../../services/notification.service';
import { useCreateExpense } from '../../hooks/useExpenses';
import { CurrencyInput } from './CurrencyInput';
import type { ExpenseCategory } from '../../types/expense';

const { TextArea } = Input;

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

interface ExpenseFormData {
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: dayjs.Dayjs;
}

export function ExpenseModal({ open, onClose }: ExpenseModalProps) {
  const [form] = Form.useForm<ExpenseFormData>();
  const createExpense = useCreateExpense();
  const { t } = useTranslation();

  const EXPENSE_CATEGORIES = [
    { label: t('expense.categories.salary'), value: 'salary' },
    { label: t('expense.categories.rent'), value: 'rent' },
    { label: t('expense.categories.utilities'), value: 'utilities' },
    { label: t('expense.categories.maintenance'), value: 'maintenance' },
    { label: t('expense.categories.taxes'), value: 'taxes' },
    { label: t('expense.categories.supplies'), value: 'supplies' },
    { label: t('expense.categories.other'), value: 'other' },
  ];

  const handleSubmit = async (values: ExpenseFormData) => {
    try {
      await createExpense.mutateAsync({
        category: values.category,
        description: values.description,
        amount: values.amount,
        expense_date: values.expense_date.format('YYYY-MM-DD'),
      });

      NotificationService.success(t('expense.successMessage'));
      form.resetFields();
      form.setFieldValue('expense_date', dayjs());
      onClose();
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      NotificationService.error(t('expense.errorMessage'));
    }
  };

  const handleCancel = () => {
    form.resetFields();
    form.setFieldValue('expense_date', dayjs());
    onClose();
  };

  return (
    <Modal
      title={t('expense.title')}
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={createExpense.isPending}
      okText={t('expense.submit')}
      cancelText={t('common.cancel')}
      width={600}
      destroyOnHidden
    >
      {open && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            expense_date: dayjs(),
          }}
        >
        <Form.Item
          label={t('expense.category')}
          name="category"
          rules={[{ required: true, message: t('expense.categoryRequired') }]}
        >
          <Select
            placeholder={t('expense.categoryPlaceholder')}
            options={EXPENSE_CATEGORIES}
          />
        </Form.Item>

        <Form.Item
          label={t('expense.description')}
          name="description"
          rules={[
            { required: true, message: t('expense.descriptionRequired') },
            { min: 5, message: t('expense.descriptionMinLength') },
          ]}
        >
          <TextArea
            rows={3}
            placeholder={t('expense.descriptionPlaceholder')}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          label={t('expense.amount')}
          name="amount"
          rules={[
            { required: true, message: t('expense.amountRequired') },
            {
              validator: (_, value) =>
                value > 0
                  ? Promise.resolve()
                  : Promise.reject(new Error(t('expense.amountPositive'))),
            },
          ]}
        >
          <CurrencyInput
            style={{ width: '100%' }}
            placeholder={t('expense.amountPlaceholder')}
          />
        </Form.Item>

        <Form.Item
          label={t('expense.expenseDate')}
          name="expense_date"
          rules={[{ required: true, message: t('expense.dateRequired') }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder={t('expense.datePlaceholder')}
          />
        </Form.Item>
      </Form>
      )}
    </Modal>
  );
}
