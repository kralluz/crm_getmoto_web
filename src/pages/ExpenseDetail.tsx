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
  Modal,
  Form,
  Input,
} from 'antd';
import { DollarOutlined, EditOutlined, StopOutlined, ExclamationCircleOutlined, FilePdfOutlined } from '@ant-design/icons';
import { generateExpensePDF } from '../utils/reports';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormat } from '../hooks/useFormat';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { PageHeader } from '../components/common/PageHeader';
import { expenseApi } from '../api/expense-api';
import { useQuery } from '@tanstack/react-query';
import { useUpdateExpenseDescription, useCancelExpense } from '../hooks/useExpenses';
import { EditTextModal } from '../components/common/EditTextModal';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';
import { NotificationService } from '../services/notification.service';

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
  const { mutate: cancelExpense, isPending: isCancelling } = useCancelExpense();
  const { user } = useAuthStore();
  const [isEditDescriptionModalOpen, setIsEditDescriptionModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [cancelForm] = Form.useForm();
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

  const handleCancelExpense = () => {
    if (expense?.cancelled_at) {
      NotificationService.warning(t('expenses.alreadyCancelled'));
      return;
    }
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      const values = await cancelForm.validateFields();

      if (!user || !user.id) {
        NotificationService.error(t('common.error'), t('auth.userNotFound'));
        return;
      }

      const cancelledBy = parseInt(user.id, 10);

      if (isNaN(cancelledBy)) {
        NotificationService.error(t('common.error'), 'ID de usuário inválido');
        return;
      }

      if (!id) return;

      cancelExpense(
        {
          id,
          data: {
            cancelled_by: cancelledBy,
            cancellation_reason: values.cancellation_reason,
          },
        },
        {
          onSuccess: () => {
            NotificationService.success(t('expenses.cancelledSuccess'));
            setIsCancelModalOpen(false);
            cancelForm.resetFields();
            setTimeout(() => navigate('/despesas'), 1000);
          },
          onError: (error: any) => {
            NotificationService.error(
              error?.response?.data?.message || t('expenses.cancelError')
            );
          },
        }
      );
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleGeneratePDF = async () => {
    if (!expense) return;

    setIsPdfLoading(true);
    try {
      await generateExpensePDF(
        {
          expense_id: expense.expense_id,
          description: expense.description,
          category: getCategoryLabel(expense.category),
          amount: expense.amount,
          expense_date: expense.expense_date,
          notes: expense.notes,
          created_at: expense.created_at,
          is_active: expense.is_active,
          cancelled_at: expense.cancelled_at,
          cancellation_reason: expense.cancellation_reason,
        },
        {
          title: t('expenses.expenseDetails'),
          expenseNumber: t('expenses.expenseNumber'),
          category: t('expenses.category'),
          description: t('expenses.description'),
          amount: t('expenses.amount'),
          expenseDate: t('expenses.expenseDate'),
          status: t('common.status'),
          active: t('common.active'),
          cancelled: t('expenses.cancelled'),
          notes: t('common.notes'),
          cancelledAt: t('expenses.cancelledAt'),
          cancellationReason: t('expenses.cancellationReason'),
          createdAt: t('common.createdAt'),
          cashImpact: t('expenses.cashImpactDescription'),
          thankYou: t('common.thankYou'),
        }
      );
      NotificationService.success(t('common.pdfGeneratedSuccess'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      NotificationService.error(t('common.error'));
    } finally {
      setIsPdfLoading(false);
    }
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
        <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
          <Button
            icon={<FilePdfOutlined />}
            onClick={handleGeneratePDF}
            loading={isPdfLoading}
            type="primary"
            size="middle"
            block={isMobile}
          >
            {isMobile ? 'PDF' : t('common.generatePdf')}
          </Button>
          {!expense.cancelled_at && (
            <>
              <Button
                danger
                icon={<StopOutlined />}
                onClick={handleCancelExpense}
                size="middle"
                block={isMobile}
                style={{
                  backgroundColor: '#ff4d4f',
                  borderColor: '#ff4d4f',
                  color: 'white'
                }}
              >
                {isMobile ? 'Cancelar' : t('expenses.cancelExpense')}
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={handleEditDescription}
                size="middle"
                block={isMobile}
              >
                {isMobile ? 'Editar' : t('common.editDescription')}
              </Button>
            </>
          )}
        </Space>
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

      {/* Cancellation Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            {t('expenses.confirmCancellation')}
          </Space>
        }
        open={isCancelModalOpen}
        onCancel={() => {
          setIsCancelModalOpen(false);
          cancelForm.resetFields();
        }}
        onOk={handleConfirmCancel}
        confirmLoading={isCancelling}
        okText={t('expenses.confirmCancel')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
        width={600}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            message={t('expenses.cancellationWarning')}
            description={t('expenses.cancellationExplanation')}
            type="warning"
            showIcon
          />

          <Form form={cancelForm} layout="vertical">
            <Form.Item
              name="cancellation_reason"
              label={t('expenses.cancellationReason')}
              rules={[
                { required: true, message: t('expenses.cancellationReasonRequired') },
                { min: 10, message: t('expenses.cancellationReasonMinLength') }
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder={t('expenses.cancellationReasonPlaceholder')}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form>
        </Space>
      </Modal>
    </div>
  );
}
