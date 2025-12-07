import { Form, Button, Card, DatePicker, Select, Space, Typography, Descriptions, Alert, Table, Tag, Timeline } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, CalculatorOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCreatePayrollPayment, usePaidPeriods } from '../hooks/usePayrollPayments';
import { useEmployees } from '../hooks/useEmployees';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { useState } from 'react';
import { formatUKCurrency, penceToPounds } from '../types/employee';
import dayjs from 'dayjs';
import type { CreatePayrollPaymentData } from '../types/payroll-payment';
import { useTranslation } from 'react-i18next';
import { formatHours } from '../utils/format-hours';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export function PayrollPaymentForm() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const createPayment = useCreatePayrollPayment();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [calculation, setCalculation] = useState<{
    regularHours: number;
    overtimeHours: number;
    totalHours: number;
    hourlyRate: number;
    grossAmount: number;
    netAmount: number;
  } | null>(null);

  const { data: employees = [] } = useEmployees(true);
  const { data: paidPeriods = [] } = usePaidPeriods(selectedEmployeeId);
  const { data: timeEntries = [] } = useTimeEntries(
    selectedEmployeeId && dateRange
      ? {
          employee_id: selectedEmployeeId,
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        }
      : undefined
  );

  const handleCalculate = () => {
    if (!selectedEmployeeId || !dateRange) {
      return;
    }

    const employee = employees.find((e) => e.employee_id === selectedEmployeeId);
    if (!employee) return;

    // Filter out time entries that are already paid
    const unpaidEntries = timeEntries.filter(entry => !entry.payroll_payment_id);

    // Calculate total hours from UNPAID time entries using total_hours
    // Note: regular_hours and overtime_hours are calculated by backend during payment
    let totalHours = 0;
    for (const entry of unpaidEntries) {
      if (entry.total_hours) {
        totalHours += Number(entry.total_hours);
      }
    }

    // In UK model: first 40 hours/week are regular, rest is overtime
    // For simplicity in frontend calculation, we'll treat all as regular
    // Backend will recalculate properly during payment creation
    const regularHours = totalHours;
    const overtimeHours = 0;

    const hourlyRatePounds = penceToPounds(employee.hourly_rate_pence);
    const grossAmountPounds = totalHours * hourlyRatePounds;
    const grossAmountPence = Math.round(grossAmountPounds * 100);

    const netAmountPence = grossAmountPence; // No deductions

    setCalculation({
      regularHours,
      overtimeHours,
      totalHours,
      hourlyRate: hourlyRatePounds,
      grossAmount: grossAmountPence,
      netAmount: netAmountPence,
    });
  };

  const onFinish = async (values: any) => {
    if (!calculation || !dateRange) return;

    const data: CreatePayrollPaymentData = {
      employee_id: selectedEmployeeId!,
      period_start: dateRange[0].format('YYYY-MM-DD'),
      period_end: dateRange[1].format('YYYY-MM-DD'),
      regular_hours: calculation.regularHours,
      overtime_hours: calculation.overtimeHours,
      bonuses_pence: 0,
      deductions_pence: 0, // No tax deductions for now
      notes: null,
    };

    await createPayment.mutateAsync(data);
    navigate('/payroll-payments');
  };

  const selectedEmployee = employees.find((e) => e.employee_id === selectedEmployeeId);

  return (
    <div style={{ padding: '16px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/payroll-payments')} />
            <Title level={3} style={{ margin: 0 }}>{t('payroll.newPayment')}</Title>
          </div>

          <Alert
            message={t('payroll.howItWorks')}
            description={t('payroll.howItWorksText')}
            type="info"
            showIcon
          />

          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              label={t('payroll.employee')}
              name="employee_id"
              rules={[{ required: true, message: t('payroll.requiredEmployee') }]}
            >
              <Select
                placeholder={t('payroll.employee')}
                showSearch
                optionFilterProp="label"
                onChange={(value) => {
                  setSelectedEmployeeId(value);
                  setCalculation(null);
                }}
                options={employees.map((emp) => ({
                  label: `${emp.first_name} ${emp.last_name} - ${emp.job_title} (${formatUKCurrency(emp.hourly_rate_pence)}/hr)`,
                  value: emp.employee_id,
                }))}
              />
            </Form.Item>

            <Form.Item
              label={t('payroll.payPeriod')}
              name="period"
              rules={[{ required: true, message: t('payroll.requiredPeriod') }]}
            >
              <RangePicker
                style={{ width: '100%' }}
                onChange={(dates) => {
                  setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null);
                  setCalculation(null);
                }}
                disabledDate={(current) => {
                  if (!selectedEmployee) return false;

                  const startDate = dayjs(selectedEmployee.start_date).startOf('day');
                  if (current.isBefore(startDate, 'day')) return true;

                  if (selectedEmployee.end_date) {
                    const endDate = dayjs(selectedEmployee.end_date).endOf('day');
                    if (current.isAfter(endDate, 'day')) return true;
                  }

                  return false;
                }}
              />
            </Form.Item>

            {paidPeriods.length > 0 && selectedEmployeeId && (
              <Alert
                type="info"
                showIcon
                message={t('payroll.paidPeriods')}
                description={
                  <Timeline style={{ marginTop: 12 }}>
                    {paidPeriods.slice(0, 5).map((period) => (
                      <Timeline.Item key={period.payment_id} color="green" dot={<CheckCircleOutlined />}>
                        <Space direction="vertical" size={0}>
                          <Text strong>
                            {dayjs(period.period_start).format('DD/MM/YYYY')} - {dayjs(period.period_end).format('DD/MM/YYYY')}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Pagamento #{period.payment_id} • {formatUKCurrency(period.net_amount_pence)} • {period.regular_hours + period.overtime_hours}h
                          </Text>
                        </Space>
                      </Timeline.Item>
                    ))}
                    {paidPeriods.length > 5 && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ... e mais {paidPeriods.length - 5} período(s)
                      </Text>
                    )}
                  </Timeline>
                }
                style={{ marginBottom: 16 }}
              />
            )}

            {selectedEmployeeId && dateRange && !calculation && (
              <>
                {timeEntries.length > 0 && timeEntries.filter(e => !e.payroll_payment_id).length === 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    message={t('payroll.noUnpaidEntries')}
                    description={t('payroll.noUnpaidEntriesDescription')}
                    style={{ marginBottom: 16 }}
                  />
                )}
                <Button
                  type="dashed"
                  icon={<CalculatorOutlined />}
                  onClick={handleCalculate}
                  block
                  size="large"
                  disabled={timeEntries.filter(e => !e.payroll_payment_id).length === 0}
                >
                  {t('payroll.calculate')}
                </Button>
              </>
            )}

            {calculation && selectedEmployee && (
              <>
                <Card title={t('payroll.paymentCalculation')} style={{ marginTop: 16 }}>
                  <Descriptions 
                    bordered 
                    column={1}
                    size="small"
                  >
                    <Descriptions.Item label={t('payroll.employee')}>
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('payroll.hourlyRate')}>
                      {formatUKCurrency(selectedEmployee.hourly_rate_pence)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('payroll.regularHours')}>
                      <Tag color="blue">{formatHours(calculation.regularHours)} hrs</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('payroll.overtimeHours')}>
                      <Tag color="orange">{formatHours(calculation.overtimeHours)} hrs</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('payroll.totalHours')}>
                      <Tag color="green">{formatHours(calculation.totalHours)} hrs</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('payroll.grossAmount')}>
                      <strong>{formatUKCurrency(calculation.grossAmount)}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('payroll.timeEntriesFound')}>
                      {timeEntries.filter(e => !e.payroll_payment_id).length} {t('common.of')} {timeEntries.length} ({t('payroll.unpaidOnly')})
                    </Descriptions.Item>
                  </Descriptions>

                  <Descriptions 
                    bordered 
                    column={1} 
                    style={{ marginTop: 16 }}
                    size="small"
                  >
                    <Descriptions.Item label={t('payroll.netAmountToPay')}>
                      <strong style={{ fontSize: '18px', color: '#52c41a' }}>
                        {formatUKCurrency(calculation.netAmount)}
                      </strong>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Alert
                  type="info"
                  showIcon
                  message={t('payroll.paymentWillBeRegisteredToday')}
                  description={t('payroll.paymentDateExplanation')}
                  style={{ marginTop: 16 }}
                />

                <Form.Item style={{ marginTop: 24 }}>
                  <Space wrap>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={createPayment.isPending}
                      disabled={calculation.totalHours === 0}
                    >
                      {t('payroll.newPayment')}
                    </Button>
                    <Button onClick={() => navigate('/payroll-payments')}>{t('common.cancel')}</Button>
                  </Space>
                </Form.Item>
              </>
            )}
          </Form>
        </Space>
      </Card>
    </div>
  );
}
