import {
  Card,
  Descriptions,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Button,
  Space,
} from 'antd';
import { DollarOutlined, EditOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormat } from '../hooks/useFormat';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { PageHeader } from '../components/common/PageHeader';
import { expenseApi } from '../api/expense-api';
import { useQuery } from '@tanstack/react-query';
import { useUpdateExpenseDescription } from '../hooks/useExpenses';
import { EditTextModal } from '../components/common/EditTextModal';
import { useState, useEffect } from 'react';

const { Text } = Typography;

// Hook para buscar despesa por ID
function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => (id ? expenseApi.getById(id) : Promise.reject('No ID')),
    enabled: !!id,
  });
}

export function ExpenseDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency, formatDate, formatDateTime } = useFormat();

  const { data: expense, isLoading } = useExpense(id);
  const { mutate: updateDescription, isPending: isUpdatingDescription } = useUpdateExpenseDescription();
  const [isEditDescriptionModalOpen, setIsEditDescriptionModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!expense) {
    return (
      <div>
        <PageHeader
          title={t('expenses.title')}
          onBack={() => navigate('/despesas')}
        />
        <Card style={{ marginTop: 16 }}>
          <Alert message={t('expenses.expenseNotFound')} type="error" />
        </Card>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/despesas');
  };

  const handleEditDescription = () => {
    setIsEditDescriptionModalOpen(true);
  };

  const handleSaveDescription = async (description: string | null) => {
    if (!id || !description) return Promise.reject('Invalid data');
    return new Promise<void>((resolve, reject) => {
      updateDescription(
        { id, description },
        {
          onSuccess: () => {
            setIsEditDescriptionModalOpen(false);
            resolve();
          },
          onError: (error: any) => {
            reject(error);
          },
        }
      );
    });
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      salary: t('expenses.categories.salary'),
      rent: t('expenses.categories.rent'),
      utilities: t('expenses.categories.utilities'),
      maintenance: t('expenses.categories.maintenance'),
      taxes: t('expenses.categories.taxes'),
      supplies: t('expenses.categories.supplies'),
      other: t('expenses.categories.other'),
    };
    return categoryMap[category] || category;
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? 12 : 0,
        marginBottom: 16
      }}>
        <PageHeader
          title={t('expenses.expenseDetails')}
          subtitle={`#${expense.expense_id}`}
          onBack={handleBack}
        />
        {!expense.cancelled_at && (
          <Button
            icon={<EditOutlined />}
            onClick={handleEditDescription}
            size="middle"
            block={isMobile}
          >
            {isMobile ? 'Editar' : t('common.editDescription')}
          </Button>
        )}
      </div>

      {/* Card com estatísticas principais */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title={t('cashflow.value')}
              value={expense.amount}
              precision={2}
              prefix="£"
              valueStyle={{
                color: '#ff4d4f',
                fontWeight: 600,
              }}
              suffix={
                <Tag color="red" style={{ marginLeft: 8 }}>
                  {t('cashflow.expense')}
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title={t('expenses.expenseDate')}
              value={formatDate(expense.expense_date)}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerta se a despesa foi cancelada */}
      {!expense.is_active && expense.cancelled_at && (
        <Alert
          message={t('expenses.expenseCancelled')}
          description={
            <>
              <Text strong>{t('expenses.cancelledAt')}: </Text>
              {formatDateTime(expense.cancelled_at)}
              {expense.cancellation_reason && (
                <>
                  <br />
                  <Text strong>{t('expenses.cancellationReason')}: </Text>
                  {expense.cancellation_reason}
                </>
              )}
            </>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Card com informações detalhadas */}
      <Card title={t('cashflow.generalInfo')} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label={t('expenses.category')} span={2}>
            <Tag color="orange">{getCategoryLabel(expense.category)}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('expenses.description')} span={2}>
            {expense.description}
          </Descriptions.Item>

          <Descriptions.Item label={t('cashflow.value')}>
            <Text
              strong
              style={{
                color: '#ff4d4f',
                fontSize: 16,
              }}
            >
              {formatCurrency(expense.amount)}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label={t('expenses.expenseDate')}>
            {formatDate(expense.expense_date)}
          </Descriptions.Item>

          <Descriptions.Item label={t('common.createdAt')}>
            {formatDateTime(expense.created_at)}
          </Descriptions.Item>

          <Descriptions.Item label={t('common.updatedAt')}>
            {formatDateTime(expense.updated_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Edit Description Modal */}
      <EditTextModal
        open={isEditDescriptionModalOpen}
        title={t('common.editDescription')}
        label={t('common.description')}
        fieldName="description"
        initialValue={expense?.description}
        onCancel={() => setIsEditDescriptionModalOpen(false)}
        onSave={handleSaveDescription}
        isLoading={isUpdatingDescription}
        required={true}
        minLength={5}
        maxLength={500}
        placeholder={t('expenses.descriptionPlaceholder')}
        multiline={true}
        rows={4}
      />
    </div>
  );
}
