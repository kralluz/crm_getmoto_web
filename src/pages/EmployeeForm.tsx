import { Form, Input, Button, Card, DatePicker, InputNumber, Select, Space, Typography } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmployee, useCreateEmployee, useUpdateEmployee } from '../hooks/useEmployees';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import type { CreateEmployeeData } from '../types/employee';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

export function EmployeeForm() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const { data: employee } = useEmployee(id);
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();

  useEffect(() => {
    if (employee) {
      form.setFieldsValue({
        ...employee,
        start_date: dayjs(employee.start_date),
        end_date: employee.end_date ? dayjs(employee.end_date) : null,
        hourly_rate_pounds: employee.hourly_rate_pence / 100,
      });
    }
  }, [employee, form]);

  const onFinish = async (values: any) => {
    const data: CreateEmployeeData = {
      ...values,
      start_date: values.start_date.format('YYYY-MM-DD'),
      end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      hourly_rate_pence: Math.round(values.hourly_rate_pounds * 100),
    };

    try {
      if (isEdit) {
        await updateEmployee.mutateAsync({ id: id!, data });
      } else {
        await createEmployee.mutateAsync(data);
      }
      // Aguardar um pouco para garantir que a query foi invalidada
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/employees');
    } catch (error: any) {
      console.error('❌ Error saving employee:', error);
      
      const apiErrors = error?.response?.data?.errors;
      if (apiErrors && Array.isArray(apiErrors)) {
        const fieldErrors = apiErrors.map((err: any) => ({
          name: err.field,
          errors: [err.message],
        }));
        form.setFields(fieldErrors);
      }
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/employees')} />
            <Title level={3}>{isEdit ? t('employees.editEmployee') : t('employees.newEmployee')}</Title>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ contract_type: 'HOURLY', weekly_hours: 40 }}
          >
            <Form.Item
              label={t('employees.firstName')}
              name="first_name"
              rules={[{ required: true, message: t('employees.requiredFirstName') }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={t('employees.lastName')}
              name="last_name"
              rules={[{ required: true, message: t('employees.requiredLastName') }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={t('employees.email')}
              name="email"
              rules={[{ type: 'email', message: t('employees.invalidEmail') }]}
            >
              <Input />
            </Form.Item>

            <Form.Item label={t('employees.phone')} name="phone">
              <Input />
            </Form.Item>

            <Form.Item label={t('employees.nationalInsurance')} name="national_insurance">
              <Input />
            </Form.Item>

            <Form.Item
              label={t('employees.jobTitle')}
              name="job_title"
              rules={[{ required: true, message: t('employees.requiredJobTitle') }]}
            >
              <Input placeholder="e.g., Mechanic, Assistant" />
            </Form.Item>

            <Form.Item
              label={t('employees.hourlyRate')}
              name="hourly_rate_pounds"
              rules={[{ required: true, message: t('employees.requiredHourlyRate') }]}
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                prefix="£"
              />
            </Form.Item>

            <Form.Item
              label={t('employees.contractType')}
              name="contract_type"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="HOURLY">{t('employees.hourly')}</Select.Option>
                <Select.Option value="SALARY">{t('employees.salary')}</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={t('employees.weeklyHours')}
              name="weekly_hours"
              rules={[
                { required: true, message: t('employees.requiredWeeklyHours') },
                {
                  validator: (_, value) => {
                    if (value === null || value === undefined) {
                      return Promise.reject(new Error(t('employees.requiredWeeklyHours')));
                    }
                    if (value < 1 || value > 168) {
                      return Promise.reject(new Error('Horas semanais devem estar entre 1 e 168'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber 
                min={1} 
                max={168} 
                style={{ width: '100%' }}
                parser={(value) => {
                  const parsed = Number(value);
                  if (isNaN(parsed) || parsed < 1) return 1;
                  if (parsed > 168) return 168;
                  return Math.floor(parsed);
                }}
              />
            </Form.Item>

            <Form.Item
              label={t('employees.startDate')}
              name="start_date"
              rules={[{ required: true, message: t('employees.requiredStartDate') }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label={`${t('employees.endDate')} (${t('common.observations').toLowerCase()})`} name="end_date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label={t('employees.address')} name="address">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={createEmployee.isPending || updateEmployee.isPending}
                >
                  {isEdit ? t('common.update') : t('common.create')}
                </Button>
                <Button onClick={() => navigate('/employees')}>
                  {t('common.cancel')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
