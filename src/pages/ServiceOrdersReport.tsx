import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Space,
  Button,
  Tag,
  Select
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useServiceOrders } from '../hooks/useServices';
import { useFormat } from '../hooks/useFormat';
import { parseDecimal } from '../utils/format.util';
import { PageHeader } from '../components/common/PageHeader';
import { generateConsolidatedServicesReport } from '../utils/reports/consolidated-services.report';
import type { ServiceOrder, ServiceOrderStatus } from '../types/service-order';

const { RangePicker } = DatePicker;

export function ServiceOrdersReport() {
  const { formatCurrency, formatDate } = useFormat();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [statusFilter, setStatusFilter] = useState<ServiceOrderStatus | undefined>();
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const { data: serviceOrders, isLoading } = useServiceOrders({
    startDate: dateRange[0].toISOString(),
    endDate: dateRange[1].toISOString(),
    status: statusFilter,
  });

  // Cálculos de estatísticas
  const stats = useMemo(() => {
    if (!serviceOrders) return null;

    const total = serviceOrders.length;
    const byStatus = {
      draft: serviceOrders.filter(o => o.status === 'draft').length,
      in_progress: serviceOrders.filter(o => o.status === 'in_progress').length,
      completed: serviceOrders.filter(o => o.status === 'completed').length,
      cancelled: serviceOrders.filter(o => o.status === 'cancelled').length,
    };

    const completedOrders = serviceOrders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => {
      const productsTotal = (order.service_products || []).reduce((pSum, sp) => {
        return pSum + (parseDecimal(sp.product_qtd) * parseDecimal(sp.products.sell_price));
      }, 0);
      const servicesTotal = (order.services_realized || []).reduce((sSum, sr) => {
        return sSum + (parseDecimal(sr.service_qtd) * parseDecimal(sr.service.service_cost));
      }, 0);
      const laborCost = parseDecimal(order.estimated_labor_cost || 0);
      return sum + productsTotal + servicesTotal + laborCost;
    }, 0);

    const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    return {
      total,
      byStatus,
      completedCount: completedOrders.length,
      totalRevenue,
      avgTicket,
    };
  }, [serviceOrders]);

  const handleGeneratePdf = () => {
    if (!serviceOrders) return;

    setIsPdfLoading(true);
    try {
      generateConsolidatedServicesReport({
        serviceOrders,
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const statusLabels: Record<ServiceOrderStatus, string> = {
    draft: 'Rascunho',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada',
  };

  const statusColors: Record<ServiceOrderStatus, string> = {
    draft: 'default',
    in_progress: 'processing',
    completed: 'success',
    cancelled: 'error',
  };

  const columns: ColumnsType<ServiceOrder> = [
    {
      title: 'Data',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Cliente',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (name: string) => name || '-',
      sorter: (a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''),
    },
    {
      title: 'Veículo',
      key: 'vehicle',
      render: (_, record) => {
        if (!record.vehicles) return '-';
        return `${record.vehicles.brand} ${record.vehicles.model}`;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status: ServiceOrderStatus) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      ),
      filters: [
        { text: 'Rascunho', value: 'draft' },
        { text: 'Em Andamento', value: 'in_progress' },
        { text: 'Concluída', value: 'completed' },
        { text: 'Cancelada', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Valor Total',
      key: 'total',
      align: 'right',
      render: (_, record) => {
        const productsTotal = (record.service_products || []).reduce((sum, sp) => {
          return sum + (parseDecimal(sp.product_qtd) * parseDecimal(sp.products.sell_price));
        }, 0);
        const servicesTotal = (record.services_realized || []).reduce((sum, sr) => {
          return sum + (parseDecimal(sr.service_qtd) * parseDecimal(sr.service.service_cost));
        }, 0);
        const laborCost = parseDecimal(record.estimated_labor_cost || 0);
        const total = productsTotal + servicesTotal + laborCost;
        return (
          <span style={{ fontWeight: record.status === 'completed' ? 600 : 400 }}>
            {formatCurrency(total)}
          </span>
        );
      },
      sorter: (a, b) => {
        const calcTotal = (order: ServiceOrder) => {
          const productsTotal = (order.service_products || []).reduce((sum, sp) => {
            return sum + (parseDecimal(sp.product_qtd) * parseDecimal(sp.products.sell_price));
          }, 0);
          const servicesTotal = (order.services_realized || []).reduce((sum, sr) => {
            return sum + (parseDecimal(sr.service_qtd) * parseDecimal(sr.service.service_cost));
          }, 0);
          const laborCost = parseDecimal(order.estimated_labor_cost || 0);
          return productsTotal + servicesTotal + laborCost;
        };
        return calcTotal(a) - calcTotal(b);
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Relatório de Ordens de Serviço"
        subtitle="Análise consolidada de ordens de serviço por período"
        extra={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
            onClick={handleGeneratePdf}
            loading={isPdfLoading}
            disabled={!serviceOrders || serviceOrders.length === 0}
          >
            Gerar PDF
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <div>
            <span style={{ marginRight: 8, fontWeight: 500 }}>Período:</span>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="DD/MM/YYYY"
              presets={[
                { label: 'Hoje', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                { label: 'Esta Semana', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
                { label: 'Este Mês', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
                { label: 'Últimos 30 dias', value: [dayjs().subtract(30, 'days'), dayjs()] },
                { label: 'Últimos 90 dias', value: [dayjs().subtract(90, 'days'), dayjs()] },
              ]}
            />
          </div>
          <div>
            <span style={{ marginRight: 8, fontWeight: 500 }}>Status:</span>
            <Select
              placeholder="Todos os status"
              style={{ width: 180 }}
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'draft', label: 'Rascunho' },
                { value: 'in_progress', label: 'Em Andamento' },
                { value: 'completed', label: 'Concluída' },
                { value: 'cancelled', label: 'Cancelada' },
              ]}
            />
          </div>
        </Space>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total de OS"
              value={stats?.total || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="OS Concluídas"
              value={stats?.completedCount || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Receita Total"
              value={stats?.totalRevenue || 0}
              precision={2}
              prefix="£"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ticket Médio"
              value={stats?.avgTicket || 0}
              precision={2}
              prefix="£"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Rascunho"
                value={stats.byStatus.draft}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Em Andamento"
                value={stats.byStatus.in_progress}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#ff9800' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Concluída"
                value={stats.byStatus.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Cancelada"
                value={stats.byStatus.cancelled}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card title="Ordens de Serviço">
        <Table
          columns={columns}
          dataSource={serviceOrders || []}
          rowKey="service_order_id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} ordem(ns) de serviço`,
          }}
          size="small"
          scroll={{ x: 1200 }}
          locale={{
            emptyText: 'Nenhuma ordem de serviço encontrada no período selecionado',
          }}
        />
      </Card>
    </div>
  );
}
