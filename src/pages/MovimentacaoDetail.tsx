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
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/movimentacoes')}>
          Voltar
        </Button>
        <Card style={{ marginTop: 16 }}>
          <Alert message="Movimentação não encontrada" type="error" />
        </Card>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/movimentacoes');
  };

  const isIncome = transaction.direction === 'entrada';

  return (
    <div>
      <PageHeader
        title="Detalhes da Movimentação"
        subtitle={`ID: ${transaction.cash_flow_id}`}
        onBack={handleBack}
      />

      {/* Card com estatísticas principais */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Valor"
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
      <Card title="Informações Gerais" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label="ID">
            <Text copyable>{String(transaction.cash_flow_id)}</Text>
          </Descriptions.Item>

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

          <Descriptions.Item label="Data da Movimentação" span={2}>
            {formatDate(transaction.occurred_at)}
          </Descriptions.Item>

          <Descriptions.Item label="Observações" span={2}>
            {transaction.note || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Criado em">
            {formatDateTime(transaction.created_at)}
          </Descriptions.Item>

          <Descriptions.Item label="Atualizado em">
            {formatDateTime(transaction.updated_at)}
          </Descriptions.Item>

          {transaction.service_order_id && (
            <Descriptions.Item label="ID da Ordem de Serviço" span={2}>
              <Text copyable>{String(transaction.service_order_id)}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Ações */}
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          Voltar
        </Button>
      </Space>
    </div>
  );
}
