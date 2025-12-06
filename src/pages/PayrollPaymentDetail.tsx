import { Card, Descriptions, Button, Space, Typography, Tag, Alert, message } from 'antd';
import { ArrowLeftOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { usePayrollPayment } from '../hooks/usePayrollPayments';
import { useEmployee } from '../hooks/useEmployees';
import { formatUKCurrency, penceToPounds } from '../types/employee';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { generatePayslipPDF, type PayslipData } from '../utils/reports';
import { useState } from 'react';
import { formatHours } from '../utils/format-hours';

const { Title } = Typography;

export function PayrollPaymentDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: payment, isLoading } = usePayrollPayment(id);
  const { data: employee } = useEmployee(payment?.employee_id);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const handleGeneratePayslip = async () => {
    if (!payment || !employee) return;

    setIsPdfLoading(true);
    try {
      const payslipData: PayslipData = {
        paymentId: payment.payment_id,
        employee: {
          name: `${employee.first_name} ${employee.last_name}`,
          jobTitle: employee.job_title,
          employeeId: employee.employee_id,
        },
        period: {
          start: payment.period_start,
          end: payment.period_end,
        },
        paymentDate: payment.payment_date,
        hours: {
          regular: payment.regular_hours,
          overtime: payment.overtime_hours,
          total: payment.regular_hours + payment.overtime_hours,
        },
        rates: {
          hourly: employee.hourly_rate_pence,
        },
        amounts: {
          gross: payment.gross_amount_pence,
          deductions: payment.deductions_pence,
          net: payment.net_amount_pence,
        },
        notes: payment.notes || undefined,
        t,
      };

      await generatePayslipPDF(payslipData);
      message.success(t('payroll.downloadPayslip'));
    } catch (error) {
      console.error('Error generating payslip:', error);
      message.error(t('common.error'));
    } finally {
      setIsPdfLoading(false);
    }
  };

  if (isLoading || !payment) {
    return <div>{t('common.loading')}</div>;
  }

  const totalHours = payment.regular_hours + payment.overtime_hours;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/payroll-payments')} />
              <Title level={3} style={{ margin: 0 }}>
                {t('payroll.title')} #{payment.payment_id}
              </Title>
              <Tag color={payment.is_cancelled ? 'red' : 'green'}>
                {payment.is_cancelled ? t('payroll.cancelled') : t('payroll.paid')}
              </Tag>
            </div>
            {!payment.is_cancelled && employee && (
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                loading={isPdfLoading}
                onClick={handleGeneratePayslip}
              >
                {t('payroll.downloadPayslip')}
              </Button>
            )}
          </div>

          {payment.is_cancelled && payment.cancellation_reason && (
            <Alert
              message={t('payroll.paymentCancelled')}
              description={payment.cancellation_reason}
              type="error"
              showIcon
            />
          )}

          <Card title={t('payroll.employeeInformation')} size="small">
            <Descriptions bordered column={2}>
              <Descriptions.Item label={t('payroll.employee')}>
                {employee ? `${employee.first_name} ${employee.last_name}` : `ID: ${payment.employee_id}`}
              </Descriptions.Item>
              <Descriptions.Item label={t('employees.jobTitle')}>
                {employee?.job_title || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('employees.hourlyRate')}>
                {employee ? formatUKCurrency(employee.hourly_rate_pence) : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={t('payroll.paymentDetails')} size="small">
            <Descriptions bordered column={2}>
              <Descriptions.Item label={t('payroll.paymentDate')}>
                {dayjs(payment.payment_date).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll.payPeriod')}>
                {dayjs(payment.period_start).format('DD/MM/YYYY')} - {dayjs(payment.period_end).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll.regularHours')}>
                <Tag color="blue">{formatHours(payment.regular_hours)} hrs</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll.overtimeHours')}>
                <Tag color="orange">{formatHours(payment.overtime_hours)} hrs</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll.totalHours')}>
                <Tag color="green">{formatHours(totalHours)} hrs</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll.effectiveHourlyRate')}>
                {employee && totalHours > 0
                  ? `£${(penceToPounds(payment.gross_amount_pence) / totalHours).toFixed(2)}/hr`
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={t('payroll.paymentCalculation')} size="small">
            <Descriptions bordered column={1}>
              <Descriptions.Item label={t('payroll.regularPay')}>
                {formatUKCurrency(payment.regular_amount_pence)}
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll.overtimePay')}>
                {formatUKCurrency(payment.overtime_amount_pence)}
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll.bonuses')}>
                {payment.bonuses_pence > 0
                  ? formatUKCurrency(payment.bonuses_pence)
                  : '£0.00'}
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll.grossAmount')}>
                <strong>{formatUKCurrency(payment.gross_amount_pence)}</strong>
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll.taxDeductions')}>
                {payment.deductions_pence > 0
                  ? `-${formatUKCurrency(payment.deductions_pence)}`
                  : '£0.00'}
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll.netAmount')}>
                <strong style={{ fontSize: '18px', color: '#52c41a' }}>
                  {formatUKCurrency(payment.net_amount_pence)}
                </strong>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {payment.notes && (
            <Card title={t('common.notes')} size="small">
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{payment.notes}</p>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
}
