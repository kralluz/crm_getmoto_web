import { Calendar, Badge, Typography, Tag, theme, DatePicker } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { TimeEntry } from '../../types/time-entry';
import type { PaidPeriod } from '../../types/payroll-payment';

const { Text } = Typography;

interface PayrollCalendarProps {
  employeeId?: number;
  timeEntries: TimeEntry[];
  paidPeriods: PaidPeriod[];
}

export function PayrollCalendar({ employeeId, timeEntries, paidPeriods }: PayrollCalendarProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  // Função para calcular horas trabalhadas de uma entrada
  const calculateHours = (entry: TimeEntry): number => {
    // Prioridade 1: usar total_hours se disponível
    if (entry.total_hours !== null && entry.total_hours !== undefined) {
      return Number(entry.total_hours);
    }

    // Prioridade 2: usar regular_hours + overtime_hours
    if (entry.regular_hours !== null && entry.regular_hours !== undefined) {
      const regular = Number(entry.regular_hours);
      const overtime = entry.overtime_hours ? Number(entry.overtime_hours) : 0;
      return regular + overtime;
    }

    // Prioridade 3: calcular a partir de clock_in e clock_out
    if (entry.clock_in && entry.clock_out) {
      const start = dayjs(entry.clock_in);
      const end = dayjs(entry.clock_out);
      const hours = end.diff(start, 'hour', true);
      return hours > 0 ? hours : 0;
    }

    return 0;
  };

  // Função para verificar se uma data está em um período pago
  const isDatePaid = (date: Dayjs): boolean => {
    return paidPeriods.some(period => {
      const periodStart = dayjs(period.period_start).startOf('day');
      const periodEnd = dayjs(period.period_end).endOf('day');
      return date.isSameOrAfter(periodStart) && date.isSameOrBefore(periodEnd);
    });
  };

  // Função para obter entradas de tempo de um dia específico
  const getTimeEntriesForDate = (date: Dayjs): TimeEntry[] => {
    const dateStr = date.format('YYYY-MM-DD');
    return timeEntries.filter(entry => {
      const entryDate = dayjs(entry.clock_in).format('YYYY-MM-DD');
      return entryDate === dateStr;
    });
  };

  // Função para calcular total de horas de um dia
  const getTotalHoursForDate = (date: Dayjs): number => {
    const entries = getTimeEntriesForDate(date);
    return entries.reduce((total, entry) => total + calculateHours(entry), 0);
  };

  // Renderiza o conteúdo de cada célula do calendário
  const dateCellRender = (date: Dayjs) => {
    const entries = getTimeEntriesForDate(date);

    if (entries.length === 0) {
      return null;
    }

    const isPaid = isDatePaid(date);

    return (
      <div style={{ padding: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {isPaid ? (
          <CheckCircleOutlined style={{ fontSize: '16px', color: token.colorSuccess }} />
        ) : (
          <ClockCircleOutlined style={{ fontSize: '16px', color: token.colorWarning }} />
        )}
      </div>
    );
  };

  // Renderiza o header do calendário com estatísticas
  const headerRender = ({ value, onChange }: { value: Dayjs; onChange: (date: Dayjs) => void }) => {
    const currentMonth = value.month();
    const currentYear = value.year();

    // Filtrar entradas do mês atual
    const monthEntries = timeEntries.filter(entry => {
      const entryDate = dayjs(entry.clock_in);
      return entryDate.month() === currentMonth && entryDate.year() === currentYear;
    });

    // Calcular horas pagas e não pagas
    const paidEntries = monthEntries.filter(entry => {
      const entryDate = dayjs(entry.clock_in);
      return isDatePaid(entryDate);
    });

    const unpaidEntries = monthEntries.filter(entry => {
      const entryDate = dayjs(entry.clock_in);
      return !isDatePaid(entryDate);
    });

    const totalPaidHours = paidEntries.reduce((sum, entry) => sum + calculateHours(entry), 0);
    const totalUnpaidHours = unpaidEntries.reduce((sum, entry) => sum + calculateHours(entry), 0);

    return (
      <div style={{ marginBottom: '16px' }}>
        {/* Navegação de mês/ano */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          padding: '8px',
          background: token.colorBgContainer,
          borderRadius: token.borderRadius,
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <Text strong style={{ fontSize: '16px', color: token.colorText }}>
            {value.format('MMMM YYYY')}
          </Text>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <DatePicker
              value={value}
              onChange={(date) => date && onChange(date)}
              picker="month"
              format="MMMM YYYY"
              style={{ width: '150px' }}
              allowClear={false}
            />
            <button
              onClick={() => onChange(value.clone().subtract(1, 'month'))}
              style={{
                padding: '4px 12px',
                borderRadius: token.borderRadius,
                border: `1px solid ${token.colorBorder}`,
                background: token.colorBgContainer,
                color: token.colorText,
                cursor: 'pointer',
              }}
            >
              ← {t('common.back')}
            </button>
            <button
              onClick={() => onChange(dayjs())}
              style={{
                padding: '4px 12px',
                borderRadius: token.borderRadius,
                border: `1px solid ${token.colorBorder}`,
                background: token.colorBgContainer,
                color: token.colorText,
                cursor: 'pointer',
              }}
            >
              {t('calendar.today')}
            </button>
            <button
              onClick={() => onChange(value.clone().add(1, 'month'))}
              style={{
                padding: '4px 12px',
                borderRadius: token.borderRadius,
                border: `1px solid ${token.colorBorder}`,
                background: token.colorBgContainer,
                color: token.colorText,
                cursor: 'pointer',
              }}
            >
              {t('common.next')} →
            </button>
          </div>
        </div>

        {/* Legenda e estatísticas */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '8px',
          background: token.colorPrimaryBg,
          borderRadius: token.borderRadius,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}>
          <Tag color="success" style={{ fontSize: '12px', margin: 0 }}>
            <CheckCircleOutlined /> {totalPaidHours.toFixed(1)}h
          </Tag>
          <Tag color="warning" style={{ fontSize: '12px', margin: 0 }}>
            <ClockCircleOutlined /> {totalUnpaidHours.toFixed(1)}h
          </Tag>
          <Tag color="blue" style={{ fontSize: '12px', margin: 0 }}>
            {(totalPaidHours + totalUnpaidHours).toFixed(1)}h total
          </Tag>
          <Tag style={{ fontSize: '12px', margin: 0 }}>
            {new Set(monthEntries.map(e => dayjs(e.clock_in).format('YYYY-MM-DD'))).size} {t('payroll.calendar.days')}
          </Tag>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: token.colorBgContainer,
      padding: '12px',
      borderRadius: token.borderRadius,
      border: `1px solid ${token.colorBorder}`,
      maxWidth: '350px',
      width: '100%',
    }}>
      <Calendar
        dateCellRender={dateCellRender}
        headerRender={headerRender}
        fullscreen={false}
        style={{ fontSize: '11px' }}
      />
      <style>{`
        .ant-picker-calendar-header {
          padding: 4px 0 !important;
        }
        .ant-picker-calendar-date-content {
          height: 24px !important;
        }
        .ant-picker-cell {
          padding: 1px !important;
        }
        .ant-picker-calendar-date-value {
          font-size: 11px !important;
        }
      `}</style>
    </div>
  );
}
