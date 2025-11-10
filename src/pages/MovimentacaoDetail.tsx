import {
  Card,
  Descriptions,
  Tag,
  Typography,
  Space,
  Button,
  Alert,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormat } from '../hooks/useFormat';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { PageHeader } from '../components/common/PageHeader';
import { cashFlowApi } from '../api/cashflow-api';
import { useQuery } from '@tanstack/react-query';
import { getTransactionSource } from '../types/cashflow';

const { Text } = Typography;

// Hook para buscar transação por ID
function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: ['cashflow', 'transaction', id],
    queryFn: () => id ? cashFlowApi.getTransactionById(id) : Promise.reject('No ID'),
    enabled: !!id,
  });
}

export function MovimentacaoDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency, formatDate, formatDateTime } = useFormat();

  const { data: transaction, isLoading } = useTransaction(id);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!transaction) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')}>
          {t('common.back')}
        </Button>
        <Card style={{ marginTop: 16 }}>
          <Alert message={t('cashflow.movementNotFound')} type="error" />
        </Card>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/dashboard');
  };

  const isIncome = transaction.direction === 'entrada';
  const source = getTransactionSource(transaction);

  // Determinar origem e link de navegação
  const getSourceInfo = () => {
    switch (source) {
      case 'service_order':
        return {
          label: t('cashflow.sources.service_order'),
          id: transaction.service_order_id,
          path: `/servicos/${transaction.service_order_id}`,
        };
      case 'purchase_order':
        return {
          label: t('cashflow.sources.purchase_order'),
          id: transaction.purchase_order_id,
          path: `/compras/${transaction.purchase_order_id}`,
        };
      case 'expense':
        return {
          label: t('cashflow.sources.expense'),
          id: transaction.expense_id,
          path: `/despesas/${transaction.expense_id}`,
        };
      case 'service_realized':
        return {
          label: t('cashflow.sources.service_realized'),
          id: transaction.service_realized_id,
          path: `/servicos/${transaction.service_order_id}`, // Vai para a ordem de serviço
        };
      case 'service_product':
        return {
          label: t('cashflow.sources.service_product'),
          id: transaction.service_product_id,
          path: `/servicos/${transaction.service_order_id}`, // Vai para a ordem de serviço
        };
      default:
        return null;
    }
  };

  const sourceInfo = getSourceInfo();

  return (
    <div>
      <PageHeader
        title={t('cashflow.movementDetails')}
        subtitle={`#${transaction.cash_flow_id}`}
        onBack={handleBack}
      />

      {/* Card com estatísticas principais */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('cashflow.value')}
              value={transaction.amount}
              precision={2}
              prefix="£"
              valueStyle={{
                color: isIncome ? '#52c41a' : '#ff4d4f',
                fontWeight: 600
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('cashflow.type')}
              value={isIncome ? t('cashflow.income') : t('cashflow.expense')}
              valueStyle={{ color: isIncome ? '#52c41a' : '#ff4d4f' }}
              prefix={isIncome ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('cashflow.date')}
              value={formatDate(transaction.occurred_at)}
            />
          </Card>
        </Col>
      </Row>

      {/* Card com informações detalhadas */}
      <Card title={t('cashflow.generalInfo')} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label={t('cashflow.type')}>
            <Tag
              color={isIncome ? 'green' : 'red'}
              icon={isIncome ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            >
              {isIncome ? t('cashflow.income') : t('cashflow.expense')}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('cashflow.value')}>
            <Text
              strong
              style={{
                color: isIncome ? '#52c41a' : '#ff4d4f',
                fontSize: 16
              }}
            >
              {isIncome ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label={t('common.status')}>
            <Tag color={transaction.is_active ? 'green' : 'default'}>
              {transaction.is_active ? t('common.active') : t('common.inactive')}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('cashflow.movementDate')}>
            {formatDate(transaction.occurred_at)}
          </Descriptions.Item>

          <Descriptions.Item label={t('cashflow.observations')} span={2}>
            {transaction.note || '-'}
          </Descriptions.Item>

          <Descriptions.Item label={t('common.createdAt')}>
            {formatDateTime(transaction.created_at)}
          </Descriptions.Item>

          <Descriptions.Item label={t('common.updatedAt')}>
            {formatDateTime(transaction.updated_at)}
          </Descriptions.Item>

          {/* Exibir origem da transação com link de navegação */}
          {sourceInfo && (
            <Descriptions.Item label={t('cashflow.source')} span={2}>
              <Space>
                <Tag color="blue">{sourceInfo.label}</Tag>
                <Text strong>#{String(sourceInfo.id)}</Text>
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => navigate(sourceInfo.path)}
                >
                  {t('common.view')} {sourceInfo.label}
                </Button>
              </Space>
            </Descriptions.Item>
          )}

          {/* Alerta se for transação órfã (não deveria existir) */}
          {source === 'orphan' && (
            <Descriptions.Item span={2}>
              <Alert
                message={t('cashflow.orphanWarning')}
                description={t('cashflow.orphanWarningDescription')}
                type="warning"
                showIcon
              />
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
}
