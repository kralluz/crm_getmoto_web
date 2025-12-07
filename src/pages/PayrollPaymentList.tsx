import { Table, Button, Space, Card, Typography, Select, Tag, Modal, Input } from 'antd';
import { PlusOutlined, StopOutlined, EyeOutlined, UserOutlined, CalendarOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePayrollPayments, useCancelPayrollPayment } from '../hooks/usePayrollPayments';
import { useEmployees } from '../hooks/useEmployees';
import { useState } from 'react';
import { formatUKCurrency } from '../types/employee';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { PayrollPayment } from '../types/payroll-payment';
import { useTranslation } from 'react-i18next';
import { formatHours } from '../utils/format-hours';

const { Title, Text } = Typography;

export function PayrollPaymentList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState<number | undefined>();
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: employees = [] } = useEmployees(true);
  const { data: payments = [], isLoading } = usePayrollPayments(employeeId);
  const cancelPayment = useCancelPayrollPayment();

  const handleCancel = (id: number, employeeName: string) => {
    let cancellationReason = '';

    const modal = Modal.confirm({
      title: t('payroll.cancelPayment'),
      width: 520,
      content: (
        <div>
          <p>{t('payroll.confirmCancel')}</p>
          <p style={{ marginBottom: 16, fontWeight: 500 }}>
            {employeeName}
          </p>
          <p style={{ color: '#ff4d4f', marginBottom: 16 }}>
            ⚠️ {t('payroll.cancelWarning')}
          </p>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              {t('payroll.cancellationReason')} *
            </label>
            <Input.TextArea
              rows={3}
              onChange={(e) => (cancellationReason = e.target.value)}
              placeholder={t('payroll.reasonPlaceholder')}
              autoFocus
            />
          </div>
        </div>
      ),
      okText: t('payroll.confirmCancelButton'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: async () => {
        if (!cancellationReason.trim()) {
          Modal.error({
            title: t('common.error'),
            content: t('payroll.requiredReason'),
          });
          return Promise.reject();
        }
        await cancelPayment.mutateAsync({
          id,
          data: {
            cancelled_by: 1, // TODO: get from auth store
            cancellation_reason: cancellationReason,
          },
        });
      },
    });
  };

  const renderPaymentCard = (payment: PayrollPayment) => {
    const employee = employees.find((e) => e.employee_id === payment.employee_id);
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : `ID: ${payment.employee_id}`;

    return (
      <Card
        key={payment.payment_id}
        style={{ marginBottom: '16px', cursor: 'pointer' }}
        hoverable
        onClick={() => navigate(`/payroll-payments/${payment.payment_id}`)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <UserOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
          <Text strong style={{ fontSize: '16px', whiteSpace: 'normal', wordBreak: 'normal' }}>
            {employeeName}
          </Text>
          <Tag color={payment.is_cancelled ? 'red' : 'green'}>
            {payment.is_cancelled ? t('payroll.cancelled') : t('payroll.paid')}
          </Tag>
        </div>

        <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: '12px' }}>
          <div>
            <CalendarOutlined style={{ marginRight: '6px', color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('payroll.paymentDate')}:
            </Text>
            <br />
            <Text style={{ marginLeft: '22px' }}>{dayjs(payment.payment_date).format('DD/MM/YYYY')}</Text>
          </div>

          <div>
            <CalendarOutlined style={{ marginRight: '6px', color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('payroll.payPeriod')}:
            </Text>
            <br />
            <Text style={{ marginLeft: '22px' }}>
              {dayjs(payment.period_start).format('DD/MM')} - {dayjs(payment.period_end).format('DD/MM/YYYY')}
            </Text>
          </div>

          <div>
            <ClockCircleOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('payroll.totalHours')}:
            </Text>
            <br />
            <Tag color="blue" style={{ marginLeft: '22px', marginTop: '4px' }}>
              {formatHours(payment.regular_hours + payment.overtime_hours)} hrs
            </Tag>
          </div>

          <div>
            <DollarOutlined style={{ marginRight: '6px', color: '#52c41a' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('payroll.amountPaid')}:
            </Text>
            <br />
            <Text strong style={{ fontSize: '18px', color: '#52c41a', marginLeft: '22px' }}>
              {formatUKCurrency(payment.net_amount_pence)}
            </Text>
            {payment.deductions_pence > 0 && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: '12px', marginLeft: '22px' }}>
                  ({t('payroll.deducted')}: {formatUKCurrency(payment.deductions_pence)})
                </Text>
              </>
            )}
          </div>

          {payment.cancellation_reason && (
            <div style={{ marginTop: '8px', padding: '8px', background: '#fff1f0', borderRadius: '4px' }}>
              <Text type="danger" style={{ fontSize: '12px' }}>
                <strong>{t('payroll.cancellationReason')}:</strong> {payment.cancellation_reason}
              </Text>
            </div>
          )}
        </Space>

        <div 
          style={{ 
            display: 'flex', 
            gap: '8px', 
            paddingTop: '12px', 
            borderTop: '1px solid #f0f0f0',
            justifyContent: 'flex-end'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/payroll-payments/${payment.payment_id}`);
            }}
          >
            {t('payroll.view')}
          </Button>
          {!payment.is_cancelled && (
            <Button
              danger
              size="small"
              icon={<StopOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleCancel(payment.payment_id, employeeName);
              }}
              loading={cancelPayment.isPending}
            >
              {t('payroll.cancel')}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const columns: ColumnsType<PayrollPayment> = [
    {
      title: t('payroll.employee'),
      key: 'employee',
      width: 180,
      fixed: window.innerWidth >= 768 ? 'left' : undefined,
      ellipsis: true,
      render: (_, record) => {
        const employee = employees.find((e) => e.employee_id === record.employee_id);
        return employee ? `${employee.first_name} ${employee.last_name}` : `ID: ${record.employee_id}`;
      },
    },
    {
      title: t('payroll.paymentDate'),
      dataIndex: 'payment_date',
      key: 'payment_date',
      width: 130,
      align: 'center' as const,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('payroll.payPeriod'),
      key: 'period',
      width: 180,
      align: 'center' as const,
      responsive: ['md'] as any,
      render: (_, record) =>
        `${dayjs(record.period_start).format('DD/MM')} - ${dayjs(record.period_end).format('DD/MM/YYYY')}`,
    },
    {
      title: t('payroll.totalHours'),
      key: 'total_hours',
      width: 120,
      align: 'center' as const,
      render: (_, record) => {
        const totalHours = Number(record.regular_hours) + Number(record.overtime_hours);
        return <Tag color="blue">{formatHours(totalHours)} hrs</Tag>;
      },
    },
    {
      title: t('payroll.amountPaid'),
      dataIndex: 'net_amount_pence',
      key: 'net_amount_pence',
      width: 150,
      align: 'right' as const,
      render: (amount, record) => (
        <div>
          <strong style={{ color: '#52c41a', fontSize: '16px' }}>{formatUKCurrency(amount)}</strong>
          {record.deductions_pence > 0 && (
            <div style={{ fontSize: '12px', color: '#999' }}>
              ({t('payroll.deducted')}: {formatUKCurrency(record.deductions_pence)})
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('common.status'),
      key: 'status',
      width: 110,
      align: 'center' as const,
      render: (_, record) => {
        const color = record.is_cancelled ? 'red' : 'green';
        const text = record.is_cancelled ? t('payroll.cancelled') : t('payroll.paid');
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      align: 'center' as const,
      fixed: window.innerWidth >= 768 ? 'right' : undefined,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/payroll-payments/${record.payment_id}`)}
          />
          {!record.is_cancelled && (
            <Button
              type="link"
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => {
                const employee = employees.find((e) => e.employee_id === record.employee_id);
                const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : `ID: ${record.employee_id}`;
                handleCancel(record.payment_id, employeeName);
              }}
              loading={cancelPayment.isPending}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <Title level={3} style={{ margin: 0 }}>{t('payroll.title')}</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/payroll-payments/new')}
            >
              <span style={{ display: 'inline' }}>{t('payroll.newPayment')}</span>
            </Button>
          </div>

          <Select
            placeholder={t('timeEntries.filterByEmployee')}
            allowClear
            style={{ width: '100%', minWidth: '200px' }}
            onChange={(value) => setEmployeeId(value)}
            options={employees.map((emp) => ({
              label: `${emp.first_name} ${emp.last_name}`,
              value: emp.employee_id,
            }))}
          />

          {payments.length === 0 && !isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">{t('payroll.noPayments')}</Text>
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="mobile-only">
                {payments.map(renderPaymentCard)}
                {payments.filter(p => !p.is_cancelled).length > 0 && (
                  <Card style={{ background: '#f0f5ff', marginTop: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ fontSize: '16px' }}>
                        {t('payroll.totalPaid')}
                      </Text>
                      <br />
                      <Text style={{ fontSize: '24px', color: '#52c41a', fontWeight: 'bold' }}>
                        {formatUKCurrency(
                          payments
                            .filter(p => !p.is_cancelled)
                            .reduce((sum, p) => sum + p.net_amount_pence, 0)
                        )}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {t('payroll.paymentsCount', { count: payments.filter(p => !p.is_cancelled).length })}
                      </Text>
                    </div>
                  </Card>
                )}
              </div>

              {/* Desktop: Table */}
              <div className="desktop-only" style={{ overflowX: 'auto' }}>
                <Table
                  columns={columns}
                  dataSource={payments}
                  rowKey="payment_id"
                  loading={isLoading}
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '20', '50'],
                    onChange: (page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    },
                  }}
                  scroll={{ x: 'max-content' }}
                  summary={(data) => {
                    const paidPayments = data.filter((item) => !item.is_cancelled);
                    const totalNet = paidPayments.reduce((sum, item) => sum + item.net_amount_pence, 0);
                    const totalGross = paidPayments.reduce((sum, item) => sum + item.gross_amount_pence, 0);

                    return (
                      <>
                        {paidPayments.length > 0 && (
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4}>
                              <strong>{t('payroll.totalPaid')} ({t('payroll.paymentsCount', { count: paidPayments.length })})</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4}>
                              <strong>{formatUKCurrency(totalGross)}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} />
                            <Table.Summary.Cell index={6}>
                              <strong style={{ color: '#52c41a' }}>{formatUKCurrency(totalNet)}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={7} colSpan={2} />
                          </Table.Summary.Row>
                        )}
                      </>
                    );
                  }}
                />
              </div>
            </>
          )}

          <style>{`
            @media (max-width: 768px) {
              .desktop-only {
                display: none;
              }
              .mobile-only {
                display: block;
              }
            }
            @media (min-width: 769px) {
              .desktop-only {
                display: block;
              }
              .mobile-only {
                display: none;
              }
            }
          `}</style>
        </Space>
      </Card>
    </div>
  );
}
