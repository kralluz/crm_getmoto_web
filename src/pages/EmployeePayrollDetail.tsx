import { Card, Typography, Button, Space, Table, Checkbox, Tag, App, message, Modal, Form, DatePicker, InputNumber, Input, Row, Col, theme, Statistic } from 'antd';
import { ArrowLeftOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, PlusOutlined, FieldTimeOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmployee } from '../hooks/useEmployees';
import { useTimeEntries, useCreateTimeEntry } from '../hooks/useTimeEntries';
import { usePaidPeriods, useCreatePayrollPayment } from '../hooks/usePayrollPayments';
import { useState, useMemo } from 'react';
import { formatUKCurrency } from '../types/employee';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { PayrollCalendar } from '../components/payroll/PayrollCalendar';
import type { TimeEntry } from '../types/time-entry';
import type { CreatePayrollPaymentData } from '../types/payroll-payment';
import type { CreateTimeEntryData } from '../types/time-entry';

const { Title, Text } = Typography;

interface GroupedTimeEntry extends TimeEntry {
  isPaid: boolean;
}

export function EmployeePayrollDetail() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isTimeEntryModalOpen, setIsTimeEntryModalOpen] = useState(false);
  const [registerByTime, setRegisterByTime] = useState(true);
  const [form] = Form.useForm();

  const { data: employee } = useEmployee(employeeId ? Number(employeeId) : undefined);
  const { data: timeEntries = [] } = useTimeEntries(
    employeeId ? { employee_id: Number(employeeId) } : undefined
  );
  const { data: paidPeriods = [] } = usePaidPeriods(employeeId ? Number(employeeId) : undefined);
  const createPayment = useCreatePayrollPayment();
  const createTimeEntry = useCreateTimeEntry();

  // Calcular horas de uma entrada
  const calculateHours = (entry: TimeEntry): number => {
    if (entry.total_hours !== null && entry.total_hours !== undefined) {
      return Number(entry.total_hours);
    }
    if (entry.regular_hours !== null && entry.regular_hours !== undefined) {
      const regular = Number(entry.regular_hours);
      const overtime = entry.overtime_hours ? Number(entry.overtime_hours) : 0;
      return regular + overtime;
    }
    if (entry.clock_in && entry.clock_out) {
      const start = dayjs(entry.clock_in);
      const end = dayjs(entry.clock_out);
      const hours = end.diff(start, 'hour', true);
      return hours > 0 ? hours : 0;
    }
    return 0;
  };

  // Agrupar por dia e verificar se foi pago
  const groupedByDay = useMemo(() => {
    console.log('groupedByDay: paidPeriods =', paidPeriods);
    const grouped = new Map<string, GroupedTimeEntry[]>();

    timeEntries.forEach(entry => {
      const date = dayjs(entry.clock_in).format('YYYY-MM-DD');

      // Verificar se está em algum período pago - comparando apenas as datas
      const isPaid = paidPeriods.some(period => {
        const entryDateStr = date; // já está no formato YYYY-MM-DD
        const periodStartStr = dayjs(period.period_start).format('YYYY-MM-DD');
        const periodEndStr = dayjs(period.period_end).format('YYYY-MM-DD');
        console.log(`Checking ${entryDateStr}: ${periodStartStr} <= ${entryDateStr} <= ${periodEndStr} = ${entryDateStr >= periodStartStr && entryDateStr <= periodEndStr}`);
        return entryDateStr >= periodStartStr && entryDateStr <= periodEndStr;
      });

      if (!grouped.has(date)) {
        grouped.set(date, []);
      }

      grouped.get(date)!.push({ ...entry, isPaid });
    });

    return Array.from(grouped.entries())
      .map(([date, entries]) => ({
        date,
        entries,
        totalHours: entries.reduce((sum, e) => sum + calculateHours(e), 0),
        isPaid: entries.every(e => e.isPaid),
      }))
      .sort((a, b) => b.date.localeCompare(a.date)); // Mais recentes primeiro
  }, [timeEntries, paidPeriods]);

  // Dias não pagos
  const unpaidDays = groupedByDay.filter(day => !day.isPaid);

  // Total de horas não pagas
  const totalUnpaidHours = unpaidDays.reduce((sum, day) => sum + day.totalHours, 0);

  // Abrir modal de nova entrada
  const handleOpenTimeEntryModal = () => {
    form.resetFields();
    form.setFieldsValue({
      employee_id: Number(employeeId),
      clock_in: dayjs(),
      work_date: dayjs(),
    });
    setIsTimeEntryModalOpen(true);
  };

  // Submeter nova entrada de tempo
  const handleTimeEntrySubmit = async (values: any) => {
    try {
      let data: CreateTimeEntryData;

      if (registerByTime) {
        // Mode 1: Register by time (clock_in + clock_out)
        if (values.clock_out && values.clock_out.isBefore(values.clock_in)) {
          form.setFields([
            {
              name: 'clock_out',
              errors: [t('timeEntries.validation.clockOutBeforeClockIn')],
            },
          ]);
          return;
        }

        data = {
          employee_id: Number(employeeId),
          clock_in: values.clock_in.toISOString(),
          clock_out: values.clock_out ? values.clock_out.toISOString() : null,
          notes: values.notes || null,
        };
      } else {
        // Mode 2: Register by hours (date + total_hours)
        const dateOnly = values.work_date.startOf('day');
        
        data = {
          employee_id: Number(employeeId),
          clock_in: dateOnly.toISOString(),
          total_hours: values.total_hours,
          notes: values.notes || null,
        };
      }

      await createTimeEntry.mutateAsync(data);
      message.success(t('timeEntries.entryCreatedSuccess'));
      setIsTimeEntryModalOpen(false);
      form.resetFields();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || t('common.error');
      message.error(errorMessage);
    }
  };

  // Selecionar todos os dias não pagos
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDays(unpaidDays.map(day => day.date));
    } else {
      setSelectedDays([]);
    }
  };

  // Pagar dias selecionados
  const handlePaySelected = () => {
    console.log('handlePaySelected called', selectedDays);
    
    if (selectedDays.length === 0) {
      message.warning(t('payroll.selectDaysFirst'));
      return;
    }

    try {
      const selectedEntries = groupedByDay.filter(day => selectedDays.includes(day.date));
      const totalHours = selectedEntries.reduce((sum, day) => sum + day.totalHours, 0);
      
      // Ordenar datas para pegar a primeira e última
      const sortedDates = [...selectedDays].sort();
      const periodStart = sortedDates[0];
      const periodEnd = sortedDates[sortedDates.length - 1];
      const dateRange = `${dayjs(periodStart).format('DD/MM')} - ${dayjs(periodEnd).format('DD/MM/YYYY')}`;

      console.log('Opening modal with data:', { periodStart, periodEnd, totalHours });

      modal.confirm({
        title: t('payroll.confirmPayment'),
        content: (
          <div>
            <p>
              {t('payroll.paymentFor')}: <strong>{employee?.first_name} {employee?.last_name}</strong>
            </p>
            <p>
              {t('payroll.period')}: <strong>{dateRange}</strong>
            </p>
            <p>
              {t('payroll.totalDays')}: <strong>{selectedDays.length}</strong>
            </p>
            <p>
              {t('payroll.totalHours')}: <strong>{totalHours.toFixed(1)}h</strong>
            </p>
            <p>
              {t('payroll.estimatedAmount')}: <strong>{formatUKCurrency((employee?.hourly_rate_pence || 0) * totalHours)}</strong>
            </p>
          </div>
        ),
        okText: t('payroll.confirmPayButton'),
        cancelText: t('common.cancel'),
        onOk: async () => {
          try {
            const paymentData: CreatePayrollPaymentData = {
              employee_id: Number(employeeId),
              period_start: periodStart,
              period_end: periodEnd,
              payment_date: dayjs().format('YYYY-MM-DD'), // Data de hoje como data do pagamento
              regular_hours: totalHours,
              overtime_hours: 0,
              bonuses_pence: 0,
              deductions_pence: 0,
              notes: null,
            };

            await createPayment.mutateAsync(paymentData);
            message.success(t('payroll.paymentCreatedSuccess'));
            setSelectedDays([]);
          } catch (error: any) {
            console.error('Payment error:', error);
            const errorMessage = error?.response?.data?.error || error?.message || t('common.error');
            message.error(errorMessage);
          }
        },
      });

      console.log('modal.confirm called successfully');
    } catch (error) {
      console.error('Error in handlePaySelected:', error);
      message.error('Erro ao abrir modal: ' + error);
    }
  };

  const columns: ColumnsType<typeof groupedByDay[0]> = [
    {
      title: (
        <Checkbox
          checked={selectedDays.length === unpaidDays.length && unpaidDays.length > 0}
          indeterminate={selectedDays.length > 0 && selectedDays.length < unpaidDays.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
          disabled={unpaidDays.length === 0}
        >
          <span className="desktop-only-text">{t('common.selectAll')}</span>
        </Checkbox>
      ),
      key: 'select',
      width: 100,
      align: 'center' as const,
      render: (_, record) => (
        !record.isPaid && (
          <Checkbox
            checked={selectedDays.includes(record.date)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedDays([...selectedDays, record.date]);
              } else {
                setSelectedDays(selectedDays.filter(d => d !== record.date));
              }
            }}
          />
        )
      ),
    },
    {
      title: t('common.date'),
      dataIndex: 'date',
      key: 'date',
      width: 200,
      render: (date) => dayjs(date).format('DD/MM/YYYY (ddd)'),
    },
    {
      title: t('payroll.totalHours'),
      dataIndex: 'totalHours',
      key: 'totalHours',
      width: 120,
      align: 'center' as const,
      render: (hours) => <Tag color="blue">{hours.toFixed(1)}h</Tag>,
    },
    {
      title: t('payroll.estimatedAmount'),
      key: 'amount',
      width: 150,
      align: 'right' as const,
      render: (_, record) => (
        <Text strong>{formatUKCurrency((employee?.hourly_rate_pence || 0) * record.totalHours)}</Text>
      ),
    },
    {
      title: t('common.status'),
      key: 'status',
      width: 120,
      align: 'center' as const,
      render: (_, record) => (
        record.isPaid ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>{t('payroll.paid')}</Tag>
        ) : (
          <Tag color="warning" icon={<ClockCircleOutlined />}>{t('payroll.unpaid')}</Tag>
        )
      ),
    },
  ];

  if (!employee) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '16px' }} className="employee-payroll-container">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header com botão voltar e informações do funcionário */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/payroll-payments')}
                style={{ marginBottom: '8px' }}
              >
                {t('common.back')}
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                {employee.first_name} {employee.last_name}
              </Title>
              <Text type="secondary">{employee.job_title}</Text>
            </div>
            
            <Space>
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={handleOpenTimeEntryModal}
              >
                {t('timeEntries.newEntry')}
              </Button>
              {selectedDays.length > 0 && (
                <Button
                  type="primary"
                  size="large"
                  icon={<DollarOutlined />}
                  onClick={handlePaySelected}
                  style={{ flex: '0 0 auto' }}
                >
                  <span className="desktop-only-text">{t('payroll.paySelected', { count: selectedDays.length })}</span>
                  <span className="mobile-only-text">{t('payroll.pay')} ({selectedDays.length})</span>
                </Button>
              )}
            </Space>
          </div>

          {/* Card de estatísticas */}
          <Card style={{ background: token.colorBgLayout }}>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Statistic
                  title={t('payroll.hourlyRate')}
                  value={(employee.hourly_rate_pence || 0) / 100}
                  precision={2}
                  prefix="£"
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title={t('payroll.totalUnpaidHours')}
                  value={totalUnpaidHours}
                  precision={1}
                  suffix="hrs"
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title={t('payroll.totalUnpaidAmount')}
                  value={(employee.hourly_rate_pence || 0) * totalUnpaidHours / 100}
                  precision={2}
                  prefix="£"
                  valueStyle={{ color: token.colorSuccess }}
                />
              </Col>
            </Row>
          </Card>

          {/* Desktop: Calendário à esquerda, Tabela à direita */}
          <div className="desktop-only-layout" style={{ 
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '16px',
            alignItems: 'start'
          }}>
            {/* Calendário */}
            <PayrollCalendar
              employeeId={Number(employeeId)}
              timeEntries={timeEntries}
              paidPeriods={paidPeriods}
            />

            {/* Tabela de dias trabalhados */}
            <div style={{ width: '100%' }}>
              <Title level={4}>{t('payroll.workDaysDetail')}</Title>
              <Table
                size="small"
                columns={columns}
                dataSource={groupedByDay}
                rowKey="date"
                pagination={{
                  pageSize: 31,
                  showSizeChanger: true,
                  pageSizeOptions: ['15', '31', '62'],
                }}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Mobile: Calendário e Tabela empilhados */}
          <div className="mobile-only-layout">
            {/* Calendário centralizado */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <PayrollCalendar
                employeeId={Number(employeeId)}
                timeEntries={timeEntries}
                paidPeriods={paidPeriods}
              />
            </div>

            {/* Tabela de dias trabalhados */}
            <div>
              <Title level={4}>{t('payroll.workDaysDetail')}</Title>
              <div style={{ overflowX: 'auto' }}>
                <Table
                  size="small"
                  columns={columns}
                  dataSource={groupedByDay}
                  rowKey="date"
                  pagination={{
                    pageSize: 15,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '15', '31'],
                  }}
                />
              </div>
            </div>
          </div>

          <style>{`
            .desktop-only-layout {
              display: none;
            }
            .mobile-only-layout {
              display: none;
            }
            .desktop-only-text {
              display: inline;
            }
            .mobile-only-text {
              display: none;
            }
            
            @media (max-width: 1199px) {
              .desktop-only-layout {
                display: none !important;
              }
              .mobile-only-layout {
                display: block !important;
              }
              .desktop-only-text {
                display: none !important;
              }
              .mobile-only-text {
                display: inline !important;
              }
              .employee-payroll-container {
                padding: 8px !important;
              }
              .ant-card-body {
                padding: 12px !important;
              }
            }
            
            @media (min-width: 1200px) {
              .desktop-only-layout {
                display: grid !important;
              }
              .mobile-only-layout {
                display: none !important;
              }
              .desktop-only-text {
                display: inline !important;
              }
              .mobile-only-text {
                display: none !important;
              }
            }
          `}</style>
        </Space>
      </Card>

      {/* Modal de nova entrada de tempo */}
      <Modal
        title={t('timeEntries.newEntry')}
        open={isTimeEntryModalOpen}
        onCancel={() => {
          setIsTimeEntryModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 0',
          marginBottom: '16px',
          borderBottom: `1px solid ${token.colorBorder}`
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 500,
            color: token.colorTextSecondary
          }}>
            {t('timeEntries.registrationMode')}:
          </span>

          <div
            onClick={() => {
              setRegisterByTime(true);
              form.resetFields(['clock_in', 'clock_out', 'work_date', 'total_hours']);
              form.setFieldsValue({
                employee_id: Number(employeeId),
                clock_in: dayjs(),
              });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: registerByTime ? token.colorPrimary : 'transparent',
              color: registerByTime ? token.colorTextLightSolid : token.colorText,
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontWeight: registerByTime ? 600 : 400,
            }}
          >
            <ClockCircleOutlined />
            <span>{t('timeEntries.byTime')}</span>
          </div>

          <div
            onClick={() => {
              setRegisterByTime(false);
              form.resetFields(['clock_in', 'clock_out', 'work_date', 'total_hours']);
              form.setFieldsValue({
                employee_id: Number(employeeId),
                work_date: dayjs(),
              });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: !registerByTime ? token.colorSuccess : 'transparent',
              color: !registerByTime ? token.colorTextLightSolid : token.colorText,
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontWeight: !registerByTime ? 600 : 400,
            }}
          >
            <FieldTimeOutlined />
            <span>{t('timeEntries.byHours')}</span>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleTimeEntrySubmit}
          initialValues={{
            employee_id: Number(employeeId),
            clock_in: dayjs(),
            work_date: dayjs(),
          }}
        >
          {registerByTime ? (
            // Mode 1: Register by Time
            <>
              <Form.Item
                label={t('timeEntries.clockInTime')}
                name="clock_in"
                rules={[{ required: true, message: t('timeEntries.requiredClockIn') }]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: '100%' }}
                  disabledDate={(current) => {
                    // Bloquear datas futuras
                    if (current.isAfter(dayjs(), 'day')) return true;

                    if (!employee) return false;

                    const startDate = dayjs(employee.start_date).startOf('day');
                    if (current.isBefore(startDate, 'day')) return true;

                    if (employee.end_date) {
                      const endDate = dayjs(employee.end_date).endOf('day');
                      if (current.isAfter(endDate, 'day')) return true;
                    }

                    return false;
                  }}
                />
              </Form.Item>

              <Form.Item
                label={t('timeEntries.clockOutTime')}
                name="clock_out"
                dependencies={['clock_in']}
                rules={[
                  {
                    validator: async (_, value) => {
                      if (!value) return Promise.resolve();
                      const clockIn = form.getFieldValue('clock_in');
                      if (clockIn && value.isBefore(clockIn)) {
                        return Promise.reject(new Error(t('timeEntries.validation.clockOutBeforeClockIn')));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: '100%' }}
                  placeholder={t('timeEntries.clockOutOptional')}
                  disabledDate={(current) => {
                    // Bloquear datas futuras
                    if (current.isAfter(dayjs(), 'day')) return true;

                    if (!employee) return false;

                    const startDate = dayjs(employee.start_date).startOf('day');
                    if (current.isBefore(startDate, 'day')) return true;

                    if (employee.end_date) {
                      const endDate = dayjs(employee.end_date).endOf('day');
                      if (current.isAfter(endDate, 'day')) return true;
                    }

                    return false;
                  }}
                />
              </Form.Item>
            </>
          ) : (
            // Mode 2: Register by Hours
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={t('timeEntries.workDate')}
                    name="work_date"
                    rules={[{ required: true, message: t('timeEntries.requiredWorkDate') }]}
                  >
                    <DatePicker
                      format="DD/MM/YYYY"
                      style={{ width: '100%' }}
                      disabledDate={(current) => {
                        // Bloquear datas futuras
                        if (current.isAfter(dayjs(), 'day')) return true;

                        if (!employee) return false;

                        const startDate = dayjs(employee.start_date).startOf('day');
                        if (current.isBefore(startDate, 'day')) return true;

                        if (employee.end_date) {
                          const endDate = dayjs(employee.end_date).endOf('day');
                          if (current.isAfter(endDate, 'day')) return true;
                        }

                        return false;
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('timeEntries.totalHoursWorked')}
                    name="total_hours"
                    rules={[
                      { required: true, message: t('timeEntries.requiredTotalHours') },
                      { type: 'number', min: 1, max: 24, message: t('timeEntries.validation.hoursRange') },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          if (!Number.isInteger(value)) {
                            return Promise.reject(new Error(t('timeEntries.validation.mustBeWholeHour')));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={24}
                      step={1}
                      precision={0}
                      style={{ width: '100%' }}
                      placeholder="8"
                      addonAfter="hrs"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Form.Item label={t('common.notes')} name="notes">
            <Input.TextArea rows={4} placeholder={t('timeEntries.notesPlaceholder')} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsTimeEntryModalOpen(false);
                form.resetFields();
              }}>
                {t('common.cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createTimeEntry.isPending}
              >
                {t('common.save')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
