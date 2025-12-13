import { Table, Button, Space, Card, Typography, AutoComplete, Tag, Modal, Input, Select, Tabs, Tooltip } from 'antd';
import { PlusOutlined, StopOutlined, EyeOutlined, UserOutlined, CalendarOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePayrollPayments, useCancelPayrollPayment, usePaidPeriods } from '../hooks/usePayrollPayments';
import { useEmployees } from '../hooks/useEmployees';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { useState, useMemo } from 'react';
import { formatUKCurrency } from '../types/employee';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { PayrollPayment } from '../types/payroll-payment';
import { useTranslation } from 'react-i18next';
import { formatHours } from '../utils/format-hours';
import { PayrollCalendar } from '../components/payroll/PayrollCalendar';

const { Title, Text } = Typography;

export function PayrollPaymentList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState<number | undefined>();
  const [employeeName, setEmployeeName] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<number | undefined>();
  const [filterYear, setFilterYear] = useState<number>(dayjs().year());
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: employees = [] } = useEmployees(true);
  const { data: payments = [], isLoading } = usePayrollPayments(employeeId);
  const { data: paidPeriods = [] } = usePaidPeriods(employeeId);

  // Buscar time entries com filtros opcionais
  const { data: allTimeEntries = [] } = useTimeEntries(
    employeeId || filterMonth ? {
      employee_id: employeeId,
      start_date: filterMonth ? dayjs().year(filterYear).month(filterMonth).startOf('month').format('YYYY-MM-DD') : undefined,
      end_date: filterMonth ? dayjs().year(filterYear).month(filterMonth).endOf('month').format('YYYY-MM-DD') : undefined,
    } : undefined
  );

  const cancelPayment = useCancelPayrollPayment();

  // Opções do autocomplete
  const employeeOptions = useMemo(() => {
    return employees.map((emp) => ({
      label: `${emp.first_name} ${emp.last_name}`,
      value: `${emp.first_name} ${emp.last_name}`,
      employee_id: emp.employee_id,
    }));
  }, [employees]);

  // Filtrar opções baseado no que o usuário digitou
  const filteredOptions = useMemo(() => {
    if (!employeeName) return employeeOptions;
    return employeeOptions.filter(option =>
      option.label.toLowerCase().includes(employeeName.toLowerCase())
    );
  }, [employeeName, employeeOptions]);

  // Quando selecionar um funcionário do autocomplete
  const handleEmployeeSelect = (value: string) => {
    const selected = employeeOptions.find(opt => opt.value === value);
    if (selected) {
      setEmployeeId(selected.employee_id);
      setEmployeeName(value);
    }
  };

  // Quando digitar o nome
  const handleEmployeeSearch = (value: string) => {
    setEmployeeName(value);
    // Se limpar o campo, limpar o ID também
    if (!value) {
      setEmployeeId(undefined);
    }
  };

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

  const renderEmployeeCard = (stat: any) => {
    return (
      <Card
        key={stat.employee.employee_id}
        style={{ marginBottom: '12px' }}
        size="small"
        actions={[
          <Tooltip title={t('common.view')} key="view">
            <EyeOutlined onClick={() => navigate(`/payroll-payments/employee/${stat.employee.employee_id}`)} />
          </Tooltip>,
        ]}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserOutlined style={{ color: '#1890ff', fontSize: '14px' }} />
              <div>
                <Text strong style={{ fontSize: '14px', display: 'block' }}>
                  {stat.employee.first_name} {stat.employee.last_name}
                </Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {stat.employee.job_title}
                </Text>
              </div>
            </div>
            <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
              {formatUKCurrency(stat.totalPaid)}
            </Text>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: 8, flexWrap: 'wrap' }}>
            <Tag color="blue">{stat.workDays} {t('payroll.calendar.days')}</Tag>
            <Tag color="cyan">{stat.totalHours.toFixed(1)}h</Tag>
            <Tag color="orange">{stat.paymentsCount} {t('payroll.payments').toLowerCase()}</Tag>
          </div>
        </Space>
      </Card>
    );
  };

  const renderPaymentCard = (payment: PayrollPayment) => {
    const employee = employees.find((e) => e.employee_id === payment.employee_id);
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : `ID: ${payment.employee_id}`;

    return (
      <Card
        key={payment.payment_id}
        style={{ marginBottom: '12px' }}
        size="small"
        actions={[
          <Tooltip title={t('common.view')} key="view">
            <EyeOutlined onClick={() => navigate(`/payroll-payments/${payment.payment_id}`)} />
          </Tooltip>,
        ]}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserOutlined style={{ color: '#1890ff', fontSize: '14px' }} />
              <Text strong style={{ fontSize: '14px' }}>{employeeName}</Text>
            </div>
            <Tag color={payment.is_cancelled ? 'red' : 'green'}>
              {payment.is_cancelled ? t('payroll.cancelled') : t('payroll.paid')}
            </Tag>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: 4 }}>
              <CalendarOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {t('payroll.paymentDate')}:
              </Text>
              <Text style={{ fontSize: '12px' }}>{dayjs(payment.payment_date).format('DD/MM/YYYY')}</Text>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: 4 }}>
              <CalendarOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {t('payroll.period')}:
              </Text>
              <Text style={{ fontSize: '12px' }}>
                {dayjs(payment.period_start).format('DD/MM')} - {dayjs(payment.period_end).format('DD/MM/YYYY')}
              </Text>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 8 }}>
              <Tag color="blue">
                {formatHours(payment.regular_hours + payment.overtime_hours)} hrs
              </Tag>
              <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                {formatUKCurrency(payment.net_amount_pence)}
              </Text>
              {payment.deductions_pence > 0 && (
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  ({t('payroll.deducted')}: {formatUKCurrency(payment.deductions_pence)})
                </Text>
              )}
            </div>
          </div>

          {payment.cancellation_reason && (
            <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: 4, padding: '8px', background: '#fff1f0', borderRadius: '4px' }}>
              <strong>{t('payroll.cancellationReason')}:</strong> {payment.cancellation_reason}
            </div>
          )}
        </Space>
      </Card>
    );
  };

  const columns: ColumnsType<PayrollPayment> = [
    {
      title: t('payroll.employee'),
      key: 'employee',
      width: 180,
      fixed: window.innerWidth >= 1200 ? 'left' : undefined,
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
      fixed: window.innerWidth >= 1200 ? 'right' : undefined,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/payroll-payments/${record.payment_id}`)}
        />
      ),
    },
  ];

  // Calcular estatísticas por funcionário
  const employeeStats = useMemo(() => {
    return employees.map(emp => {
      const empId = emp.employee_id;
      const empTimeEntries = allTimeEntries.filter(entry => entry.employee_id === empId);
      const empPayments = payments.filter(p => p.employee_id === empId && !p.is_cancelled);

      // Calcular dias trabalhados
      const workDays = new Set(empTimeEntries.map(e => dayjs(e.clock_in).format('YYYY-MM-DD'))).size;

      // Calcular total de horas
      const totalHours = empTimeEntries.reduce((sum, entry) => {
        const hours = entry.total_hours || 0;
        const regular = entry.regular_hours || 0;
        const overtime = entry.overtime_hours || 0;
        return sum + Number(hours || (regular + overtime));
      }, 0);

      // Calcular total pago
      const totalPaid = empPayments.reduce((sum, p) => sum + p.net_amount_pence, 0);

      return {
        employee: emp,
        workDays,
        totalHours,
        totalPaid,
        paymentsCount: empPayments.length,
      };
    });
  }, [employees, allTimeEntries, payments]);

  // Opções para o select de mês
  const monthOptions = [
    { label: t('months.january'), value: 0 },
    { label: t('months.february'), value: 1 },
    { label: t('months.march'), value: 2 },
    { label: t('months.april'), value: 3 },
    { label: t('months.may'), value: 4 },
    { label: t('months.june'), value: 5 },
    { label: t('months.july'), value: 6 },
    { label: t('months.august'), value: 7 },
    { label: t('months.september'), value: 8 },
    { label: t('months.october'), value: 9 },
    { label: t('months.november'), value: 10 },
    { label: t('months.december'), value: 11 },
  ];

  // Opções para o select de ano (últimos 5 anos + próximo ano)
  const currentYear = dayjs().year();
  const yearOptions = Array.from({ length: 6 }, (_, i) => ({
    label: String(currentYear - 4 + i),
    value: currentYear - 4 + i,
  }));

  return (
    <div style={{ padding: '16px' }} className="payroll-container">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>
            {t('payroll.title')}
          </Title>

          {/* Layout para quando não há funcionário selecionado */}
          {!employeeId && (
            <>
              {/* Desktop: Calendário à esquerda, conteúdo à direita */}
              <div className="desktop-only-grid" style={{ 
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '16px',
                alignItems: 'start'
              }}>
                {/* Calendário à esquerda */}
                <PayrollCalendar
                  employeeId={employeeId}
                  timeEntries={allTimeEntries}
                  paidPeriods={paidPeriods}
                />

                {/* Coluna direita: Estatísticas + Filtros + Histórico de Pagamentos */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* Estatísticas + Filtros lado a lado quando houver espaço */}
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    gap: '16px',
                    alignItems: 'flex-start'
                  }}>
                  {/* Estatísticas compactas */}
                  <div style={{ 
                    flex: '1 1 300px',
                    minWidth: '250px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    padding: '12px',
                    background: '#fafafa',
                    borderRadius: '8px',
                    border: '1px solid #d9d9d9'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                      <div>
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', lineHeight: '1.2' }}>
                          {t('payroll.totalEmployees')}
                        </Text>
                        <Text strong style={{ fontSize: '18px' }}>
                          {employees.length}
                        </Text>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ClockCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                      <div>
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', lineHeight: '1.2' }}>
                          {t('payroll.totalTimeEntries')}
                        </Text>
                        <Text strong style={{ fontSize: '18px' }}>
                          {allTimeEntries.length}
                        </Text>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarOutlined style={{ color: '#faad14', fontSize: '16px' }} />
                      <div>
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', lineHeight: '1.2' }}>
                          {t('payroll.totalPayments')}
                        </Text>
                        <Text strong style={{ fontSize: '18px' }}>
                          {payments.filter(p => !p.is_cancelled).length}
                        </Text>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarOutlined style={{ color: '#722ed1', fontSize: '16px' }} />
                      <div>
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block', lineHeight: '1.2' }}>
                          {t('payroll.totalPaid')}
                        </Text>
                        <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                          {formatUKCurrency(
                            payments
                              .filter(p => !p.is_cancelled)
                              .reduce((sum, p) => sum + p.net_amount_pence, 0)
                          )}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* Filtros */}
                  <div style={{
                    flex: '1 1 250px',
                    minWidth: '220px',
                    padding: '12px',
                    background: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #d9d9d9'
                  }}>
                    <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '12px' }}>
                      {t('common.filter')}
                    </Text>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <AutoComplete
                        value={employeeName}
                        options={filteredOptions}
                        onSelect={handleEmployeeSelect}
                        onSearch={handleEmployeeSearch}
                        placeholder={t('timeEntries.filterByEmployee')}
                        style={{ width: '100%' }}
                        size="small"
                        allowClear
                        onClear={() => {
                          setEmployeeId(undefined);
                          setEmployeeName('');
                        }}
                      />
                      <Space.Compact style={{ width: '100%' }} size="small">
                        <Select
                          placeholder="Selecione o mês"
                          value={filterMonth}
                          onChange={setFilterMonth}
                          options={monthOptions}
                          style={{ width: '60%' }}
                          size="small"
                          allowClear
                        />
                        <Select
                          value={filterYear}
                          onChange={setFilterYear}
                          options={yearOptions}
                          style={{ width: '40%' }}
                          size="small"
                        />
                      </Space.Compact>
                      {(employeeId || filterMonth !== undefined) && (
                        <Button
                          size="small"
                          block
                          onClick={() => {
                            setEmployeeId(undefined);
                            setEmployeeName('');
                            setFilterMonth(undefined);
                          }}
                        >
                          {t('common.clearFilters')}
                        </Button>
                      )}
                    </Space>
                  </div>
                </div>

                  {/* Histórico de Pagamentos logo abaixo dos filtros */}
                  <div style={{ width: '100%' }}>
                    <Title level={5} style={{ marginBottom: '12px' }}>
                      {t('payroll.paymentsHistory')}
                    </Title>
                    {payments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Text type="secondary">{t('payroll.noPayments')}</Text>
                      </div>
                    ) : (
                      <Table
                        size="small"
                        style={{ width: '100%' }}
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
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile: Ordem: Estatísticas -> Calendário -> Filtros */}
              <div className="mobile-only">
                {/* 1. Estatísticas primeiro */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  padding: '12px',
                  background: '#fafafa',
                  borderRadius: '8px',
                  border: '1px solid #d9d9d9',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                    <div>
                      <Text type="secondary" style={{ fontSize: '11px', display: 'block', lineHeight: '1.2' }}>
                        {t('payroll.totalEmployees')}
                      </Text>
                      <Text strong style={{ fontSize: '18px' }}>
                        {employees.length}
                      </Text>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClockCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                    <div>
                      <Text type="secondary" style={{ fontSize: '11px', display: 'block', lineHeight: '1.2' }}>
                        {t('payroll.totalTimeEntries')}
                      </Text>
                      <Text strong style={{ fontSize: '18px' }}>
                        {allTimeEntries.length}
                      </Text>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarOutlined style={{ color: '#faad14', fontSize: '16px' }} />
                    <div>
                      <Text type="secondary" style={{ fontSize: '11px', display: 'block', lineHeight: '1.2' }}>
                        {t('payroll.totalPayments')}
                      </Text>
                      <Text strong style={{ fontSize: '18px' }}>
                        {payments.filter(p => !p.is_cancelled).length}
                      </Text>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarOutlined style={{ color: '#722ed1', fontSize: '16px' }} />
                    <div>
                      <Text type="secondary" style={{ fontSize: '11px', display: 'block', lineHeight: '1.2' }}>
                        {t('payroll.totalPaid')}
                      </Text>
                      <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                        {formatUKCurrency(
                          payments
                            .filter(p => !p.is_cancelled)
                            .reduce((sum, p) => sum + p.net_amount_pence, 0)
                        )}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* 2. Calendário sozinho na linha */}
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                  <PayrollCalendar
                    employeeId={employeeId}
                    timeEntries={allTimeEntries}
                    paidPeriods={paidPeriods}
                  />
                </div>

                {/* 3. Filtros depois */}
                <div style={{
                  padding: '12px',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #d9d9d9',
                  marginBottom: '16px'
                }}>
                  <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '12px' }}>
                    {t('common.filter')}
                  </Text>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <AutoComplete
                      value={employeeName}
                      options={filteredOptions}
                      onSelect={handleEmployeeSelect}
                      onSearch={handleEmployeeSearch}
                      placeholder={t('timeEntries.filterByEmployee')}
                      style={{ width: '100%' }}
                      size="small"
                      allowClear
                      onClear={() => {
                        setEmployeeId(undefined);
                        setEmployeeName('');
                      }}
                    />
                    <Space.Compact style={{ width: '100%' }} size="small">
                      <Select
                        placeholder="Selecione o mês"
                        value={filterMonth}
                        onChange={setFilterMonth}
                        options={monthOptions}
                        style={{ width: '60%' }}
                        size="small"
                        allowClear
                      />
                      <Select
                        value={filterYear}
                        onChange={setFilterYear}
                        options={yearOptions}
                        style={{ width: '40%' }}
                        size="small"
                      />
                    </Space.Compact>
                    {(employeeId || filterMonth !== undefined) && (
                      <Button
                        size="small"
                        block
                        onClick={() => {
                          setEmployeeId(undefined);
                          setEmployeeName('');
                          setFilterMonth(undefined);
                        }}
                      >
                        {t('common.clearFilters')}
                      </Button>
                    )}
                  </Space>
                </div>
              </div>
            </>
          )}

          {/* Panorama Geral - quando nenhum funcionário selecionado */}
          {!employeeId && (
            <>
              {/* Desktop: Lista de Funcionários abaixo de todo o grid */}
              <div className="desktop-only">
                <Title level={4} style={{ marginTop: '24px', marginBottom: '16px' }}>
                  {t('payroll.employeesList')}
                </Title>
                <div style={{ width: '100%' }}>
                  <Table
                    size="small"
                    style={{ width: '100%' }}
                    dataSource={employeeStats}
                    rowKey={(record) => record.employee.employee_id}
                    pagination={false}
                    columns={[
                      {
                        title: t('payroll.employee'),
                        key: 'employee',
                        render: (_, record) => (
                          <div>
                            <Text strong style={{ display: 'block' }}>
                              {record.employee.first_name} {record.employee.last_name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {record.employee.job_title}
                            </Text>
                          </div>
                        ),
                      },
                      {
                        title: t('payroll.workDays'),
                        key: 'workDays',
                        align: 'center' as const,
                        render: (_, record) => (
                          <Tag color="blue">{record.workDays} {t('payroll.calendar.days')}</Tag>
                        ),
                      },
                      {
                        title: t('payroll.totalHours'),
                        key: 'totalHours',
                        align: 'center' as const,
                        render: (_, record) => (
                          <Tag color="cyan">{record.totalHours.toFixed(1)}h</Tag>
                        ),
                      },
                      {
                        title: t('payroll.payments'),
                        key: 'paymentsCount',
                        align: 'center' as const,
                        render: (_, record) => (
                          <Tag color="orange">{record.paymentsCount}</Tag>
                        ),
                      },
                      {
                        title: t('payroll.totalPaid'),
                        key: 'totalPaid',
                        align: 'right' as const,
                        render: (_, record) => (
                          <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                            {formatUKCurrency(record.totalPaid)}
                          </Text>
                        ),
                      },
                      {
                        title: t('common.actions'),
                        key: 'actions',
                        align: 'center' as const,
                        render: (_, record) => (
                          <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => navigate(`/payroll-payments/employee/${record.employee.employee_id}`)}
                          >
                            {t('common.view')}
                          </Button>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>

              {/* Mobile: Mantém as abas */}
              <div className="mobile-only">
                <Tabs
                  defaultActiveKey="payments"
                  style={{ width: '100%' }}
                  items={[
                    {
                      key: 'payments',
                      label: t('payroll.paymentsHistory'),
                      children: (
                        <>
                          {payments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                              <Text type="secondary">{t('payroll.noPayments')}</Text>
                            </div>
                          ) : (
                            <div>
                              {payments.map(renderPaymentCard)}
                            </div>
                          )}
                        </>
                      ),
                    },
                    {
                      key: 'employees',
                      label: t('payroll.employeesList'),
                      children: (
                        <div>
                          {employeeStats.map(renderEmployeeCard)}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </>
          )}

          <style>{`
            .desktop-only-grid {
              display: none;
            }
            .mobile-only {
              display: none;
            }
            
            @media (max-width: 1199px) {
              .desktop-only, .desktop-only-grid {
                display: none !important;
              }
              .mobile-only {
                display: block !important;
              }
              .payroll-container {
                padding: 8px !important;
              }
              .ant-card-body {
                padding: 12px !important;
              }
              .ant-space {
                gap: 12px !important;
              }
            }
            @media (min-width: 1200px) {
              .desktop-only {
                display: block !important;
              }
              .desktop-only-grid {
                display: grid !important;
              }
              .mobile-only {
                display: none !important;
              }
            }
          `}</style>
        </Space>
      </Card>
    </div>
  );
}
