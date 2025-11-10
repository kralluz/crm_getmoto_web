import {
  Card,
  Descriptions,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
} from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormat } from '../hooks/useFormat';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { PageHeader } from '../components/common/PageHeader';
import { purchaseOrderApi } from '../api/purchase-order-api';
import { useQuery } from '@tanstack/react-query';

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
  const { formatCurrency, formatDate, formatDateTime } = useFormat();

  const { data: purchaseOrder, isLoading } = usePurchaseOrder(id);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!purchaseOrder) {
    return (
      <div>
        <PageHeader
          title={t('purchaseOrder.title')}
          onBack={() => navigate('/dashboard')}
        />
        <Card style={{ marginTop: 16 }}>
          <Alert message={t('purchaseOrder.notFound')} type="error" />
        </Card>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div>
      <PageHeader
        title={t('purchaseOrder.orderDetails')}
        subtitle={`#${purchaseOrder.purchase_order_id}`}
        onBack={handleBack}
      />

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

      {/* Info sobre impacto no estoque */}
      <Alert
        message={t('purchaseOrder.stockImpact')}
        description={t('purchaseOrder.stockImpactDescription')}
        type="info"
        showIcon
      />
    </div>
  );
}
