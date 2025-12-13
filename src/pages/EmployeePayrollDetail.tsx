import { Card, Typography, Button, Space, Table, Checkbox, Tag, App, message } from 'antd';
import { ArrowLeftOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmployee } from '../hooks/useEmployees';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { usePaidPeriods, useCreatePayrollPayment } from '../hooks/usePayrollPayments';
import { useState, useMemo } from 'react';
import { formatUKCurrency } from '../types/employee';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { PayrollCalendar } from '../components/payroll/PayrollCalendar';
import type { TimeEntry } from '../types/time-entry';
import type { CreatePayrollPaymentData } from '../types/payroll-payment';

const { Title, Text } = Typography;

interface GroupedTimeEntry extends TimeEntry {
  isPaid: boolean;
}

export function EmployeePayrollDetail() {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const { data: employee } = useEmployee(employeeId ? Number(employeeId) : undefined);
  const { data: timeEntries = [] } = useTimeEntries(
    employeeId ? { employee_id: Number(employeeId) } : undefined
  );
  const { data: paidPeriods = [] } = usePaidPeriods(employeeId ? Number(employeeId) : undefined);
  const createPayment = useCreatePayrollPayment();

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
          </div>

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
    </div>
  );
}
