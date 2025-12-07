import { useState } from 'react';
import { Card, Descriptions, Button, Space, Typography, Tabs, Tag, Table, Modal } from 'antd';
import { ArrowLeftOutlined, EditOutlined, StopOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmployee, useDisableEmployee, useEnableEmployee } from '../hooks/useEmployees';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { usePayrollPayments } from '../hooks/usePayrollPayments';
import { formatUKCurrency, penceToPounds } from '../types/employee';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { TimeEntry } from '../types/time-entry';
import type { PayrollPayment } from '../types/payroll-payment';
import { useTranslation } from 'react-i18next';
import { formatHours } from '../utils/format-hours';

const { Title } = Typography;

export function EmployeeDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [timeEntriesPageSize, setTimeEntriesPageSize] = useState(10);
  const [timeEntriesCurrentPage, setTimeEntriesCurrentPage] = useState(1);
  const [paymentsPageSize, setPaymentsPageSize] = useState(10);
  const [paymentsCurrentPage, setPaymentsCurrentPage] = useState(1);

  const { data: employee, isLoading } = useEmployee(id);
  const { data: timeEntries = [] } = useTimeEntries({ employee_id: Number(id) });
  const { data: payments = [] } = usePayrollPayments(Number(id));
  const { mutate: disableEmployee, isPending: isDisabling } = useDisableEmployee();
  const { mutate: enableEmployee, isPending: isEnabling } = useEnableEmployee();

  const handleDisable = () => {
    Modal.confirm({
      title: t('employees.disableEmployee'),
      content: t('employees.confirmDisable'),
      okText: t('employees.disable'),
      okType: 'danger',
      onOk: () => {
        disableEmployee(id!);
      },
    });
  };

  const handleEnable = () => {
    Modal.confirm({
      title: t('employees.enableEmployee'),
      content: t('employees.confirmEnable'),
      okText: t('employees.enable'),
      okType: 'primary',
      onOk: () => {
        enableEmployee(id!);
      },
    });
  };

  if (isLoading || !employee) {
    return <div>{t('common.loading')}</div>;
  }

  const timeEntryColumns: ColumnsType<TimeEntry> = [
    {
      title: t('timeEntries.clockInTime'),
      dataIndex: 'clock_in',
      key: 'clock_in',
      render: (datetime) => dayjs(datetime).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.clock_in).unix() - dayjs(b.clock_in).unix(),
    },
    {
      title: t('timeEntries.clockOutTime'),
      dataIndex: 'clock_out',
      key: 'clock_out',
      render: (datetime) => datetime ? dayjs(datetime).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: t('timeEntries.totalHours'),
      dataIndex: 'total_hours',
      key: 'total_hours',
      render: (hours) => hours ? formatHours(hours) : '-',
    },
    {
      title: t('timeEntries.regularHours'),
      dataIndex: 'regular_hours',
      key: 'regular_hours',
      render: (hours) => hours ? formatHours(hours) : '-',
    },
    {
      title: t('timeEntries.overtimeHours'),
      dataIndex: 'overtime_hours',
      key: 'overtime_hours',
      render: (hours) => hours ? formatHours(hours) : '-',
    },
    {
      title: t('common.notes'),
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
  ];

  const paymentColumns: ColumnsType<PayrollPayment> = [
    {
      title: t('payroll.paymentDate'),
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.payment_date).unix() - dayjs(b.payment_date).unix(),
    },
    {
      title: t('payroll.payPeriod'),
      key: 'period',
      render: (_, record) =>
        `${dayjs(record.period_start).format('DD/MM')} - ${dayjs(record.period_end).format('DD/MM/YYYY')}`,
    },
    {
      title: t('payroll.totalHours'),
      key: 'total_hours',
      render: (_, record) => {
        const totalHours = Number(record.regular_hours) + Number(record.overtime_hours);
        return totalHours > 0 ? formatHours(totalHours) : '-';
      },
    },
    {
      title: t('payroll.grossAmount'),
      dataIndex: 'gross_amount_pence',
      key: 'gross_amount_pence',
      render: (amount) => formatUKCurrency(amount),
    },
    {
      title: t('payroll.deductions'),
      dataIndex: 'deductions_pence',
      key: 'deductions_pence',
      render: (amount) => formatUKCurrency(amount),
    },
    {
      title: t('payroll.netAmount'),
      dataIndex: 'net_amount_pence',
      key: 'net_amount_pence',
      render: (amount) => <strong>{formatUKCurrency(amount)}</strong>,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'PAID' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/employees')} />
              <Title level={3} style={{ margin: 0 }}>
                {employee.first_name} {employee.last_name}
              </Title>
              <Tag color={employee.is_active ? 'green' : 'red'}>
                {employee.is_active ? t('common.active') : t('common.inactive')}
              </Tag>
            </div>
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/employees/${id}/edit`)}
              >
                {t('common.edit')}
              </Button>
              {employee.is_active ? (
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={handleDisable}
                  loading={isDisabling}
                >
                  {t('employees.disable')}
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleEnable}
                  loading={isEnabling}
                >
                  {t('employees.enable')}
                </Button>
              )}
            </Space>
          </div>

          <Descriptions bordered column={2}>
            <Descriptions.Item label={t('employees.employeeId')}>
              {employee.employee_id}
            </Descriptions.Item>
            <Descriptions.Item label={t('employees.jobTitle')}>
              {employee.job_title}
            </Descriptions.Item>
            <Descriptions.Item label={t('employees.email')}>
              {employee.email || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('employees.phone')}>
              {employee.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('employees.nationalInsurance')}>
              {employee.national_insurance || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('employees.hourlyRate')}>
              £{penceToPounds(employee.hourly_rate_pence).toFixed(2)}/hour
            </Descriptions.Item>
            <Descriptions.Item label={t('employees.contractType')}>
              {employee.contract_type}
            </Descriptions.Item>
            <Descriptions.Item label={t('employees.weeklyHours')}>
              {employee.weekly_hours}
            </Descriptions.Item>
            <Descriptions.Item label={t('employees.startDate')}>
              {dayjs(employee.start_date).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label={t('employees.endDate')}>
              {employee.end_date ? dayjs(employee.end_date).format('DD/MM/YYYY') : t('common.active')}
            </Descriptions.Item>
            {employee.address && (
              <Descriptions.Item label={t('employees.address')} span={2}>
                {employee.address}
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Summary Statistics */}
          <Card
            title={t('employees.summary')}
            style={{ background: '#fafafa' }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth >= 768 ? 'repeat(3, 1fr)' : '1fr',
              gap: '16px'
            }}>
              {/* Total Hours Worked */}
              <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>
                  {formatHours(timeEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0))}
                </div>
                <div style={{ fontSize: '14px', color: '#595959' }}>
                  {t('employees.totalHoursWorked')}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                  {t('employees.timeEntriesCount', { count: timeEntries.length })}
                </div>
              </Card>

              {/* Total Payments */}
              <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a', marginBottom: '8px' }}>
                  {formatUKCurrency(
                    payments
                      .filter(p => !p.is_cancelled)
                      .reduce((sum, p) => sum + p.net_amount_pence, 0)
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#595959' }}>
                  {t('employees.totalPaid')}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                  {t('employees.paymentsCount', { count: payments.filter(p => !p.is_cancelled).length })}
                </div>
              </Card>

              {/* Average Pay */}
              <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16', marginBottom: '8px' }}>
                  {payments.filter(p => !p.is_cancelled).length > 0
                    ? formatUKCurrency(
                        Math.round(
                          payments
                            .filter(p => !p.is_cancelled)
                            .reduce((sum, p) => sum + p.net_amount_pence, 0) /
                          payments.filter(p => !p.is_cancelled).length
                        )
                      )
                    : '£0.00'}
                </div>
                <div style={{ fontSize: '14px', color: '#595959' }}>
                  {t('employees.averagePayment')}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                  {t('employees.perPayPeriod')}
                </div>
              </Card>
            </div>
          </Card>

          <Tabs
            defaultActiveKey="timeEntries"
            items={[
              {
                key: 'timeEntries',
                label: `${t('employees.timeEntriesTab')} (${timeEntries.length})`,
                children: (
                  <Table
                    columns={timeEntryColumns}
                    dataSource={timeEntries}
                    rowKey="time_entry_id"
                    pagination={{
                      current: timeEntriesCurrentPage,
                      pageSize: timeEntriesPageSize,
                      showSizeChanger: true,
                      pageSizeOptions: ['5', '10', '20', '50'],
                      onChange: (page, size) => {
                        setTimeEntriesCurrentPage(page);
                        setTimeEntriesPageSize(size);
                      },
                    }}
                  />
                ),
              },
              {
                key: 'payments',
                label: `${t('employees.paymentsTab')} (${payments.length})`,
                children: (
                  <Table
                    columns={paymentColumns}
                    dataSource={payments}
                    rowKey="payment_id"
                    pagination={{
                      current: paymentsCurrentPage,
                      pageSize: paymentsPageSize,
                      showSizeChanger: true,
                      pageSizeOptions: ['5', '10', '20', '50'],
                      onChange: (page, size) => {
                        setPaymentsCurrentPage(page);
                        setPaymentsPageSize(size);
                      },
                    }}
                  />
                ),
              },
            ]}
          />
        </Space>
      </Card>
    </div>
  );
}
