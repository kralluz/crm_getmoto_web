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
  Table,
  Modal,
  Form,
  Input,
  Space,
} from 'antd';
import { ShoppingCartOutlined, EditOutlined, StopOutlined, ExclamationCircleOutlined, FilePdfOutlined } from '@ant-design/icons';
import { generatePurchaseOrderPDF } from '../utils/reports';
import type { ColumnsType } from 'antd/es/table';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormat } from '../hooks/useFormat';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { PageHeader } from '../components/common/PageHeader';
import { purchaseOrderApi } from '../api/purchase-order-api';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useUpdatePurchaseOrderNotes, useCancelPurchaseOrder } from '../hooks/usePurchaseOrders';
import { EditTextModal } from '../components/common/EditTextModal';
import { useAuthStore } from '../store/auth-store';
import { NotificationService } from '../services/notification.service';

const { Text } = Typography;

// Hook para buscar ordem de compra por ID
function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () =>
      id ? purchaseOrderApi.getById(id) : Promise.reject('No ID'),
    enabled: !!id,
  });
}

export function PurchaseOrderDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { formatCurrency, formatDate, formatDateTime } = useFormat();
  const [cameFromSearch, setCameFromSearch] = useState(false);
  const [isEditNotesModalOpen, setIsEditNotesModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [cancelForm] = Form.useForm();

  const { data: purchaseOrder, isLoading } = usePurchaseOrder(id);
  const { mutate: updateNotes, isPending: isUpdatingNotes } = useUpdatePurchaseOrderNotes();
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelPurchaseOrder();
  const { user } = useAuthStore();

  // Detectar se veio da página de busca
  useEffect(() => {
    const fromSearch = location.state?.fromSearch;
    setCameFromSearch(fromSearch);
  }, [location]);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!purchaseOrder) {
    return (
      <div>
        <PageHeader
          title={t('purchaseOrder.title')}
          onBack={() => {
            if (cameFromSearch) {
              navigate(-1);
            } else {
              navigate('/dashboard');
            }
          }}
        />
        <Card style={{ marginTop: 16 }}>
          <Alert message={t('purchaseOrder.notFound')} type="error" />
        </Card>
      </div>
    );
  }

  const handleBack = () => {
    if (cameFromSearch) {
      navigate(-1); // Volta para a página de busca
    } else {
      navigate('/dashboard'); // Volta para o dashboard
    }
  };

  const handleEditNotes = () => {
    setIsEditNotesModalOpen(true);
  };

  const handleSaveNotes = async (notes: string | null) => {
    if (!id) return Promise.reject('No ID');
    return new Promise<void>((resolve, reject) => {
      updateNotes(
        { id, notes },
        {
          onSuccess: () => {
            setIsEditNotesModalOpen(false);
            resolve();
          },
          onError: (error: any) => {
            reject(error);
          },
        }
      );
    });
  };

  const handleCancelOrder = () => {
    if (purchaseOrder?.cancelled_at) {
      NotificationService.warning(t('purchaseOrder.alreadyCancelled'));
      return;
    }
    setIsCancelModalOpen(true);
  };

  const handleGeneratePDF = async () => {
    if (!purchaseOrder) return;

    setIsPdfLoading(true);
    try {
      // Extrair produtos dos stock_moves
      const products = purchaseOrder.stock_moves?.map(move => {
        const match = move.notes?.match(/@\s*R?\$?\s*([\d.,]+)/);
        const unitPrice = match ? parseFloat(match[1].replace(',', '.')) : 0;
        return {
          product_name: move.products.product_name,
          quantity: move.quantity,
          unit_price: unitPrice,
          subtotal: move.quantity * unitPrice,
        };
      }) || [];

      await generatePurchaseOrderPDF(
        {
          purchase_order_id: purchaseOrder.purchase_order_id,
          supplier_name: purchaseOrder.supplier_name,
          purchase_date: purchaseOrder.purchase_date,
          total_amount: purchaseOrder.total_amount,
          notes: purchaseOrder.notes,
          products,
          created_at: purchaseOrder.created_at,
          is_active: purchaseOrder.is_active,
          cancelled_at: purchaseOrder.cancelled_at,
          cancellation_reason: purchaseOrder.cancellation_reason,
        },
        {
          title: t('purchaseOrder.orderDetails'),
          orderNumber: t('purchaseOrder.orderNumber'),
          supplier: t('purchaseOrder.supplier'),
          purchaseDate: t('purchaseOrder.purchaseDate'),
          status: t('common.status'),
          active: t('common.active'),
          cancelled: t('purchaseOrder.cancelled'),
          products: t('purchaseOrder.products'),
          product: t('purchaseOrder.product'),
          quantity: t('purchaseOrder.quantity'),
          unitPrice: t('purchaseOrder.unitPrice'),
          subtotal: t('purchaseOrder.subtotal'),
          total: t('common.total'),
          notes: t('common.notes'),
          cancelledAt: t('purchaseOrder.cancelledAt'),
          cancellationReason: t('purchaseOrder.cancellationReason'),
          createdAt: t('common.createdAt'),
          stockImpact: t('purchaseOrder.stockImpactDescription'),
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

      cancelOrder(
        {
          id,
          data: {
            cancelled_by: cancelledBy,
            cancellation_reason: values.cancellation_reason,
          },
        },
        {
          onSuccess: () => {
            NotificationService.success(t('purchaseOrder.cancelledSuccess'));
            setIsCancelModalOpen(false);
            cancelForm.resetFields();
            setTimeout(() => navigate('/dashboard'), 1000);
          },
          onError: (error: any) => {
            NotificationService.error(
              error?.response?.data?.message || t('purchaseOrder.cancelError')
            );
          },
        }
      );
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <PageHeader
          title={t('purchaseOrder.orderDetails')}
          subtitle={`#${purchaseOrder.purchase_order_id}`}
          onBack={handleBack}
        />
        <Space>
          <Button
            icon={<FilePdfOutlined />}
            onClick={handleGeneratePDF}
            loading={isPdfLoading}
            type="primary"
          >
            {t('common.generatePdf')}
          </Button>
          {!purchaseOrder.cancelled_at && (
            <>
              <Button
                danger
                icon={<StopOutlined />}
                onClick={handleCancelOrder}
                style={{
                  backgroundColor: '#ff4d4f',
                  borderColor: '#ff4d4f',
                  color: 'white'
                }}
              >
                {t('purchaseOrder.cancelOrder')}
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={handleEditNotes}
              >
                {t('common.editNotes')}
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
              title={t('purchaseOrder.totalAmount')}
              value={purchaseOrder.total_amount}
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
              title={t('purchaseOrder.purchaseDate')}
              value={formatDate(purchaseOrder.purchase_date)}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerta se a ordem foi cancelada */}
      {!purchaseOrder.is_active && purchaseOrder.cancelled_at && (
        <Alert
          message={t('purchaseOrder.orderCancelled')}
          description={
            <>
              <Text strong>{t('purchaseOrder.cancelledAt')}: </Text>
              {formatDateTime(purchaseOrder.cancelled_at)}
              {purchaseOrder.cancellation_reason && (
                <>
                  <br />
                  <Text strong>{t('purchaseOrder.cancellationReason')}: </Text>
                  {purchaseOrder.cancellation_reason}
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
          <Descriptions.Item label={t('purchaseOrder.supplier')}>
            <Text strong>{purchaseOrder.supplier_name}</Text>
          </Descriptions.Item>

          <Descriptions.Item label={t('common.status')}>
            <Tag color={purchaseOrder.is_active ? 'green' : 'default'}>
              {purchaseOrder.is_active
                ? t('common.active')
                : t('common.inactive')}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('purchaseOrder.totalAmount')}>
            <Text
              strong
              style={{
                color: '#ff4d4f',
                fontSize: 16,
              }}
            >
              {formatCurrency(purchaseOrder.total_amount)}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label={t('purchaseOrder.purchaseDate')}>
            {formatDate(purchaseOrder.purchase_date)}
          </Descriptions.Item>

          {purchaseOrder.notes && (
            <Descriptions.Item label={t('cashflow.observations')} span={2}>
              {purchaseOrder.notes}
            </Descriptions.Item>
          )}

          <Descriptions.Item label={t('common.createdAt')}>
            {formatDateTime(purchaseOrder.created_at)}
          </Descriptions.Item>

          <Descriptions.Item label={t('common.updatedAt')}>
            {formatDateTime(purchaseOrder.updated_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Tabela de Produtos */}
      {purchaseOrder.stock_moves && purchaseOrder.stock_moves.length > 0 && (
        <Card title={t('purchaseOrder.products')} style={{ marginBottom: 16 }}>
          <Table
            columns={[
              {
                title: t('purchaseOrder.product'),
                dataIndex: ['products', 'product_name'],
                key: 'product',
              },
              {
                title: t('purchaseOrder.quantity'),
                dataIndex: 'quantity',
                key: 'quantity',
                align: 'center',
                render: (qty: number) => (
                  <Text strong style={{ color: '#52c41a' }}>
                    +{qty}
                  </Text>
                ),
              },
              {
                title: t('purchaseOrder.unitPrice'),
                key: 'unit_price',
                align: 'right',
                render: (_, record) => {
                  // Extrair preço unitário das notas (formato: "Compra de X - 10x @ R$ 50.00")
                  const match = record.notes?.match(/@\s*R?\$?\s*([\d.,]+)/);
                  const unitPrice = match ? parseFloat(match[1].replace(',', '.')) : 0;
                  return formatCurrency(unitPrice);
                },
              },
              {
                title: t('common.total'),
                key: 'subtotal',
                align: 'right',
                render: (_, record) => {
                  const match = record.notes?.match(/@\s*R?\$?\s*([\d.,]+)/);
                  const unitPrice = match ? parseFloat(match[1].replace(',', '.')) : 0;
                  const subtotal = record.quantity * unitPrice;
                  return (
                    <Text strong style={{ color: '#ff4d4f' }}>
                      {formatCurrency(subtotal)}
                    </Text>
                  );
                },
              },
            ] as ColumnsType<any>}
            dataSource={purchaseOrder.stock_moves}
            rowKey="stock_move_id"
            pagination={false}
            size="middle"
            summary={(pageData) => {
              let totalQuantity = 0;
              let totalAmount = 0;

              pageData.forEach((record) => {
                totalQuantity += record.quantity;
                const match = record.notes?.match(/@\s*R?\$?\s*([\d.,]+)/);
                const unitPrice = match ? parseFloat(match[1].replace(',', '.')) : 0;
                totalAmount += record.quantity * unitPrice;
              });

              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <Text strong>{t('common.total')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      <Text strong style={{ color: '#52c41a' }}>
                        +{totalQuantity}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                    <Table.Summary.Cell index={3} align="right">
                      <Text strong style={{ fontSize: 16, color: '#ff4d4f' }}>
                        {formatCurrency(totalAmount)}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </Card>
      )}

      {/* Info sobre impacto no estoque */}
      <Alert
        message={t('purchaseOrder.stockImpact')}
        description={t('purchaseOrder.stockImpactDescription')}
        type="info"
        showIcon
      />

      {/* Edit Notes Modal */}
      <EditTextModal
        open={isEditNotesModalOpen}
        title={t('common.editNotes')}
        label={t('common.notes')}
        fieldName="notes"
        initialValue={purchaseOrder?.notes}
        onCancel={() => setIsEditNotesModalOpen(false)}
        onSave={handleSaveNotes}
        isLoading={isUpdatingNotes}
        required={false}
        maxLength={500}
        placeholder={t('purchaseOrder.notesPlaceholder')}
        multiline={true}
        rows={4}
      />

      {/* Cancellation Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            {t('purchaseOrder.confirmCancellation')}
          </Space>
        }
        open={isCancelModalOpen}
        onCancel={() => {
          setIsCancelModalOpen(false);
          cancelForm.resetFields();
        }}
        onOk={handleConfirmCancel}
        confirmLoading={isCancelling}
        okText={t('purchaseOrder.confirmCancel')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
        width={600}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            message={t('purchaseOrder.cancellationWarning')}
            description={t('purchaseOrder.cancellationExplanation')}
            type="warning"
            showIcon
          />

          <Form form={cancelForm} layout="vertical">
            <Form.Item
              name="cancellation_reason"
              label={t('purchaseOrder.cancellationReason')}
              rules={[
                { required: true, message: t('purchaseOrder.cancellationReasonRequired') },
                { min: 10, message: t('purchaseOrder.cancellationReasonMinLength') }
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder={t('purchaseOrder.cancellationReasonPlaceholder')}
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
